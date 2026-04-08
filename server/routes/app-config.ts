import type { Application, Request, Response } from 'express';

import appConfig from '../app-config';

export function setupAppConfigRoute(app: Application): void {
  app.get('/app/config', (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(appConfig());
  });
}
