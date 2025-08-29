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
import express from 'express';

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

const logger: HmctsLogger = HmctsLoggerBridge.enable(
  'hmcts applications register - server',
  AppInsights.client(),
);

// ----- CSP, workaround for CSP issue for testing DEV ENV ONLY
if (developmentMode) {
  // TODO: Production ready needs the API origin added instead of localhost
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; connect-src 'self' http://localhost:8080; img-src 'self'; script-src 'self'; style-src 'self'",
    );
    next();
  });
}

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
