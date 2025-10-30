import express from 'express';
import path from 'node:path';
import history from 'connect-history-api-fallback';
import type { Server } from 'node:http';

const DIST_DIR = path.resolve('dist/appreg-frontend/browser');

export async function startStaticSpaServer(): Promise<{
  server: Server;
  baseUrl: string;
}> {
  const app = express();

  // SPA fallback -> always serve index.html
  app.use(history({ index: '/index.html', verbose: false }));

  // static assets
  app.use(express.static(DIST_DIR, { extensions: ['html'] }));

  // start on random port
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}
