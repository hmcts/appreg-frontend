import { join } from 'node:path';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { type HmctsLogger, Logger } from '@hmcts/nodejs-logging';
import express from 'express';

import { AppInsights } from './modules/appinsights';
import { Helmet } from './modules/helmet';
import { PropertiesVolume } from './modules/properties-volume';
import { setupHealthcheck } from './routes/health';
import { setupInfoRoute } from './routes/info';
import authRoutes from './routes/sso';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const env = process.env['NODE_ENV'] || 'development';
const developmentMode = env === 'development';

await new PropertiesVolume().enableFor(app);
await new AppInsights().enable();
new Helmet(developmentMode).enableFor(app);

setupHealthcheck(app);
setupInfoRoute(app);
app.use(authRoutes);

const logger: HmctsLogger = Logger.getLogger(
  'hmcts applications register - server',
);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
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

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
