import {
  AccountInfo,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  ConfidentialClientApplication,
} from '@azure/msal-node';
import config from 'config';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { v4 as uuid } from 'uuid';

// ---- Augment express-session so req.session has typed fields ----
declare module 'express-session' {
  interface SessionData {
    authState?: string;
    nonce?: string;
    account?: AccountInfo;
    tokenCache?: string;
  }
}

const tenantId = config.get<string>('secrets.apps-reg.app-TENANT-ID');
const clientId = config.get<string>('secrets.apps-reg.app-CLIENT-ID');
const clientSecret = config.get<string>('secrets.apps-reg.app-CLIENT-SECRET');
const redirectUri = config.get<string>('auth.redirectUri');
const scopes = config.get<string[]>('auth.scopes');
const postLogoutRedirectUri = config.get<string>('auth.postLogoutRedirectUri');

const cca = new ConfidentialClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret,
  },
});

const router = express.Router();

// Middleware
router.use(cookieParser());
router.use(
  session({
    name: config.get<string>('session.cookieName'),
    secret: config.get<string>('session.secret'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.get<boolean>('session.secure'),
    },
  }),
);

// Helpers
const buildAuthCodeUrlRequest = (
  state: string,
  nonce: string,
): AuthorizationUrlRequest => ({
  scopes,
  redirectUri,
  responseMode: 'query',
  state,
  nonce,
  prompt: 'select_account',
});

const buildAuthCodeRequest = (code: string): AuthorizationCodeRequest => ({
  code,
  scopes,
  redirectUri,
});

// GET /sso/login -> redirect to Entra ID
router.get(
  '/sso/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = uuid();
      const nonce = uuid();
      req.session.authState = state;
      req.session.nonce = nonce;

      const url = await cca.getAuthCodeUrl(
        buildAuthCodeUrlRequest(state, nonce),
      );
      res.redirect(url);
      return;
    } catch (err) {
      next(err);
      return;
    }
  },
);

// GET /sso/login-callback -> exchange code for tokens, set session
router.get(
  '/sso/login-callback',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Type-guard the query params
      const code =
        typeof req.query['code'] === 'string' ? req.query['code'] : undefined;
      const state =
        typeof req.query['state'] === 'string' ? req.query['state'] : undefined;

      if (!code || !state || state !== req.session.authState) {
        res.status(400).send('Invalid auth response.');
        return;
      }

      const tokenResponse = await cca.acquireTokenByCode(
        buildAuthCodeRequest(code),
      );
      if (!tokenResponse || !tokenResponse.account) {
        res.status(401).send('No account in token.');
        return;
      }

      // Persist minimal session info (store cache string server-side)
      req.session.account = tokenResponse.account;
      req.session.tokenCache = cca.getTokenCache().serialize();

      res.redirect('/applications-list'); // change landing route if needed
      return;
    } catch (err) {
      next(err);
      return;
    }
  },
);

// GET /sso/logout -> clear session and call Entra logout
router.get('/sso/logout', (req: Request, res: Response): void => {
  const logoutUrl =
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout` +
    `?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

  req.session.destroy(() => {
    res.redirect(logoutUrl);
  });
});

// GET /sso/me -> probe session from the SPA
router.get('/sso/me', (req: Request, res: Response): void => {
  if (req.session.account) {
    res.json({
      authenticated: true,
      name: req.session.account.name,
      username: req.session.account.username,
    });
    return;
  }
  res.status(401).json({ authenticated: false });
});

export default router;
