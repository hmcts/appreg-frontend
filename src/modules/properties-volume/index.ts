import type { IConfig } from 'config';
import type { Application } from 'express';

export class PropertiesVolume {
  async enableFor(server: Application): Promise<void> {
    if (server.locals['ENV'] === 'development') {return;}

    const { default: config } = (await import('config')) as { default: IConfig };

    // --- @hmcts/properties-volume (CJS) ------------------------------------
    const pvMod = await import('@hmcts/properties-volume');
    const addToMaybe =
      (pvMod as { addTo?: (cfg: IConfig, opts?: unknown) => void }).addTo ??
      (pvMod as { default?: { addTo?: (cfg: IConfig, opts?: unknown) => void } })
        .default?.addTo;

    if (typeof addToMaybe !== 'function') {
      throw new Error('properties-volume.addTo not found (CJS/ESM interop)');
    }
    const addTo = addToMaybe as (cfg: IConfig, opts?: unknown) => void;

    // --- lodash (CJS) ------------------------------------------------------
    const ldMod = await import('lodash');
    const getMaybe = (ldMod as { get?: <T>(o: unknown, p: string) => T }).get
      ?? (ldMod as { default?: { get?: <T>(o: unknown, p: string) => T } }).default?.get;
    const setMaybe = (ldMod as { set?: (o: unknown, p: string, v: unknown) => void }).set
      ?? (ldMod as { default?: { set?: (o: unknown, p: string, v: unknown) => void } }).default?.set;

    if (typeof getMaybe !== 'function' || typeof setMaybe !== 'function') {
      throw new Error('lodash.get/set not found (CJS/ESM interop)');
    }
    const get = getMaybe as <T>(obj: unknown, path: string) => T;
    const set = setMaybe as (obj: unknown, path: string, value: unknown) => void;

    // Apply properties volume and copy secret if present
    addTo(config);
    this.setSecret(
      config,
      get,
      set,
      'secrets.rpe.AppInsightsInstrumentationKey',
      'appInsights.instrumentationKey',
    );
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
