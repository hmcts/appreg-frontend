import express, { NextFunction } from 'express';
import type { Express, Request, Response } from 'express';
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
      postLogoutRedirectUri: string;
    },
  ) => void;
  router?: import('express').Router;
};

type AppSession = Session &
  Partial<SessionData> & {
    authState?: string;
    nonce?: string;
    account?: { name?: string; username?: string };
    tokenCache?: string;
  };

const buildConfigMock = () => {
  const data: Record<string, unknown> = {
    'session.cookieName': 'sid',
    'session.secret': 'test-secret',
    'session.secure': false,
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

describe('GET /sso/login', () => {
  const prepareApp = async (mode: 'ok' | 'fail' = 'ok') => {
    jest.resetModules();

    // Mock config + logger FIRST
    jest.doMock('config', () => buildConfigMock(), { virtual: true });
    const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };
    jest.doMock(
      '@hmcts/nodejs-logging',
      () => ({
        Logger: { getLogger: () => logger },
      }),
      { virtual: true },
    );

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

    const routes = (await import('../../src/routes/sso')) as RoutesModule;

    // Fresh app per test + real session middleware so types match express-session
    const app: Express = express();
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
      }),
    );

    if (routes.setupSsoRoutes) {
      routes.setupSsoRoutes(app, {
        tenantId: 'tenant-123',
        clientId: 'client-abc',
        clientSecret: 'secret-xyz',
        redirectUri: 'http://localhost/callback',
        scopes: ['user.read'],
        postLogoutRedirectUri: 'http://localhost/signed-out',
      });
    } else if (routes.router) {
      app.use(routes.router);
    } else {
      throw new Error(
        'Expected module to export setupSsoRoutes(app, opts) or router',
      );
    }

    // Error handler to assert 500 on the error-path test
    app.use((_req: Request, res: Response) => {
      res.status(500).send('Internal error');
    });

    return { app, logger, uuidMock, getAuthCodeUrl };
  };

  test('redirects to the authorization URL and passes state/nonce to MSAL', async () => {
    const { app, uuidMock, getAuthCodeUrl } = await prepareApp('ok');

    uuidMock.mockReturnValueOnce('state-123');
    uuidMock.mockReturnValueOnce('nonce-456');

    const res = await request(app).get('/sso/login');

    expect(res.status).toBe(302);
    const location = res.headers['location'];
    expect(location).toBe('https://login.example/authorize?abc=123');

    expect(getAuthCodeUrl).toHaveBeenCalledTimes(1);
    expect(getAuthCodeUrl).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'state-123', nonce: 'nonce-456' }),
    );
  });

  test('logs and propagates errors when getAuthCodeUrl fails', async () => {
    const { app, logger, uuidMock, getAuthCodeUrl } = await prepareApp('fail');

    uuidMock.mockReturnValueOnce('state-AAA');
    uuidMock.mockReturnValueOnce('nonce-BBB');

    const res = await request(app).get('/sso/login');

    expect(getAuthCodeUrl).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(String(logger.error.mock.calls[0][1])).toMatch(/\/sso\/login/);
  });
});

describe('GET /sso/login-callback', () => {
  const prepareApp = async (
    mode: 'ok' | 'noAccount' | 'throw' = 'ok',
    presetAuthState?: string,
  ) => {
    jest.resetModules();

    // Mock config + logger FIRST
    jest.doMock('config', () => buildConfigMock(), { virtual: true });
    const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };
    jest.doMock(
      '@hmcts/nodejs-logging',
      () => ({
        Logger: { getLogger: () => logger },
      }),
      { virtual: true },
    );

    // We don’t need uuid here; callback uses req.query + session.authState
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

    const routes = (await import('../../src/routes/sso')) as RoutesModule;

    // Fresh app per test + real session middleware so types match express-session
    const app: Express = express();
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
      }),
    );

    // Optionally seed session.authState for tests that need it
    if (presetAuthState) {
      app.use((req: Request, _res: Response, next) => {
        (req.session as AppSession).authState = presetAuthState;
        next();
      });
    }

    if (routes.setupSsoRoutes) {
      routes.setupSsoRoutes(app, {
        tenantId: 'tenant-123',
        clientId: 'client-abc',
        clientSecret: 'secret-xyz',
        redirectUri: 'http://localhost/callback',
        scopes: ['user.read'],
        postLogoutRedirectUri: 'http://localhost/signed-out',
      });
    } else if (routes.router) {
      app.use(routes.router);
    } else {
      throw new Error(
        'Expected module to export setupSsoRoutes(app, opts) or router',
      );
    }

    // Helper endpoint to inspect session after callback
    app.get('/__session', (req: Request, res: Response) => {
      const s = req.session as AppSession;
      res.json({
        authState: s.authState,
        account: s.account ?? null,
        tokenCache: s.tokenCache ?? null,
      });
    });

    // Error handler for error-path test
    app.use((_req: Request, res: Response) => {
      res.status(500).send('Internal error');
    });

    return { app, logger, acquireTokenByCode, serialize };
  };

  test('400 when code/state missing or state mismatched', async () => {
    // No preset authState -> missing/invalid path
    const { app } = await prepareApp('ok');

    // missing both
    const r1 = await request(app).get('/sso/login-callback');
    expect(r1.status).toBe(400);
    expect(r1.text).toMatch(/Invalid auth response/i);

    // state mismatched
    const { app: app2 } = await prepareApp('ok', 'expected-state');
    const r2 = await request(app2).get(
      '/sso/login-callback?code=abc&state=WRONG',
    );
    expect(r2.status).toBe(400);
    expect(r2.text).toMatch(/Invalid auth response/i);
  });

  test('401 when token response lacks account', async () => {
    const { app, acquireTokenByCode } = await prepareApp(
      'noAccount',
      'state-123',
    );

    const res = await request(app).get(
      '/sso/login-callback?code=abc&state=state-123',
    );

    // MSAL was called with our code
    expect(acquireTokenByCode).toHaveBeenCalledTimes(1);
    expect(acquireTokenByCode).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'abc' }),
    );

    expect(res.status).toBe(401);
    expect(res.text).toMatch(/No account in token/i);
  });

  test('success: stores account & token cache, then redirects', async () => {
    const { app, acquireTokenByCode, serialize } = await prepareApp(
      'ok',
      'state-123',
    );

    const agent = request.agent(app);
    const res = await agent.get(
      '/sso/login-callback?code=abc123&state=state-123',
    );

    // redirect to /applications-list
    expect(res.status).toBe(302);
    const location = res.headers['location'];
    expect(location).toBe('/applications-list');

    // MSAL exchange + token cache serialize were invoked
    expect(acquireTokenByCode).toHaveBeenCalledTimes(1);
    expect(acquireTokenByCode).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'abc123' }),
    );
    expect(serialize).toHaveBeenCalledTimes(1);

    // Verify session was updated
    const sess = await agent.get('/__session');
    expect(sess.status).toBe(200);
    expect(sess.body).toEqual({
      authState: 'state-123',
      account: { name: 'Test User', username: 'test@example.com' },
      tokenCache: 'SERIALIZED_CACHE',
    });
  });

  test('500 on error from acquireTokenByCode, logs the error', async () => {
    const { app, logger, acquireTokenByCode } = await prepareApp(
      'throw',
      'state-xyz',
    );

    const res = await request(app).get(
      '/sso/login-callback?code=abc&state=state-xyz',
    );

    expect(acquireTokenByCode).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(String(logger.error.mock.calls[0][1])).toMatch(
      /\/sso\/login-callback/,
    );
  });
});

