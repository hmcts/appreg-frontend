import { createRequire } from 'module';

import type { Application } from 'express';

const require = createRequire(import.meta.url);

const healthcheck =
  require('@hmcts/nodejs-healthcheck') as typeof import('@hmcts/nodejs-healthcheck');

export function setupHealthcheck(app: Application): void {
  app.locals['shutdown'] = false;

  const healthCheckConfig: import('@hmcts/nodejs-healthcheck').HealthCheckConfig =
    {
      checks: {
        appCheck: healthcheck.raw(() => healthcheck.up()),
      },
      readinessChecks: {
        shutdownCheck: healthcheck.raw(() => {
          return app.locals['shutdown'] ? healthcheck.down() : healthcheck.up();
        }),
      },
    };

  healthcheck.addTo(app, healthCheckConfig);
}
