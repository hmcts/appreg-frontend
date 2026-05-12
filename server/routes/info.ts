import { infoRequestHandler } from '@hmcts/info-provider';
import { Express } from 'express';

export function setupInfoRoute(app: Express): void {
  app.get(
    '/info',
    infoRequestHandler({
      extraBuildInfo: {
        name: 'hmcts-app-reg',
        uptime: process.uptime(),
      },
      info: {},
    }),
  );
}
