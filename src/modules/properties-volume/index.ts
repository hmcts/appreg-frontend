import type * as PV from '@hmcts/properties-volume';
import type { IConfig } from 'config';
import type { Application } from 'express';

export class PropertiesVolume {
  async enableFor(server: Application): Promise<void> {
    if (server.locals['ENV'] !== 'development') {
      const { default: config } = (await import('config')) as {
        default: IConfig;
      };

      // Dynamically import CJS modules without createRequire/import.meta
      const pvm = (await import(
        '@hmcts/properties-volume'
      )) as unknown as typeof PV;
      const { get, set } = (await import('lodash')) as Pick<
        typeof import('lodash'),
        'get' | 'set'
      >;

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
