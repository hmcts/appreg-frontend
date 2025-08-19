import { createRequire } from 'module';

import type * as PV from '@hmcts/properties-volume';
import type { IConfig } from 'config';
import { Application } from 'express';

const require = createRequire(import.meta.url);

export class PropertiesVolume {
  async enableFor(server: Application): Promise<void> {
    if (server.locals['ENV'] !== 'development') {
      const { default: config } = (await import('config')) as {
        default: IConfig;
      };
      const pvm = require('@hmcts/properties-volume') as typeof PV;
      const { get, set } = require('lodash') as {
        get: (typeof import('lodash'))['get'];
        set: (typeof import('lodash'))['set'];
      };

      pvm.addTo(config);
      this.setSecret(
        config,
        get,
        set,
        'secrets.rpe.AppInsightsInstrumentationKey',
        'appInsights.instrumentationKey',
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