describe('GET /sso/logout', () => {
  const prepareApp = async (opts?: {
    tenantId?: string;
    postLogoutRedirectUri?: string;
    asyncDestroy?: boolean; // ← new: make destroy callback async for this app
  }) => {
    jest.resetModules();

    // Mock config + logger FIRST
    jest.doMock('config', () => buildConfigMock(), { virtual: true });
    const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };
    jest.doMock(
      '@hmcts/nodejs-logging',
      () => ({ Logger: { getLogger: () => logger } }),
      { virtual: true },
    );

    // Stub MSAL (not used in logout, but safe at import time)
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

    const routes = (await import('../../src/routes/sso')) as RoutesModule;

    const app: Express = express();
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
      }),
    );

    // 🔑 Install the destroy spy BEFORE routes so the route uses it
    let destroySpy:
      | jest.SpyInstance<
          ReturnType<Session['destroy']>,
          Parameters<Session['destroy']>
        >
      | undefined;

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
          return s; // match express-session typings
        });

      next();
    });

    // Attach routes AFTER spy is in place
    const tenantId = opts?.tenantId ?? 'my-tenant';
    const postLogoutRedirectUri =
      opts?.postLogoutRedirectUri ?? 'http://localhost/after-signout?x=1&y=two';

    if (routes.setupSsoRoutes) {
      routes.setupSsoRoutes(app, {
        tenantId,
        clientId: 'client-abc',
        clientSecret: 'secret-xyz',
        redirectUri: 'http://localhost/callback',
        scopes: ['user.read'],
        postLogoutRedirectUri,
      });
    } else if (routes.router) {
      app.use(routes.router);
    } else {
      throw new Error(
        'Expected module to export setupSsoRoutes(app, opts) or router',
      );
    }

    // Proper 4-arg error handler
    app.use((_req: Request, res: Response) => {
      res.status(500).send('Internal error');
    });

    return {
      app,
      logger,
      destroySpyRef: () => destroySpy,
      tenantId,
      postLogoutRedirectUri,
    };
  };

  const buildExpectedLogoutUrl = (
    tenantId: string,
    postLogoutRedirectUri: string,
  ): string =>
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout` +
    `?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

  type DestroySpy = jest.SpyInstance<
    ReturnType<Session['destroy']>,
    Parameters<Session['destroy']>
  >;

  const assertLogoutRedirect = async (
    app: Express,
    expectedUrl: string,
    destroySpyRef: () => DestroySpy | undefined,
  ): Promise<void> => {
    const res = await request(app).get('/sso/logout');

    expect(res.status).toBe(302);
    const location = res.headers['location'];
    expect(location).toBe(expectedUrl);

    const spy = destroySpyRef();
    expect(spy).toBeDefined();
    expect(spy?.mock.calls.length).toBe(1);
  };

  test('destroys the session and redirects to Entra logout with post_logout_redirect_uri', async () => {
    const { app, destroySpyRef, tenantId, postLogoutRedirectUri } =
      await prepareApp();

    await assertLogoutRedirect(
      app,
      buildExpectedLogoutUrl(tenantId, postLogoutRedirectUri),
      destroySpyRef,
    );
  });

  test('still redirects when destroy calls back asynchronously', async () => {
    const { app, destroySpyRef, tenantId, postLogoutRedirectUri } =
      await prepareApp({ asyncDestroy: true });

    await assertLogoutRedirect(
      app,
      buildExpectedLogoutUrl(tenantId, postLogoutRedirectUri),
      destroySpyRef,
    );
  });
});
