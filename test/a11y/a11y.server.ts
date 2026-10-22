import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import path from 'node:path';

import express from 'express';

const DIST_DIR = path.resolve('dist/appreg-frontend/browser');

export async function startStaticSpaServer(distDir = DIST_DIR): Promise<{
  server: Server;
  baseUrl: string;
}> {
  const index = path.join(distDir, 'index.csr.html');
  // Read the SPA once before listening, rather than reading it in the fallback.
  const html = await readFile(index, 'utf8').catch(() => {
    throw new Error('Accessibility build missing: run yarn build:ssr first');
  });
  const app = express();
  app.use(express.static(distDir, { index: false }));
  // Only document navigations receive the SPA. Missing scripts and API calls stay 404s.
  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      req.headers.accept?.includes('text/html') &&
      !path.extname(req.path)
    ) {
      res.type('html').send(html);
      return;
    }
    next();
  });

  const server = await new Promise<Server>((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
    s.on('error', reject);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}
