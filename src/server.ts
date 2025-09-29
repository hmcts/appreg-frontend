import type { ClientRequest, IncomingMessage } from 'http';
import crypto from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import type { AccountInfo } from '@azure/msal-node';
import type { HmctsLogger } from '@hmcts/nodejs-logging';
import config from 'config';
import cookieParser from 'cookie-parser';
import express, {
  type NextFunction,
  type Request,
  RequestHandler,
  type Response,
} from 'express';
import session from 'express-session';
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
import ssoRouter, { cca } from './routes/sso';

// ----- Paths (ESM-safe)
const __dirname = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = join(__dirname, '../browser');

// ----- App + Angular engine
const app = express();
const angularApp = new AngularNodeAppEngine();

// Trust proxy (for secure cookies behind ingress)
app.set('trust proxy', 1);
app.use(cookieParser());

// ----- Env
const env = process.env['NODE_ENV'] || 'development';
const developmentMode = env === 'development';
const CONNECTION_STRING = config.get<string>(
  'secrets.appreg.app-insights-connection-string-fe',
);

// API + scopes for resource access
const apiBase: string = config.get<string>('api.baseUrl');
const apiScopes: string[] = config.has('api.scopes')
  ? config.get<string[]>('api.scopes')
  : [];

// ----- Platform modules
await new PropertiesVolume().enableFor(app);
new Helmet(developmentMode).enableFor(app);
AppInsights.enable(CONNECTION_STRING);

// ---- helpers
const logger: HmctsLogger = HmctsLoggerBridge.enable(
  'hmcts applications register - server',
  AppInsights.client(),
);

// ----- Session (must be before auth/proxy/SSR so req.session is available everywhere)
app.use(
  session({
    name: config.has('session.cookieName')
      ? config.get<string>('session.cookieName')
      : 'sid',
    secret: config.get<string>('session.secret'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.has('session.secure')
        ? config.get<boolean>('session.secure')
        : env === 'production',
    },
  }),
);

// ----- Routes
setupHealthcheck(app);
setupInfoRoute(app);
app.use(ssoRouter);

// ----- Static
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// CSRF + proxy
type Cookies = Record<string, string | undefined>;

function cookiesOf(req: Request): Cookies {
  const c = (req as Request & { cookies?: unknown }).cookies;
  return c && typeof c === 'object' && !Array.isArray(c) ? (c as Cookies) : {};
}

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

interface SessionShape {
  account?: AccountInfo;
  tokenCache?: string;
}

type ReqWithSession = Request & { session?: SessionShape };
type ReqWithToken = Request & {
  apiAccessToken?: string | null;
  session?: SessionShape;
};

// Acquire an API access token from the session-backed MSAL cache
async function acquireApiToken(req: ReqWithSession): Promise<string | null> {
  const sess = req.session;
  const account = sess?.account;
  const cache = sess?.tokenCache;

  if (!account || !cache || apiScopes.length === 0) {
    console.info(
      `[proxy] acquireApiToken: missing ${
        !account ? 'account' : !cache ? 'cache' : 'scopes'
      }`,
    );
    return null;
  }

  try {
    // Hydrate cache for this request
    cca.getTokenCache().deserialize(cache);
    const result = await cca.acquireTokenSilent({
      account,
      scopes: apiScopes,
      // forceRefresh: true, // optionally enable if you suspect cache staleness
    });
    if (result?.accessToken) {
      // Persist any cache updates (refresh tokens, expiry, etc.)
      if (sess) {
        sess.tokenCache = cca.getTokenCache().serialize();
      }
      console.info(
        `[proxy] acquired token exp=${result.expiresOn?.toISOString?.() ?? 'n/a'}`,
      );
      return result.accessToken;
    }
    console.warn('[proxy] acquireTokenSilent returned no accessToken');
  } catch (e) {
    console.warn('[proxy] acquireTokenSilent failed', e);
  }
  return null;
}

const proxyOptions: ProxyOptions = {
  target: apiBase,
  changeOrigin: true,
  xfwd: true,
  secure: env === 'production',
  on: {
    proxyReq: (
      proxyReq: ClientRequest,
      req: IncomingMessage & { apiAccessToken?: string | null },
    ) => {
      const token = req.apiAccessToken ?? null;
      const urlShown = req.url ?? ''; // ✅ typed url from IncomingMessage
      console.info(
        `[proxy] forwarding ${urlShown} tokenPresent=${Boolean(token)}`,
      );
      if (token) {
        proxyReq.setHeader('authorization', `Bearer ${token}`);
      }
    },
  },
};

const apiProxy: RequestHandler = createProxyMiddleware(proxyOptions);

app.use(async (req: Request, res: Response, next: NextFunction) => {
  const accept = String(req.headers['accept'] ?? '');
  const path = req.path;

  const isHtmlNav = accept.includes('text/html');
  const isStatic =
    req.method === 'GET' &&
    (path.startsWith('/assets/') ||
      path.startsWith('/browser/') ||
      /\.(?:js|mjs|css|map|json|png|jpe?g|gif|svg|webp|ico|woff2?|ttf)$/.test(
        path,
      ));
  const isNodeRoute = /^\/(health|info|sso|login|logout)(\/|$)/.test(path);

  if (isHtmlNav || isStatic || isNodeRoute) {
    return next();
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const cookie = cookiesOf(req)['XSRF-TOKEN'];
    const header = req.get('X-XSRF-TOKEN');
    if (!cookie || !header || cookie !== header) {
      return res.sendStatus(403);
    }
  }

  // Debug: show session + scopes before attempting token acquisition
  console.info(
    `[proxy] path=${req.path} hasSession=${Boolean(
      (req as ReqWithSession).session?.account,
    )} scopes="${apiScopes.join(' ')}"`,
  );

  // Stash a Bearer token (if available) for the proxy to inject
  (req as ReqWithToken).apiAccessToken = await acquireApiToken(
    req as ReqWithSession,
  );

  return apiProxy(req, res, next);
});

// ----- SSR handler
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// ----- Listen (only when running as entrypoint)
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    logger.info(
      `Apps Reg Node Express server listening on http://localhost:${port}`,
    );
  });
}

// ----- Export for CLI/dev server / Cloud Functions
export const reqHandler = createNodeRequestHandler(app);
