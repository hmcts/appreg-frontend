import type { IncomingMessage } from 'http';
import crypto from 'node:crypto';
import { Socket } from 'node:net';

import type { AccountInfo } from '@azure/msal-node';
import cookieParser from 'cookie-parser';
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import {
  type Options as ProxyOptions,
  createProxyMiddleware,
} from 'http-proxy-middleware';

import { AppInsights } from './modules/appinsights';
import { Helmet } from './modules/helmet';
import { HmctsLoggerBridge } from './modules/logger';
import { PropertiesVolume } from './modules/properties-volume';
import { setupHealthcheck } from './routes/health';
import { setupInfoRoute } from './routes/info';
import { getCca, setupSsoRoutes } from './routes/sso';
import { setupSession } from './session';

type LoggerLike = {
  info: (message: string, ...meta: unknown[]) => void;
  warn: (message: string, ...meta: unknown[]) => void;
  error: (message: string, ...meta: unknown[]) => void;
  debug?: (message: string, ...meta: unknown[]) => void;
};

type SessionShape = {
  account?: AccountInfo;
  tokenCache?: string;
};

type ReqWithSession = Request & { session?: SessionShape };
type ReqWithToken = Request & { apiAccessToken?: string | null };

type Cookies = Record<string, string | undefined>;

type ConfigLike = {
  has: (key: string) => boolean;
  get: <T = unknown>(key: string) => T;
};

function toErrorMeta(e: unknown): {
  name?: string;
  message: string;
  stack?: string;
} {
  if (e instanceof Error) {
    return { name: e.name, message: e.message, stack: e.stack };
  }
  return { message: String(e) };
}

function getApiAccessToken(req: IncomingMessage): string | null {
  // req is typed as IncomingMessage by http-proxy-middleware, but at runtime it is an Express Request.
  // We safely read our custom property without widening the callback type.
  const maybe = req as unknown;

  if (!maybe || typeof maybe !== 'object') {
    return null;
  }

  const token = (maybe as { apiAccessToken?: unknown }).apiAccessToken;
  return typeof token === 'string' ? token : null;
}

function cookiesOf(req: Request): Cookies {
  const c = (req as Request & { cookies?: unknown }).cookies;
  return c && typeof c === 'object' && !Array.isArray(c) ? (c as Cookies) : {};
}

function isLoggerLike(x: unknown): x is LoggerLike {
  if (!x || typeof x !== 'object') {
    return false;
  }
  const o = x as Record<string, unknown>;
  return (
    typeof o['info'] === 'function' &&
    typeof o['warn'] === 'function' &&
    typeof o['error'] === 'function'
  );
}

/**
 * Decide whether a request should go to the Angular dev server (UI) or the API.
 * Key signals:
 *  - sec-fetch-dest: document/script/style/image/font => UI
 *  - Vite/Angular internal paths => UI
 *  - Static extensions => UI
 *  - Otherwise => API (e.g. XHR/fetch to /application-lists)
 */
function shouldGoToUi(req: Request): boolean {
  const path = req.path;

  // Any navigations / assets / scripts / styles should go to UI
  const dest = String(req.headers['sec-fetch-dest'] ?? '');
  if (
    dest === 'document' ||
    dest === 'script' ||
    dest === 'style' ||
    dest === 'image' ||
    dest === 'font' ||
    dest === 'worker' ||
    dest === 'sharedworker' ||
    dest === 'manifest'
  ) {
    return true;
  }

  // Accept HTML => UI
  const accept = String(req.headers['accept'] ?? '');
  if (accept.includes('text/html')) {
    return true;
  }

  // Vite / Angular dev internals (these often have no file extension)
  if (
    path.startsWith('/@vite/') ||
    path.startsWith('/@fs/') ||
    path.startsWith('/@id/') ||
    path.startsWith('/__vite') ||
    path.startsWith('/src/')
  ) {
    return true;
  }

  // Common static file extensions
  if (
    /\.(?:css|js|mjs|map|json|png|jpe?g|gif|svg|webp|ico|woff2?|ttf)$/.test(
      path,
    )
  ) {
    return true;
  }

  // Otherwise treat as API/XHR
  return false;
}

