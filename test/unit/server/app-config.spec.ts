import config from 'config';

import appConfig from '../../../server/app-config';

jest.mock('config', () => ({
  has: jest.fn(),
  get: jest.fn(),
}));

describe('browser runtime configuration', () => {
  const originalEnvironment = process.env['NODE_ENV'];

  afterEach(() => {
    if (originalEnvironment === undefined) {
      delete process.env['NODE_ENV'];
    } else {
      process.env['NODE_ENV'] = originalEnvironment;
    }
    jest.resetAllMocks();
  });

  it.each([true, false])(
    'exposes the configured report modal flag: %s',
    (enabled) => {
      delete process.env['NODE_ENV'];
      jest.spyOn(config, 'has').mockReturnValue(false);
      jest
        .spyOn(config, 'get')
        .mockImplementation((key) =>
          key === 'reportNavigationModalEnabled' ? enabled : null,
        );
      expect(appConfig()).toEqual({
        environment: 'development',
        reportNavigationModalEnabled: enabled,
        appInsights: { enabled: false, connectionString: null },
      });
    },
  );

  it.each([null, true, false])(
    'preserves production telemetry settings: %s',
    (enabled) => {
      process.env['NODE_ENV'] = 'production';
      jest.spyOn(config, 'has').mockReturnValue(true);
      jest.spyOn(config, 'get').mockImplementation((key) => {
        if (key === 'appInsights.enabled') {
          return enabled;
        }
        if (key === 'reportNavigationModalEnabled') {
          return true;
        }
        return ' example-connection-string ';
      });
      expect(appConfig().appInsights).toEqual({
        enabled: enabled !== false,
        connectionString:
          enabled === false ? null : 'example-connection-string',
      });
    },
  );
});
