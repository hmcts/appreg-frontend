/**
 * @jest-environment node
 */
import express from 'express';
import request from 'supertest';

// ---- MSAL mock ------------------------------------------------------------
type AuthCodeUrlReq = {
  scopes: string[];
  redirectUri: string;
  responseMode: 'query';
  state: string;
  nonce: string;
  prompt: 'select_account';
};
type AcquireTokenReq = { code: string; scopes: string[]; redirectUri: string };
type AccountInfo = {
  homeAccountId: string;
  environment: string;
  tenantId: string;
  username: string;
  name?: string;
};
type AcquireTokenResp = { account?: AccountInfo };

const getAuthCodeUrlMock: jest.Mock<
  Promise<string>,
  [AuthCodeUrlReq]
> = jest.fn();
const acquireTokenByCodeMock: jest.Mock<
  Promise<AcquireTokenResp | null>,
  [AcquireTokenReq]
> = jest.fn();
const serializeMock: jest.Mock<string, []> = jest.fn();

jest.mock('@azure/msal-node', () => {
  const ConfidentialClientApplication = jest.fn(() => ({
    getAuthCodeUrl: getAuthCodeUrlMock,
    acquireTokenByCode: acquireTokenByCodeMock, // ← use the real mock
    getTokenCache: () => ({ serialize: serializeMock }), // ← and here
  }));
  return { __esModule: true, ConfidentialClientApplication };
});

// ---- config mock (typed correctly; implementation inside factory) ---------
jest.mock('config', () => {
  // Correct Jest type: Return = unknown, Args = [string]
  const get: jest.Mock<unknown, [string]> = jest.fn((key: string): unknown => {
    switch (key) {
      case 'secrets.apps-reg.app-TENANT-ID':
        return 'tenant-xyz';
      case 'secrets.apps-reg.app-CLIENT-ID':
        return 'client-abc';
      case 'secrets.apps-reg.app-CLIENT-SECRET':
        return 'super-secret';
      case 'auth.redirectUri':
        return 'https://example.test/auth/callback';
      case 'auth.scopes':
        return ['openid', 'profile'];
      case 'auth.postLogoutRedirectUri':
        return 'https://example.test/signed-out';
      case 'session.cookieName':
        return 'sid';
      case 'session.secret':
        return 'session-secret';
      case 'session.secure':
        return false; // important for HTTP in tests
      default:
        throw new Error(`Unexpected config.get(${key})`);
    }
  });
  return { __esModule: true, default: { get } };
});

// ---- uuid mock -------------------------------------------------------------
jest.mock('uuid', () => ({ v4: jest.fn() }));
function uuidV4(): jest.Mock<string, []> {
  return jest.requireMock('uuid').v4;
}

// Import the router AFTER mocks
import router from '../../src/routes/sso'; // ← adjust path if needed

describe('GET /sso/login', () => {
  beforeEach(() => {
    uuidV4()
      .mockReset()
      .mockReturnValueOnce('state-123')
      .mockReturnValueOnce('nonce-456');

    getAuthCodeUrlMock
      .mockReset()
      .mockResolvedValue(
        'https://login.microsoftonline.com/tenant-xyz/oauth2/v2.0/authorize?...',
      );
  });

  it('redirects to MSAL auth URL with expected state/nonce', async () => {
    const app = express();
    app.use(router);

    // Proper 4-arg error handler (so any failure shows as 500 with a message)
    app.use((err: unknown, _req: express.Request, res: express.Response) => {
      res.status(500).send(String(err instanceof Error ? err.message : err));
    });

    const res = await request(app).get('/sso/login').expect(302);

    expect(res.headers['location']).toBe(
      'https://login.microsoftonline.com/tenant-xyz/oauth2/v2.0/authorize?...',
    );

    expect(getAuthCodeUrlMock).toHaveBeenCalledTimes(1);
    const [arg] = getAuthCodeUrlMock.mock.calls[0];
    expect(arg).toEqual(
      expect.objectContaining<AuthCodeUrlReq>({
        state: 'state-123',
        nonce: 'nonce-456',
        redirectUri: 'https://example.test/auth/callback',
        scopes: ['openid', 'profile'],
        responseMode: 'query',
        prompt: 'select_account',
      }),
    );

    // Session cookie should be set after the redirect
    expect(res.headers['set-cookie']).toBeDefined();
  });
});

