import os from 'node:os';

import { infoRequestHandler } from '@hmcts/info-provider';
import { Express } from 'express';

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
