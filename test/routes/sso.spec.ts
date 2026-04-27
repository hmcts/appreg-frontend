import type { Express, Request, Response } from 'express';
import express, { NextFunction } from 'express';
import session, { Session, SessionData } from 'express-session';
import request from 'supertest';

type RoutesModule = {
  setupSsoRoutes?: (
    app: Express,
    opts: {
      tenantId: string;
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      scopes: string[];
      postLogoutRedirectUri?: string;
    },
  ) => void;
  router?: import('express').Router;
};

type Account = { name?: string; username?: string };

type AppSession = Session &
  Partial<SessionData> & {
    authState?: string;
    nonce?: string;
    account?: { name?: string; username?: string };
    tokenCache?: string;
  };

// Deterministic host for dynamic redirect tests (not PR-specific)
const TEST_HOST = 'sso.test.local';
const TEST_HEADERS = {
  'x-forwarded-proto': 'https',
  'x-forwarded-host': TEST_HOST,
};

// Mock config + logger once (works across jest.resetModules calls)
const buildConfigMock = () => {
  const data: Record<string, unknown> = {
    'session.cookieName': 'sid',
    'secrets.appreg.app-session-secret-fe': 'test-secret',
    'secrets.appreg.azure-tenant-id-fe': 'tenant-123',
    'secrets.appreg.azure-app-id-fe': 'client-abc',
    'secrets.appreg.azure-client-secret-fe': 'secret-xyz',
    'auth.redirectUri': 'http://localhost/callback',
    'auth.scopes': ['user.read'],
    'auth.postLogoutRedirectUri': 'http://localhost/signed-out',
  };
  const has = jest.fn((k: string) =>
    Object.prototype.hasOwnProperty.call(data, k),
  );
  const get = jest.fn((k: string) => {
    if (!has(k)) {
      throw new Error(`Missing config key in test: ${k}`);
    }
    return data[k];
  });
  return { has, get };
};

jest.doMock('config', () => buildConfigMock(), { virtual: true });
const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };
jest.doMock(
  '@hmcts/nodejs-logging',
  () => ({
    Logger: { getLogger: () => logger },
  }),
  { virtual: true },
);
jest.doMock('../../server/modules/appinsights', () => ({
  AppInsights: {
    client: () => ({
      trackException: jest.fn(),
      trackTrace: jest.fn(),
    }),
  },
}));
jest.doMock('../../server/modules/logger', () => ({
  HmctsLoggerBridge: {
    enable: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

type DestroySpy = jest.SpyInstance<
  ReturnType<Session['destroy']>,
  Parameters<Session['destroy']>
>;

/** Create a fresh express app with real session middleware. */
function createBaseApp(): Express {
  const app: Express = express();
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: process.env['NODE_ENV'] === 'production' },
    }),
  );
  return app;
}

/** Optionally install a spy that simulates sync/async `session.destroy`. */
function installDestroySpy(
  app: Express,
  opts?: { asyncDestroy?: boolean },
): () => DestroySpy | undefined {
  let destroySpy: DestroySpy | undefined;

  app.use((req: Request, _res: Response, next: NextFunction) => {
    const s = req.session as Session;
    type Destroy = typeof s.destroy;
    type DestroyCb = Parameters<Destroy>[0];
    type DestroyRet = ReturnType<Destroy>;

    destroySpy = jest
      .spyOn(s, 'destroy')
      .mockImplementation((cb: DestroyCb): DestroyRet => {
        if (opts?.asyncDestroy) {
          setTimeout(() => cb?.(undefined), 0);
        } else {
          cb?.(undefined);
        }
        // Return value matches express-session typing
        return s as unknown as DestroyRet;
      });

    next();
  });

  return () => destroySpy;
}

