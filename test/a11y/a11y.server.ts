import type { Server } from 'node:http';
import path from 'node:path';

import history from 'connect-history-api-fallback';
import express from 'express';

const DIST_DIR = path.resolve('dist/appreg-frontend/browser');

export async function startStaticSpaServer(): Promise<{
  server: Server;
  baseUrl: string;
}> {
  const app = express();

  // static assets
  app.use(express.static(DIST_DIR, { extensions: ['html'] }));
  // SPA fallback -> always serve index.html
  app.use(history({ index: '/index.html', verbose: false }));

  //Stub endpoints
  app.get('/sso/me', (_req, res) => res.status(204).end());
  app.get('/court-locations', (_req, res) => res.json([]));
  app.get('/criminal-justice-areas', (_req, res) => res.json([]));

  // start on random port
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}
