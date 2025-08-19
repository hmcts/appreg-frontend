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
const getAuthCodeUrlMock: jest.Mock<
  Promise<string>,
  [AuthCodeUrlReq]
> = jest.fn();

jest.mock('@azure/msal-node', () => {
  const ConfidentialClientApplication = jest.fn(() => ({
    getAuthCodeUrl: getAuthCodeUrlMock,
    acquireTokenByCode: jest.fn(),
    getTokenCache: () => ({ serialize: jest.fn() }),
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