describe('GET /sso/login-callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // /sso/login uses two UUIDs: state then nonce
    uuidV4()
      .mockReset()
      .mockReturnValueOnce('state-123')
      .mockReturnValueOnce('nonce-456');

    getAuthCodeUrlMock
      .mockReset()
      .mockResolvedValue(
        'https://login.microsoftonline.com/tenant-xyz/oauth2/v2.0/authorize?...',
      );

    acquireTokenByCodeMock.mockReset();
    serializeMock.mockReset().mockReturnValue('cache-string');
  });

  // Helper: new app instance with router + error handler
  function makeApp() {
    const app = express();
    app.use(router);
    app.use((err: unknown, _req: express.Request, res: express.Response) => {
      // If anything goes wrong, make debugging easy
      res.status(500).send(String(err instanceof Error ? err.message : err));
    });
    return app;
  }

  it('400 when code is missing', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    // First establish session + authState via /sso/login
    await agent.get('/sso/login').expect(302);

    // Missing code
    const res = await agent
      .get('/sso/login-callback?state=state-123')
      .expect(400);
    expect(res.text).toContain('Invalid auth response.');
    expect(acquireTokenByCodeMock).not.toHaveBeenCalled();
  });

  it('400 when state is missing', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    await agent.get('/sso/login').expect(302);

    const res = await agent.get('/sso/login-callback?code=abc').expect(400);
    expect(res.text).toContain('Invalid auth response.');
    expect(acquireTokenByCodeMock).not.toHaveBeenCalled();
  });

  it('400 when state does not match session', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    await agent.get('/sso/login').expect(302);

    const res = await agent
      .get('/sso/login-callback?code=abc&state=wrong')
      .expect(400);
    expect(res.text).toContain('Invalid auth response.');
    expect(acquireTokenByCodeMock).not.toHaveBeenCalled();
  });

  it('401 when MSAL returns no account', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    await agent.get('/sso/login').expect(302);

    // Simulate missing account (null or { } both should 401)
    acquireTokenByCodeMock.mockResolvedValueOnce({} as AcquireTokenResp);

    const res = await agent
      .get('/sso/login-callback?code=abc&state=state-123')
      .expect(401);

    expect(res.text).toContain('No account in token.');
    expect(acquireTokenByCodeMock).toHaveBeenCalledTimes(1);

    const [arg] = acquireTokenByCodeMock.mock.calls[0];
    expect(arg).toEqual(
      expect.objectContaining<AcquireTokenReq>({
        code: 'abc',
        redirectUri: 'https://example.test/auth/callback',
        scopes: ['openid', 'profile'],
      }),
    );
  });

  it('302 success: stores account + cache, then /sso/me is 200', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    await agent.get('/sso/login').expect(302);

    acquireTokenByCodeMock.mockResolvedValueOnce({
      account: {
        homeAccountId: 'home-1',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-xyz',
        username: 'user@example.test',
        name: 'User Example',
      },
    });

    const res = await agent
      .get('/sso/login-callback?code=the-code&state=state-123')
      .expect(302);

    expect(res.headers['location']).toBe('/applications-list');
    expect(acquireTokenByCodeMock).toHaveBeenCalledTimes(1);
    expect(serializeMock).toHaveBeenCalledTimes(1);

    const [arg] = acquireTokenByCodeMock.mock.calls[0];
    expect(arg).toEqual(
      expect.objectContaining<AcquireTokenReq>({
        code: 'the-code',
        redirectUri: 'https://example.test/auth/callback',
        scopes: ['openid', 'profile'],
      }),
    );

    // Prove session.account is set by hitting /sso/me
    const me = await agent.get('/sso/me').expect(200);
    expect(me.body).toMatchObject({
      authenticated: true,
      name: 'User Example',
      username: 'user@example.test',
    });
  });
});