/** Mount SSO routes with defaults, optionally overriding tenant / postLogoutRedirectUri. */
async function mountRoutes(
  app: Express,
  overrides?: { tenantId?: string; postLogoutRedirectUri?: string },
): Promise<void> {
  const routes = (await import('../../server/routes/sso')) as RoutesModule;

  if (routes.setupSsoRoutes) {
    const opts: {
      tenantId: string;
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      scopes: string[];
      postLogoutRedirectUri?: string;
    } = {
      tenantId: overrides?.tenantId ?? 'tenant-123',
      clientId: 'client-abc',
      clientSecret: 'secret-xyz',
      redirectUri: 'http://localhost/callback',
      scopes: ['user.read'],
    };

    if (
      Object.prototype.hasOwnProperty.call(
        overrides ?? {},
        'postLogoutRedirectUri',
      )
    ) {
      opts.postLogoutRedirectUri = overrides!.postLogoutRedirectUri;
    }

    routes.setupSsoRoutes(app, opts);
  } else if (routes.router) {
    app.use(routes.router);
  } else {
    throw new Error(
      'Expected module to export setupSsoRoutes(app, opts) or router',
    );
  }
}

/** Consistent error handler used by suites that expect 500 on error-paths. */
function installErrorHandler(app: Express): void {
  app.use((_req: Request, res: Response) => {
    res.status(500).send('Internal error');
  });
}

/** Build expected Entra logout URL. */
function buildExpectedLogoutUrl(
  tenantId: string,
  postLogoutRedirectUri: string,
): string {
  return (
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout` +
    `?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
  );
}

/** Assertion helper for logout redirect + ensuring destroy() was invoked. */
async function assertLogoutRedirect(
  app: Express,
  expectedUrl: string,
  destroySpyRef: () => DestroySpy | undefined,
  headers?: Record<string, string>,
): Promise<void> {
  const req = request(app).get('/sso/logout');
  const res = headers ? await req.set(headers) : await req;

  expect(res.status).toBe(302);
  expect(res.headers['location']).toBe(expectedUrl);

  const spy = destroySpyRef();
  expect(spy).toBeDefined();
  expect(spy?.mock.calls.length).toBe(1);
}

function findCookie(
  setCookie: string | string[] | undefined,
  cookieName: string,
): string | undefined {
  let cookies: string[] = [];
  if (typeof setCookie === 'string') {
    cookies = [setCookie];
  } else if (Array.isArray(setCookie)) {
    cookies = setCookie;
  }
  return cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
}

async function createAppWithRealSession(opts?: {
  asyncDestroy?: boolean;
  presetAuthState?: string;
  mode?: 'ok' | 'logout';
}): Promise<Express> {
  jest.resetModules();

  jest.doMock('../../server/modules/appinsights', () => ({
    AppInsights: {
      client: () => ({
        trackException: jest.fn(),
        trackTrace: jest.fn(),
      }),
    },
  }));
  jest.doMock('../../server/modules/logger', () => ({
    HmctsLoggerBridge: {
      enable: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }),
    },
  }));

  if (opts?.mode === 'logout') {
    jest.doMock('@azure/msal-node', () => {
      class ConfidentialClientApplication {
        getAuthCodeUrl() {
          throw new Error('Not used in logout tests');
        }

        acquireTokenByCode() {
          throw new Error('Not used in logout tests');
        }

        getTokenCache() {
          return { serialize: () => 'SERIALIZED_CACHE' };
        }
      }

      return { ConfidentialClientApplication };
    });
  } else {
    const acquireTokenByCode = jest.fn().mockResolvedValue({
      account: { name: 'Test User', username: 'test@example.com' },
    });
    const serialize = jest.fn<string, []>().mockReturnValue('SERIALIZED_CACHE');

    jest.doMock('@azure/msal-node', () => {
      class ConfidentialClientApplication {
        acquireTokenByCode = acquireTokenByCode;

        getTokenCache() {
          return { serialize };
        }
      }

      return { ConfidentialClientApplication };
    });
  }

  const { setupSession } = await import('../../server/session');

  const app = express();
  app.set('trust proxy', 1);
  app.use(
    await setupSession({
      isProd: true,
      useRedis: false,
      cookieName: 'sid',
      sessionSecret: 'test-secret',
    }),
  );

  if (opts?.presetAuthState) {
    app.use((req: Request, _res: Response, next) => {
      (req.session as AppSession).authState = opts.presetAuthState;
      next();
    });
  }

  if (opts?.asyncDestroy !== undefined) {
    installDestroySpy(app, { asyncDestroy: opts.asyncDestroy });
  }

  await mountRoutes(app);
  installErrorHandler(app);
  return app;
}

