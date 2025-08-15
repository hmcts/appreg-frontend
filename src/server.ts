import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { Helmet } from './modules/helmet';
import { AppInsights } from './modules/appinsights';
import { PropertiesVolume } from './modules/properties-volume';
import { setupHealthcheck } from './routes/health';
import * as os from 'node:os';
import { infoRequestHandler } from '@hmcts/info-provider';
import '@angular/compiler';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const env = process.env['NODE_ENV'] || 'development';
const developmentMode = env === 'development';

await new PropertiesVolume().enableFor(app);
await new AppInsights().enable();
new Helmet(developmentMode).enableFor(app);

setupHealthcheck(app);

app.get(
  '/info',
  infoRequestHandler({
    extraBuildInfo: {
      host: os.hostname(),
      name: 'hmcts-court-fines',
      uptime: process.uptime(),
    },
    info: {},
  }),
);

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

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

    console.log(
      `Apps Reg Node Express server listening on http://localhost:${port}`,
    );
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
