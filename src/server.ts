import crypto from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import type { HmctsLogger } from '@hmcts/nodejs-logging';
import config from 'config';
import cookieParser from 'cookie-parser';
import express, {
  type NextFunction,
  type Request,
  RequestHandler,
  type Response,
} from 'express';
import * as httpProxy from 'http-proxy-middleware';
type ProxyOptions = httpProxy.Options;

import { AppInsights } from './modules/appinsights';
import { Helmet } from './modules/helmet';
import { HmctsLoggerBridge } from './modules/logger';
import { PropertiesVolume } from './modules/properties-volume';
import { setupHealthcheck } from './routes/health';
import { setupInfoRoute } from './routes/info';
import authRoutes from './routes/sso';

// ----- Paths (ESM-safe)
const __dirname = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = join(__dirname, '../browser');

// ----- App + Angular engine
const app = express();
const angularApp = new AngularNodeAppEngine();
app.use(cookieParser());

// ----- Env
const env = process.env['NODE_ENV'] || 'development';
const developmentMode = env === 'development';
const CONNECTION_STRING = config.get<string>(
  'secrets.apps-reg.app-insights-connection-string',
);

// ----- Platform modules
await new PropertiesVolume().enableFor(app);
new Helmet(developmentMode).enableFor(app);
AppInsights.enable(CONNECTION_STRING);

// ---- helpers
const logger: HmctsLogger = HmctsLoggerBridge.enable(
  'hmcts applications register - server',
  AppInsights.client(),
);

// ----- Routes
setupHealthcheck(app);
setupInfoRoute(app);
app.use(authRoutes);

// ----- Static
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

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

// CSRF
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
        secure: process.env['NODE_ENV'] === 'production',
        path: '/',
      });
    }
  }
  next();
});

const proxyOptions: ProxyOptions = {
  target: 'http://localhost:4550',
  changeOrigin: true,
  xfwd: true,
};

const apiProxy: RequestHandler = httpProxy.createProxyMiddleware(proxyOptions);

app.use((req: Request, res: Response, next: NextFunction) => {
  const accept = String(req.headers['accept'] ?? '');
  const path = req.path;

  const isHtmlNav = accept.includes('text/html');
  const isStatic = /^\/(assets|browser|favicon\.ico)/.test(path);
  const isNodeRoute = /^\/(health|info|sso|login|logout)(\/|$)/.test(path);

  if (isHtmlNav || isStatic || isNodeRoute) {
    return next();
  }

  if (
    req.method === 'POST' ||
    req.method === 'PUT' ||
    req.method === 'PATCH' ||
    req.method === 'DELETE'
  ) {
    const cookies = cookiesOf(req);
    const cookie = cookies['XSRF-TOKEN'];
    const header = req.get('X-XSRF-TOKEN');
    if (!cookie || !header || cookie !== header) {
      return res.sendStatus(403);
    }
  }

  return apiProxy(req, res, next);
});