describe('GET /sso/login', () => {
  const prepare = async (mode: 'ok' | 'fail' = 'ok') => {
    jest.resetModules();

    // Stable UUIDs so we can assert state/nonce
    const uuidMock = jest.fn<string, []>();
    jest.doMock('uuid', () => ({ v4: uuidMock, default: uuidMock }), {
      virtual: true,
    });

    // Mock MSAL BEFORE importing routes
    type GetAuthCodeUrl = (args: Record<string, unknown>) => Promise<string>;
    const getAuthCodeUrl: jest.MockedFunction<GetAuthCodeUrl> = jest.fn();
    if (mode === 'ok') {
      getAuthCodeUrl.mockResolvedValue(
        'https://login.example/authorize?abc=123',
      );
    } else {
      getAuthCodeUrl.mockRejectedValue(new Error('getAuthCodeUrl failed'));
    }
    jest.doMock('@azure/msal-node', () => {
      class ConfidentialClientApplication {
        getAuthCodeUrl = getAuthCodeUrl;
      }

      return { ConfidentialClientApplication };
    });

    const app = createBaseApp();
    await mountRoutes(app);
    installErrorHandler(app);

    return { app, uuidMock, getAuthCodeUrl };
  };

  test('redirects to the authorization URL and passes state/nonce to MSAL', async () => {
    const { app, uuidMock, getAuthCodeUrl } = await prepare('ok');

    uuidMock.mockReturnValueOnce('state-123');
    uuidMock.mockReturnValueOnce('nonce-456');

    const res = await request(app).get('/sso/login').set(TEST_HEADERS);

    expect(res.status).toBe(302);
    expect(res.headers['location']).toBe(
      'https://login.example/authorize?abc=123',
    );

    expect(getAuthCodeUrl).toHaveBeenCalledTimes(1);
    expect(getAuthCodeUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'state-123',
        nonce: 'nonce-456',
        redirectUri: `https://${TEST_HOST}/sso/login-callback`,
      }),
    );
  });

  test('logs and propagates errors when getAuthCodeUrl fails', async () => {
    const { app } = await prepare('fail');

    const res = await request(app).get('/sso/login').set(TEST_HEADERS);

    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(String(logger.error.mock.calls[0][1])).toMatch(/\/sso\/login/);
  });
});