async function bootstrap(): Promise<void> {
  const app = express();

  app.set('trust proxy', 1);
  app.use(cookieParser());

  await new PropertiesVolume().enableFor(app);

  const configModule = (await import('config')) as unknown as {
    default: ConfigLike;
  };
  const config = configModule.default;

  const env = process.env['NODE_ENV'] || 'development';
  const developmentMode = env === 'development';
  const isProd = env === 'production';

  const ngDevServer = process.env['NG_DEV_SERVER'] || 'http://localhost:4200';

  new Helmet(developmentMode).enableFor(app);
  AppInsights.enable();

  const maybeLogger = HmctsLoggerBridge.enable(
    'hmcts applications register - dev server',
    AppInsights.client(),
  );

  const logger: LoggerLike = isLoggerLike(maybeLogger)
    ? maybeLogger
    : {
        info: (m, ...meta) => console.log(m, ...meta),
        warn: (m, ...meta) => console.warn(m, ...meta),
        error: (m, ...meta) => console.error(m, ...meta),
      };

  const cookieName = config.has('session.cookieName')
    ? config.get<string>('session.cookieName')
    : isProd
      ? 'appreg.sid'
      : 'sid';

  app.use(
    await setupSession({
      isProd,
      useRedis: false,
      redisHost: 'appreg-stg.redis.cache.windows.net',
      redisAccessKey: '',
      cookieName,
      sessionSecret: config.get<string>('secrets.appreg.app-session-secret-fe'),
      prefix: 'appreg:sess:',
      secureInProd: config.has('session.secure')
        ? config.get<boolean>('session.secure')
        : true,
    }),
  );

  // Node routes mounted locally
  setupHealthcheck(app);
  setupInfoRoute(app);
  setupSsoRoutes(app);

  // CSRF cookie for API mutations
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method === 'GET' ||
      req.method === 'HEAD' ||
      req.method === 'OPTIONS'
    ) {
      const cookies = cookiesOf(req);
      if (!cookies['XSRF-TOKEN']) {
        const token = crypto.randomBytes(16).toString('hex');
        res.cookie('XSRF-TOKEN', token, {
          httpOnly: false,
          sameSite: 'lax',
          secure: env === 'production',
          path: '/',
        });
      }
    }
    next();
  });

  // API base (staging override supported)
  const apiBase: string =
    process.env['APPREG_API_BASE_URL'] ?? config.get<string>('api.baseUrl');

  const clientId = config.get<string>('secrets.appreg.azure-app-id-fe');
  const apiScopes: string[] = clientId ? [`api://${clientId}/frontend`] : [];

  async function acquireApiToken(req: ReqWithSession): Promise<string | null> {
    const sess = req.session;
    const account = sess?.account;
    const cache = sess?.tokenCache;

    if (!account || !cache || apiScopes.length === 0) {
      return null;
    }

    try {
      getCca().getTokenCache().deserialize(cache);
      const result = await getCca().acquireTokenSilent({
        account,
        scopes: apiScopes,
      });

      if (result?.accessToken) {
        if (sess) {
          sess.tokenCache = getCca().getTokenCache().serialize();
        }
        return result.accessToken;
      }
    } catch (e: unknown) {
      logger.warn('[proxy] acquireTokenSilent failed', toErrorMeta(e));
    }
    return null;
  }

  const apiProxyOptions: ProxyOptions = {
    target: apiBase,
    changeOrigin: true,
    xfwd: true,
    secure: false,
    on: {
      proxyReq: (proxyReq, req) => {
        const token = getApiAccessToken(req);
        if (token) {
          proxyReq.setHeader('authorization', `Bearer ${token}`);
        }
      },
      error: (
        err: Error,
        _req: IncomingMessage,
        res: import('http').ServerResponse | Socket,
      ) => {
        logger.error('[api-proxy] error', toErrorMeta(err));
        if (res instanceof Socket) {
          res.destroy();
          return;
        }
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'text/plain' });
        }
        res.end('API proxy error');
      },
    },
  };

  const apiProxy: RequestHandler = createProxyMiddleware(apiProxyOptions);

  // Route split: UI-like requests -> next() -> UI proxy. Everything else -> API proxy.
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;

    // Keep your node routes local (don’t send them to API or UI)
    if (
      path.startsWith('/health') ||
      path.startsWith('/info') ||
      path.startsWith('/sso')
    ) {
      return next();
    }

    if (shouldGoToUi(req)) {
      return next();
    }

    // CSRF on mutations (API only)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const cookie = cookiesOf(req)['XSRF-TOKEN'];
      const header = req.get('X-XSRF-TOKEN');
      if (!cookie || !header || cookie !== header) {
        return res.sendStatus(403);
      }
    }

    (req as ReqWithToken).apiAccessToken = await acquireApiToken(
      req as ReqWithSession,
    );
    return apiProxy(req, res, next);
  });

  // UI proxy (catch-all) -> Angular dev server
  const uiProxyOptions: ProxyOptions = {
    target: ngDevServer,
    changeOrigin: true,
    ws: true,
    secure: false,
    on: {
      error: (
        err: Error,
        _req: IncomingMessage,
        res: import('http').ServerResponse | Socket,
      ) => {
        logger.error('[ui-proxy] error', toErrorMeta(err));
        if (res instanceof Socket) {
          res.destroy();
          return;
        }
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'text/plain' });
        }
        res.end('UI proxy error');
      },
    },
  };

  app.use(createProxyMiddleware(uiProxyOptions));

  const port = Number(process.env['PORT'] ?? 4000);
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    logger.info(`Apps Reg dev server listening on http://localhost:${port}`);
  });
}

bootstrap().catch((e: unknown) => {
  console.error(toErrorMeta(e));
  process.exit(1);
});