describe('GET /sso/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // /sso/login uses two UUIDs: state then nonce
    uuidV4()
      .mockReset()
      .mockReturnValueOnce('state-123')
      .mockReturnValueOnce('nonce-456');

    getAuthCodeUrlMock
      .mockReset()
      .mockResolvedValue(
        'https://login.microsoftonline.com/tenant-xyz/oauth2/v2.0/authorize?...',
      );

    serializeMock.mockReset().mockReturnValue('cache-string');
  });

  function makeApp() {
    const app = express();
    app.use(router);
    // 4-arg error handler to surface unexpected errors during tests
    app.use((err: unknown, _req: express.Request, res: express.Response) => {
      res.status(500).send(String(err instanceof Error ? err.message : err));
    });
    return app;
  }

  it('redirects to Entra logout URL and destroys session (user logged in)', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    // Establish a session via /sso/login (sets cookie + authState)
    await agent.get('/sso/login').expect(302);

    const res = await agent.get('/sso/logout').expect(302);

    // post_logout_redirect_uri must be URL-encoded
    expect(res.headers['location']).toBe(
      'https://login.microsoftonline.com/tenant-xyz/oauth2/v2.0/logout' +
        '?post_logout_redirect_uri=https%3A%2F%2Fexample.test%2Fsigned-out',
    );

    // Session should be gone → /sso/me returns 401
    await agent.get('/sso/me').expect(401);
  });

  it('redirects to Entra logout URL even if not logged in', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    const res = await agent.get('/sso/logout').expect(302);

    expect(res.headers['location']).toBe(
      'https://login.microsoftonline.com/tenant-xyz/oauth2/v2.0/logout' +
        '?post_logout_redirect_uri=https%3A%2F%2Fexample.test%2Fsigned-out',
    );

    // Still unauthorized on /sso/me
    await agent.get('/sso/me').expect(401);
  });
});

describe('GET /sso/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // /sso/login uses two UUIDs: state then nonce
    uuidV4()
      .mockReset()
      .mockReturnValueOnce('state-123')
      .mockReturnValueOnce('nonce-456');

    getAuthCodeUrlMock
      .mockReset()
      .mockResolvedValue(
        'https://login.microsoftonline.com/tenant-xyz/oauth2/v2.0/authorize?...',
      );

    acquireTokenByCodeMock.mockReset();
    serializeMock.mockReset().mockReturnValue('cache-string');
  });

  function makeApp() {
    const app = express();
    app.use(router);
    // 4-arg error handler to surface unexpected errors during tests
    app.use((err: unknown, _req: express.Request, res: express.Response) => {
      res.status(500).send(String(err instanceof Error ? err.message : err));
    });
    return app;
  }

  it('returns 401 when no account is in the session', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    // Fresh session: no login performed
    const res = await agent.get('/sso/me').expect(401);
    expect(res.body).toEqual({ authenticated: false });
  });

  it('returns 200 with user details after successful login', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    // Establish session + state via /sso/login
    await agent.get('/sso/login').expect(302);

    // Mock MSAL token exchange to return an account
    acquireTokenByCodeMock.mockResolvedValueOnce({
      account: {
        homeAccountId: 'home-1',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-xyz',
        username: 'user@example.test',
        name: 'User Example',
      },
    });

    // Complete the login-callback with the matching state
    await agent
      .get('/sso/login-callback?code=the-code&state=state-123')
      .expect(302);

    // Now /sso/me should reflect the populated session
    const me = await agent.get('/sso/me').expect(200);
    expect(me.body).toEqual({
      authenticated: true,
      name: 'User Example',
      username: 'user@example.test',
    });
  });
});