describe('GET /sso/login-callback', () => {
  const prepare = async (
    mode: 'ok' | 'noAccount' | 'throw' = 'ok',
    presetAuthState?: string,
  ) => {
    jest.resetModules();

    type AcquireArgs = Record<string, unknown>;
    type AcquireResult = { account?: { name?: string; username?: string } };
    const acquireTokenByCode = jest.fn<Promise<AcquireResult>, [AcquireArgs]>();
    const serialize = jest.fn<string, []>().mockReturnValue('SERIALIZED_CACHE');

    if (mode === 'ok') {
      acquireTokenByCode.mockResolvedValue({
        account: { name: 'Test User', username: 'test@example.com' },
      });
    } else if (mode === 'noAccount') {
      acquireTokenByCode.mockResolvedValue({});
    } else {
      acquireTokenByCode.mockRejectedValue(
        new Error('acquireTokenByCode failed'),
      );
    }

    jest.doMock('@azure/msal-node', () => {
      class ConfidentialClientApplication {
        acquireTokenByCode = acquireTokenByCode;

        getTokenCache() {
          return { serialize };
        }
      }

      return { ConfidentialClientApplication };
    });

    const app = createBaseApp();

    if (presetAuthState) {
      app.use((req: Request, _res: Response, next) => {
        (req.session as AppSession).authState = presetAuthState;
        next();
      });
    }

    await mountRoutes(app);

    // Helper endpoint to inspect session after callback
    app.get('/__session', (req: Request, res: Response) => {
      const s = req.session as AppSession;
      res.json({
        authState: s.authState,
        account: s.account ?? null,
        tokenCache: s.tokenCache ?? null,
      });
    });

    installErrorHandler(app);

    return { app, acquireTokenByCode, serialize };
  };

  test('400 when code/state missing or state mismatched', async () => {
    const { app } = await prepare('ok');

    const r1 = await request(app).get('/sso/login-callback').set(TEST_HEADERS);
    expect(r1.status).toBe(400);
    expect(r1.text).toMatch(/Invalid auth response/i);

    const { app: app2 } = await prepare('ok', 'expected-state');
    const r2 = await request(app2)
      .get('/sso/login-callback?code=abc&state=WRONG')
      .set(TEST_HEADERS);
    expect(r2.status).toBe(400);
    expect(r2.text).toMatch(/Invalid auth response/i);
  });

  test('401 when token response lacks account', async () => {
    const { app, acquireTokenByCode } = await prepare('noAccount', 'state-123');

    const res = await request(app)
      .get('/sso/login-callback?code=abc&state=state-123')
      .set(TEST_HEADERS);

    expect(acquireTokenByCode).toHaveBeenCalledTimes(1);
    expect(acquireTokenByCode).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'abc',
        redirectUri: `https://${TEST_HOST}/sso/login-callback`,
      }),
    );

    expect(res.status).toBe(401);
    expect(res.text).toMatch(/No account in token/i);
  });

  test('success: stores account & token cache, then redirects', async () => {
    const { app, acquireTokenByCode, serialize } = await prepare(
      'ok',
      'state-123',
    );

    const agent = request.agent(app);
    const res = await agent
      .get('/sso/login-callback?code=abc123&state=state-123')
      .set(TEST_HEADERS);

    expect(res.status).toBe(302);
    expect(res.headers['location']).toBe('/');

    expect(acquireTokenByCode).toHaveBeenCalledTimes(1);
    expect(acquireTokenByCode).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'abc123',
        redirectUri: `https://${TEST_HOST}/sso/login-callback`,
      }),
    );
    expect(serialize).toHaveBeenCalledTimes(1);

    const sess = await agent.get('/__session');
    expect(sess.status).toBe(200);
    expect(sess.body).toEqual({
      authState: 'state-123',
      account: { name: 'Test User', username: 'test@example.com' },
      tokenCache: 'SERIALIZED_CACHE',
    });
  });

  test('500 on error from acquireTokenByCode, logs the error', async () => {
    const { app } = await prepare('throw', 'state-xyz');

    const res = await request(app)
      .get('/sso/login-callback?code=abc&state=state-xyz')
      .set(TEST_HEADERS);

    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(String(logger.error.mock.calls[0][1])).toMatch(
      /\/sso\/login-callback/,
    );
  });
});

