import { Express } from 'express';
import os from 'node:os';
import { infoRequestHandler } from '@hmcts/info-provider';

export function setupInfoRoute(app: Express): void {
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
}
