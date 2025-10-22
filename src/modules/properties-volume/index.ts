import { createRequire } from 'module';

import type * as PV from '@hmcts/properties-volume';
import { addFromAzureVault } from '@hmcts/properties-volume';
import { IConfig } from 'config';
import { Application } from 'express';

const require = createRequire(import.meta.url);

export class PropertiesVolume {
  async enableFor(server: Application): Promise<void> {

    if (process.env['NODE_ENV'] === 'development') {
      const { default: config } = (await import('config')) as {
        default: IConfig;
      };

      await addFromAzureVault(config, {
        pathToHelmChart: 'charts/appreg-frontend/values.yaml', env: 'stg'
      });
    }

    if (server.locals['ENV'] !== 'development') {
      const { default: config } = (await import('config')) as {
        default: IConfig;
      };

      const pvm = require('@hmcts/properties-volume') as typeof PV;

      pvm.addTo(config);
    }
  }
}
