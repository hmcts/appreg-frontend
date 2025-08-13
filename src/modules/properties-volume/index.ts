<<<<<<< HEAD
import type { IConfig } from "config";
import type * as PV from "@hmcts/properties-volume";
import { Application } from "express";
import { createRequire } from "module";
=======
import type { IConfig } from 'config';
import type * as PV from '@hmcts/properties-volume';
import { Application } from 'express';
import { createRequire } from 'module';
>>>>>>> 38048e2 (Rebasing Code)

const require = createRequire(import.meta.url);

export class PropertiesVolume {
  async enableFor(server: Application): Promise<void> {
<<<<<<< HEAD
    if (server.locals["ENV"] !== "development") {
      const { default: config } = (await import("config")) as {
        default: IConfig;
      };
      const pvm = require("@hmcts/properties-volume") as typeof PV;
      const { get, set } = require("lodash") as {
        get: (typeof import("lodash"))["get"];
        set: (typeof import("lodash"))["set"];
=======
    if (server.locals['ENV'] !== 'development') {
      const { default: config } = (await import('config')) as {
        default: IConfig;
      };
      const pvm = require('@hmcts/properties-volume') as typeof PV;
      const { get, set } = require('lodash') as {
        get: (typeof import('lodash'))['get'];
        set: (typeof import('lodash'))['set'];
>>>>>>> 38048e2 (Rebasing Code)
      };

      pvm.addTo(config);
      this.setSecret(
        config,
        get,
        set,
<<<<<<< HEAD
        "secrets.rpe.AppInsightsInstrumentationKey",
        "appInsights.instrumentationKey",
=======
        'secrets.rpe.AppInsightsInstrumentationKey',
        'appInsights.instrumentationKey',
>>>>>>> 38048e2 (Rebasing Code)
      );
    }
  }

  private setSecret(
    config: IConfig,
    get: <T>(obj: unknown, path: string) => T,
    set: (obj: unknown, path: string, value: unknown) => void,
    fromPath: string,
    toPath: string,
  ): void {
    if (config.has(fromPath)) {
      const value = config.get<unknown>(fromPath);
      set(config, toPath, value);
    }
  }
}
