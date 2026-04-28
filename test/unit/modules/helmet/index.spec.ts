import config from 'config';
import express from 'express';
import helmet from 'helmet';

import { Helmet as HelmetModule } from '../../../../server/modules/helmet/index';

// Tell TypeScript that helmet is a mocked function.
jest.mock('helmet');
jest.mock('config', () => ({
  has: jest.fn(),
  get: jest.fn(),
}));

describe('Helmet Module', () => {
  let app: express.Express;
  let originalPort: string | undefined;
  const dummyMiddleware = jest.fn();
  const mockedConfig = config as jest.Mocked<typeof config>;

  beforeEach(() => {
    // Clear all mocks and create a fresh express app.
    jest.clearAllMocks();
    originalPort = process.env['PORT'];
    delete process.env['PORT'];
    app = express();

    // Have our helmet mock return a dummy middleware function.
    (helmet as unknown as jest.Mock).mockReturnValue(dummyMiddleware);
    mockedConfig.has.mockReturnValue(false);
    mockedConfig.get.mockReturnValue('');
  });

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env['PORT'];
      return;
    }

    process.env['PORT'] = originalPort;
  });

  it('should enable helmet with unsafe-eval in development mode', () => {
    const helmetInstance = new HelmetModule(true);
    helmetInstance.enableFor(app);

    // Ensure helmet was called exactly once.
    expect(helmet).toHaveBeenCalledTimes(1);

    // Extract the configuration passed to helmet.
    const helmetConfig = (helmet as unknown as jest.Mock).mock.calls[0][0];

    // Verify the basic structure: check that contentSecurityPolicy and directives exist.
    expect(helmetConfig).toHaveProperty('contentSecurityPolicy');
    expect(helmetConfig.contentSecurityPolicy).toHaveProperty('directives');
    expect(helmetConfig.contentSecurityPolicy.directives).toHaveProperty(
      'scriptSrc',
    );

    // The scriptSrc array should include self.
    // In development mode, it should also include "'unsafe-eval'".
    const scriptSrc = helmetConfig.contentSecurityPolicy.directives.scriptSrc;
    const formAction = helmetConfig.contentSecurityPolicy.directives.formAction;
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).toContain("'unsafe-eval'");
    expect(formAction).toContain("'self'");
    expect(formAction).toContain('https://login.microsoftonline.com');
    expect(formAction).toContain('http://localhost:4000');

    // Verify that app.use was called with the dummy middleware.
    // Here we assume that enableFor calls app.use(helmet(...))
    const useSpy = jest.spyOn(app, 'use');
    helmetInstance.enableFor(app);
    expect(useSpy).toHaveBeenCalledWith(dummyMiddleware);
  });

  it('should enable helmet without unsafe-eval in non-development mode', () => {
    const helmetInstance = new HelmetModule(false);
    helmetInstance.enableFor(app);

    // Ensure helmet was called.
    expect(helmet).toHaveBeenCalledTimes(1);

    // Extract the configuration passed to helmet.
    const helmetConfig = (helmet as unknown as jest.Mock).mock.calls[0][0];
    const scriptSrc = helmetConfig.contentSecurityPolicy.directives.scriptSrc;
    const formAction = helmetConfig.contentSecurityPolicy.directives.formAction;

    // In non-development mode, "'unsafe-eval'" should not be present.
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(formAction).toEqual(["'self'", 'https://login.microsoftonline.com']);
  });

  it('uses the configured local dev server port for form-action', () => {
    process.env['PORT'] = '4100';

    new HelmetModule(true).enableFor(app);

    const helmetConfig = (helmet as unknown as jest.Mock).mock.calls[0][0];
    const formAction = helmetConfig.contentSecurityPolicy.directives.formAction;

    expect(formAction).toContain("'self'");
    expect(formAction).toContain('https://login.microsoftonline.com');
    expect(formAction).toContain('http://localhost:4100');
    expect(formAction).not.toContain('http://localhost:4000');
  });

  it('adds the configured App Insights ingestion origin to connect-src', () => {
    mockedConfig.has.mockImplementation(
      (key: string) =>
        key === 'secrets.appreg.app-insights-connection-string-fe',
    );
    mockedConfig.get.mockImplementation((key: string) => {
      if (key === 'secrets.appreg.app-insights-connection-string-fe') {
        return 'InstrumentationKey=abc;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/';
      }

      return '';
    });

    new HelmetModule(true).enableFor(app);

    const helmetConfig = (helmet as unknown as jest.Mock).mock.calls[0][0];
    const connectSrc = helmetConfig.contentSecurityPolicy.directives.connectSrc;

    expect(connectSrc).toContain(
      'https://westeurope-5.in.applicationinsights.azure.com',
    );
    expect(connectSrc).toContain(
      'https://westeurope.livediagnostics.monitor.azure.com',
    );
    expect(connectSrc).toContain('https://js.monitor.azure.com');
  });

  it('derives App Insights hosts from EndpointSuffix and Location', () => {
    mockedConfig.has.mockImplementation(
      (key: string) =>
        key === 'secrets.appreg.app-insights-connection-string-fe',
    );
    mockedConfig.get.mockImplementation((key: string) => {
      if (key === 'secrets.appreg.app-insights-connection-string-fe') {
        return 'InstrumentationKey=abc;EndpointSuffix=applicationinsights.azure.com;Location=westeurope';
      }

      return '';
    });

    new HelmetModule(true).enableFor(app);

    const helmetConfig = (helmet as unknown as jest.Mock).mock.calls[0][0];
    const connectSrc = helmetConfig.contentSecurityPolicy.directives.connectSrc;

    expect(connectSrc).toContain(
      'https://westeurope.dc.applicationinsights.azure.com',
    );
    expect(connectSrc).toContain('https://live.applicationinsights.azure.com');
    expect(connectSrc).toContain('https://js.monitor.azure.com');
  });
});
