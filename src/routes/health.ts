<<<<<<< HEAD
import type { Application } from "express";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const healthcheck =
  require("@hmcts/nodejs-healthcheck") as typeof import("@hmcts/nodejs-healthcheck");

export function setupHealthcheck(app: Application): void {
  app.locals["shutdown"] = false;

  const healthCheckConfig: import("@hmcts/nodejs-healthcheck").HealthCheckConfig =
=======
import type { Application } from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const healthcheck =
  require('@hmcts/nodejs-healthcheck') as typeof import('@hmcts/nodejs-healthcheck');

export function setupHealthcheck(app: Application): void {
  app.locals['shutdown'] = false;

  const healthCheckConfig: import('@hmcts/nodejs-healthcheck').HealthCheckConfig =
>>>>>>> 38048e2 (Rebasing Code)
    {
      checks: {
        appCheck: healthcheck.raw(() => healthcheck.up()),
      },
      readinessChecks: {
        shutdownCheck: healthcheck.raw(() => {
<<<<<<< HEAD
          return app.locals["shutdown"] ? healthcheck.down() : healthcheck.up();
=======
          return app.locals['shutdown'] ? healthcheck.down() : healthcheck.up();
>>>>>>> 38048e2 (Rebasing Code)
        }),
      },
    };

  healthcheck.addTo(app, healthCheckConfig);
}
