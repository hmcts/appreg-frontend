import type { IConfig } from 'config';
import type { Application } from 'express';

// --- Mocks -----------------------------------------------------------------
type MockConfig = {
  has: jest.Mock<boolean, [string]>;
  get: jest.Mock<unknown, [string]>;
};

jest.mock('config', () => {
  const cfg: MockConfig = {
    has: jest.fn<boolean, [string]>(),
    get: jest.fn<unknown, [string]>(),
  };
  return { __esModule: true, default: cfg };
});

jest.mock('@hmcts/properties-volume', () => ({
  addTo: jest.fn<void, [IConfig]>(),
}));

type GetArgs = [obj: unknown, path: string];
type SetArgs = [obj: unknown, path: string, value: unknown];

const lodashGet: jest.Mock<unknown, GetArgs> = jest.fn();
const lodashSet: jest.Mock<void, SetArgs> = jest.fn();

jest.mock('lodash', () => ({
  get: lodashGet,
  set: lodashSet,
}));

// Helpers to access mocks with types
const getConfigMock = (): MockConfig => jest.requireMock('config').default;

const getPVMock = () => jest.requireMock('@hmcts/properties-volume');

import { PropertiesVolume } from '../../../../src/modules/properties-volume';

describe('PropertiesVolume.enableFor', () => {
  const KEY_FROM = 'secrets.rpe.AppInsightsInstrumentationKey';
  const KEY_TO = 'appInsights.instrumentationKey';

  const makeServer = (env: string): Application =>
    ({ locals: { ENV: env } }) as unknown as Application;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('does nothing in development', async () => {
    const server = makeServer('development');
    const cfg = getConfigMock();
    const pv = getPVMock();

    const svc = new PropertiesVolume();
    await svc.enableFor(server);

    expect(pv.addTo).not.toHaveBeenCalled();
    expect(cfg.has).not.toHaveBeenCalled();
    expect(cfg.get).not.toHaveBeenCalled();
    expect(lodashSet).not.toHaveBeenCalled();
  });

  it('adds properties-volume and sets secret when present (non-development)', async () => {
    const server = makeServer('production');
    const cfg = getConfigMock();
    const pv = getPVMock();

    const value = 'secret-123';
    cfg.has.mockReturnValue(true);
    cfg.get.mockReturnValue(value);

    const svc = new PropertiesVolume();
    await svc.enableFor(server);

    expect(pv.addTo).toHaveBeenCalledTimes(1);
    // addTo is called with the same config object the module imported
    expect(pv.addTo).toHaveBeenCalledWith(cfg as unknown as IConfig);

    expect(cfg.has).toHaveBeenCalledWith(KEY_FROM);
    expect(cfg.get).toHaveBeenCalledWith(KEY_FROM);

    // set(config, 'appInsights.instrumentationKey', value)
    expect(lodashSet).toHaveBeenCalledTimes(1);
    expect(lodashSet).toHaveBeenCalledWith(cfg, KEY_TO, value);
  });

  it('adds properties-volume but does not set secret when absent (non-development)', async () => {
    const server = makeServer('test');
    const cfg = getConfigMock();
    const pv = getPVMock();

    cfg.has.mockReturnValue(false);

    const svc = new PropertiesVolume();
    await svc.enableFor(server);

    expect(pv.addTo).toHaveBeenCalledTimes(1);
    expect(cfg.has).toHaveBeenCalledWith(KEY_FROM);
    expect(cfg.get).not.toHaveBeenCalled();
    expect(lodashSet).not.toHaveBeenCalled();
  });
});
