<<<<<<< HEAD
declare module "@hmcts/nodejs-healthcheck" {
  import type { Application } from "express";
=======
declare module '@hmcts/nodejs-healthcheck' {
  import type { Application } from 'express';
>>>>>>> 38048e2 (Rebasing Code)

  export interface HealthCheckConfig {
    checks?: Record<string, () => never>;
    readinessChecks?: Record<string, () => never>;
  }

  export function raw(fn: () => never): never;
  export function up(): never;
  export function down(): never;
  export function addTo(app: Application, config: HealthCheckConfig): void;
}
