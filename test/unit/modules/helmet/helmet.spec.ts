import type {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import type helmet from 'helmet';

// Derive the options type from helmet itself (type-only; doesn't execute the module)
type HelmetParam = Parameters<typeof helmet>[0];
type HelmetOpts = NonNullable<HelmetParam>;
type CSP = NonNullable<Exclude<HelmetOpts['contentSecurityPolicy'], boolean>>;

// Define the mock *inside* the factory to avoid TDZ/hoisting issues
jest.mock('helmet', () => {
  const mock = jest.fn(() => {
    const mw: RequestHandler = (_req, _res, next) => {
      if (next) {
        next();
      }
    };
    return mw;
  });
  return { __esModule: true, default: mock };
});

// Import *after* the mock
import { Helmet as AppHelmet } from '../../../../src/modules/helmet';

// Helper to get the mocked factory as a jest.Mock
function getHelmetFactory(): jest.Mock {
  return jest.requireMock('helmet').default;
}

// ---- helpers to safely read directive values -----------------------------

function isIterable<T = unknown>(val: unknown): val is Iterable<T> {
  return typeof val === 'object' && val !== null && Symbol.iterator in val;
}

function toStringArray(val: unknown): string[] {
  // Helmet also uses a `unique symbol` sentinel for disabling defaults
  if (val === null || typeof val === 'symbol') {
    return [];
  }
  if (isIterable<string>(val)) {
    return Array.from(val);
  }
  return [];
}

// Type guard to narrow optional fields
function assertDefined<T>(
  value: T,
  name: string,
): asserts value is NonNullable<T> {
  if (value === null) {
    throw new Error(`${name} was not defined`);
  }
}

describe('Helmet.enableFor', () => {
  beforeEach(() => {
    getHelmetFactory().mockClear();
  });

  function makeApp() {
    // Keep a Jest-typed handle for assertions
    const useMock = jest.fn<void, [RequestHandler]>();
    // Attach it to a minimal Express-shaped object for the code under test
    const app = {
      use: useMock as unknown as Express['use'],
    } as unknown as Express;
    return { app, useMock };
  }

  it('registers helmet with expected CSP in production (no unsafe-eval)', () => {
    const { app, useMock } = makeApp();
    const h = new AppHelmet(false); // developmentMode = false

    h.enableFor(app);

    const helmetFactory = getHelmetFactory();
    expect(helmetFactory).toHaveBeenCalledTimes(1);

    // Options passed to helmet(...)
    const [opts] = helmetFactory.mock.calls[0] as [HelmetOpts];

    // app.use received the middleware
    expect(useMock).toHaveBeenCalledTimes(1);
    expect(useMock.mock.calls[0][0]).toEqual(expect.any(Function));

    // Core directives (shape assertion)
    expect(opts).toMatchObject({
      referrerPolicy: { policy: 'origin' },
      contentSecurityPolicy: {
        directives: {
          connectSrc: ["'self'"],
          defaultSrc: ["'none'"],
          fontSrc: ["'self'", 'data:'],
          imgSrc: ["'self'", '*.google-analytics.com'],
          objectSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    });

    // Narrow CSP to object form before accessing directives
    const csp = opts.contentSecurityPolicy as CSP;
    assertDefined(csp.directives, 'csp.directives');

    // Convert iterable directive to a string[]
    const scriptSrc = toStringArray(csp.directives['scriptSrc']);

    expect(scriptSrc).toEqual([
      "'self'",
      '*.google-analytics.com',
      "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='",
      "'sha256-VM2mZqyEQZoLzoTrp5EigFvzQ0+f1wSeBuoOn95WHCg='",
      "'sha256-8sGKvDKC8crv9OBcqEMvqrNDWlm1/80h7NJpJzqOnLI='",
    ]);
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('registers helmet with expected CSP in development (includes unsafe-eval)', () => {
    const { app } = makeApp();
    const h = new AppHelmet(true); // developmentMode = true

    h.enableFor(app);

    const helmetFactory = getHelmetFactory();
    const [opts] = helmetFactory.mock.calls[0] as [HelmetOpts];

    const csp = opts.contentSecurityPolicy as CSP;
    assertDefined(csp.directives, 'csp.directives');

    const scriptSrc = toStringArray(csp.directives['scriptSrc']);

    // Now safe to index; it's a string[]
    expect(scriptSrc.length).toBeGreaterThan(0);
    expect(scriptSrc[scriptSrc.length - 1]).toBe("'unsafe-eval'");
  });

  it('the returned middleware is a valid Express handler (calls next)', () => {
    const { app, useMock } = makeApp();
    const h = new AppHelmet(false);

    h.enableFor(app);

    const mw = useMock.mock.calls[0][0];
    const next: NextFunction = jest.fn();
    const req = {} as unknown as Request;
    const res = {} as unknown as Response;

    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
