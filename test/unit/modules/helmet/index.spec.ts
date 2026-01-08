import express from 'express';
import helmet from 'helmet';

import { Helmet as HelmetModule } from '../../../../server/modules/helmet/index';

// Tell TypeScript that helmet is a mocked function.
jest.mock('helmet');

describe('Helmet Module', () => {
  let app: express.Express;
  const dummyMiddleware = jest.fn();

  beforeEach(() => {
    // Clear all mocks and create a fresh express app.
    jest.clearAllMocks();
    app = express();

    // Have our helmet mock return a dummy middleware function.
    (helmet as unknown as jest.Mock).mockReturnValue(dummyMiddleware);
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

    // The scriptSrc array should include self and nonce
    // Development mode should include "'unsafe-eval'" and "'unsafe-inline'"
    const scriptSrc = helmetConfig.contentSecurityPolicy.directives.scriptSrc;
    expect(scriptSrc).toContain("'self'");
    // scriptSrc includes nonce
    expect(
      scriptSrc.some((entry: unknown) => typeof entry === 'function'),
    ).toBe(true);
    expect(scriptSrc).toContain("'unsafe-eval'");
    expect(scriptSrc).toContain("'unsafe-inline'");

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

    // In non-development mode exclude "'unsafe-eval'" and "'unsafe-inline'"
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });
});
