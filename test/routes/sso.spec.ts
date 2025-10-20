import express from 'express';
import type { Express, Request, Response } from 'express';
import session from 'express-session';
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

const buildConfigMock = () => {
  const data: Record<string, unknown> = {
    'session.cookieName': 'sid',
    'session.secret': 'test-secret',
    'session.secure': false,
  };
  const has = jest.fn((k: string) => Object.prototype.hasOwnProperty.call(data, k));
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
    jest.doMock('@hmcts/nodejs-logging', () => ({
      Logger: { getLogger: () => logger },
    }), { virtual: true });

    // Stable UUIDs so we can assert state/nonce
    const uuidMock = jest.fn<string, []>();
    jest.doMock('uuid', () => ({ v4: uuidMock, default: uuidMock }), { virtual: true });

    // Mock MSAL BEFORE importing routes
    type GetAuthCodeUrl = (args: Record<string, unknown>) => Promise<string>;
    const getAuthCodeUrl: jest.MockedFunction<GetAuthCodeUrl> = jest.fn();
    if (mode === 'ok') {
      getAuthCodeUrl.mockResolvedValue('https://login.example/authorize?abc=123');
    } else {
      getAuthCodeUrl.mockRejectedValue(new Error('getAuthCodeUrl failed'));
    }
    jest.doMock('@azure/msal-node', () => {
      class ConfidentialClientApplication {
        getAuthCodeUrl = getAuthCodeUrl;
      }
      return { ConfidentialClientApplication };
    });

    // ⬅️ Update this path to your routes file if different
    const routes = (await import('../../src/routes/sso')) as RoutesModule;

    // Fresh app per test + real session middleware so types match express-session
    const app: Express = express();
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    }));

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
      throw new Error('Expected module to export setupSsoRoutes(app, opts) or router');
    }

    // Error handler to assert 500 on the error-path test
    app.use((err: unknown, _req: Request, res: Response) => {
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