describe('GET /sso/logout', () => {
  const prepare = async (opts?: {
    tenantId?: string;
    asyncDestroy?: boolean;
  }) => {
    jest.resetModules();

    jest.doMock('@azure/msal-node', () => {
      class ConfidentialClientApplication {
        getAuthCodeUrl() {
          throw new Error('Not used in logout tests');
        }

        acquireTokenByCode() {
          throw new Error('Not used in logout tests');
        }

        getTokenCache() {
          return { serialize: () => 'SERIALIZED_CACHE' };
        }
      }

      return { ConfidentialClientApplication };
    });

    const app = createBaseApp();
    const destroySpyRef = installDestroySpy(app, {
      asyncDestroy: opts?.asyncDestroy,
    });

    await mountRoutes(app, { tenantId: opts?.tenantId });

    installErrorHandler(app);

    return {
      app,
      destroySpyRef,
      tenantId: opts?.tenantId ?? 'tenant-123',
    };
  };

  test('logout: computes post_logout_redirect_uri from request host', async () => {
    const { app, destroySpyRef, tenantId } = await prepare();

    const expectedComputed = `https://${TEST_HOST}/login`;
    const expectedUrl = buildExpectedLogoutUrl(tenantId, expectedComputed);

    await assertLogoutRedirect(app, expectedUrl, destroySpyRef, TEST_HEADERS);
  });

  test('logout: still redirects when destroy calls back asynchronously (computed)', async () => {
    const { app, destroySpyRef, tenantId } = await prepare({
      asyncDestroy: true,
    });

    const expectedComputed = `https://${TEST_HOST}/login`;
    const expectedUrl = buildExpectedLogoutUrl(tenantId, expectedComputed);

    await assertLogoutRedirect(app, expectedUrl, destroySpyRef, TEST_HEADERS);
  });
});

describe('session cookie security', () => {
  test('login callback sets Secure, HttpOnly and SameSite on HTTPS', async () => {
    const app = await createAppWithRealSession({
      presetAuthState: 'state-123',
    });

    const res = await request(app)
      .get('/sso/login-callback?code=abc123&state=state-123')
      .set(TEST_HEADERS);

    const sessionCookie = findCookie(res.headers['set-cookie'], 'sid');

    expect(res.status).toBe(302);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');
    expect(sessionCookie).toContain('Secure');
    expect(sessionCookie).toContain('Path=/');
  });

  test('login callback omits Secure on plain HTTP', async () => {
    const app = await createAppWithRealSession({
      presetAuthState: 'state-123',
    });

    const res = await request(app).get(
      '/sso/login-callback?code=abc123&state=state-123',
    );

    const sessionCookie = findCookie(res.headers['set-cookie'], 'sid');

    expect(res.status).toBe(302);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');
    expect(sessionCookie).not.toContain('Secure');
  });

  test('logout clears the session cookie with hardened attributes on HTTPS', async () => {
    const app = await createAppWithRealSession({
      asyncDestroy: false,
      mode: 'logout',
    });

    const res = await request(app).get('/sso/logout').set(TEST_HEADERS);

    const sessionCookie = findCookie(res.headers['set-cookie'], 'sid');

    expect(res.status).toBe(302);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');
    expect(sessionCookie).toContain('Secure');
    expect(sessionCookie).toMatch(/Expires=/);
  });
});

describe('GET /sso/me', () => {
  const prepare = async (opts?: { seedAccount?: Account }) => {
    jest.resetModules();

    jest.doMock(
      '@azure/msal-node',
      () => {
        class ConfidentialClientApplication {
          getAuthCodeUrl() {
            throw new Error('Not used in /sso/me tests');
          }

          acquireTokenByCode() {
            throw new Error('Not used in /sso/me tests');
          }

          getTokenCache() {
            return { serialize: () => 'SERIALIZED_CACHE' };
          }
        }

        return { ConfidentialClientApplication };
      },
      { virtual: true },
    );

    const app = createBaseApp();

    if (opts?.seedAccount) {
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req.session as Session & { account?: Account }).account =
          opts.seedAccount;
        next();
      });
    }

    await mountRoutes(app);
    app.use((_req: Request, res: Response) => {
      res.status(500).send('Internal error');
    });

    return { app };
  };

  test('401 when no session account', async () => {
    const { app } = await prepare();

    const res = await request(app).get('/sso/me');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ authenticated: false });
  });

  test('200 with user details when session has account', async () => {
    const account: Account = {
      name: 'Test User',
      username: 'test@example.com',
    };
    const { app } = await prepare({ seedAccount: account });

    const res = await request(app).get('/sso/me');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      authenticated: true,
      name: 'Test User',
      username: 'test@example.com',
    });
  });
});
