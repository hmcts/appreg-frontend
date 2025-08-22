import {
  AccountInfo,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  ConfidentialClientApplication,
} from '@azure/msal-node';
import * as nodejsLogging from '@hmcts/nodejs-logging';
import { HmctsLogger } from '@hmcts/nodejs-logging';
import config from 'config';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import { type RateLimitRequestHandler, rateLimit } from 'express-rate-limit';
import session from 'express-session';
import { v4 as uuid } from 'uuid';

const { Logger } = nodejsLogging as unknown as {
  Logger: { getLogger(name: string): HmctsLogger };
};
const logger: HmctsLogger = Logger.getLogger(
  'hmcts applications register - sso routes',
);

// ---- Augment express-session so req.session has typed fields ---------------
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

// Optional: make window/max configurable; provide sensible defaults
const loginRateWindowMs =
  (config.has?.('rateLimit.login.windowMs') &&
    config.get<number>('rateLimit.login.windowMs')) ||
  60_000; // 1 minute
const loginRateMax =
  (config.has?.('rateLimit.login.max') &&
    config.get<number>('rateLimit.login.max')) ||
  10; // 10 req/min per IP

// Per-route limiter for /sso/login
const loginLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: loginRateWindowMs,
  max: loginRateMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.',
  statusCode: 429,
});

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

// GET /sso/login -> redirect to Entra ID (rate-limited)
router.get(
  '/sso/login',
  loginLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('GET /sso/login start', {
      ip: req.ip,
      ua: req.get('user-agent'),
    });
    try {
      const state = uuid();
      const nonce = uuid();
      req.session.authState = state;
      req.session.nonce = nonce;
      logger.debug?.('Stored auth state/nonce in session');

      const url = await cca.getAuthCodeUrl(
        buildAuthCodeUrlRequest(state, nonce),
      );
      logger.info('Redirecting to Entra ID authorize endpoint');
      res.redirect(url);
      return;
    } catch (err) {
      logger.error(err as Error, 'Error during /sso/login');
      next(err);
      return;
    }
  },
);

// GET /sso/login-callback -> exchange code for tokens, set session
router.get(
  '/sso/login-callback',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('GET /sso/login-callback start', { ip: req.ip });
    try {
      // Type-guard the query params
      const code =
        typeof req.query['code'] === 'string' ? req.query['code'] : undefined;
      const state =
        typeof req.query['state'] === 'string' ? req.query['state'] : undefined;

      if (!code || !state) {
        logger.info('Invalid auth response: missing code or state');
        res.status(400).send('Invalid auth response.');
        return;
      }
      if (state !== req.session.authState) {
        logger.info('Invalid auth response: state mismatch', {
          expected: 'session.authState',
          received: 'query.state',
        });
        res.status(400).send('Invalid auth response.');
        return;
      }

      const tokenResponse = await cca.acquireTokenByCode(
        buildAuthCodeRequest(code),
      );
      if (!tokenResponse || !tokenResponse.account) {
        logger.info('No account in token from MSAL');
        res.status(401).send('No account in token.');
        return;
      }

      // Persist minimal session info (store cache string server-side)
      req.session.account = tokenResponse.account;
      const cache = cca.getTokenCache().serialize();
      req.session.tokenCache = cache;
      logger.info('User signed in', {
        username: tokenResponse.account.username,
        name: tokenResponse.account.name,
      });
      logger.debug?.(`Token cache serialized (len=${cache?.length ?? 0})`);

      res.redirect('/applications-list'); // change landing route if needed
      return;
    } catch (err) {
      logger.error(err as Error, 'Error during /sso/login-callback');
      next(err);
      return;
    }
  },
);

// GET /sso/logout -> clear session and call Entra logout
router.get('/sso/logout', (req: Request, res: Response): void => {
  logger.info('GET /sso/logout requested', {
    username: req.session.account?.username,
  });

  const logoutUrl =
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout` +
    `?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

  req.session.destroy(() => {
    logger.info('Session destroyed, redirecting to Entra logout');
    res.redirect(logoutUrl);
  });
});

// GET /sso/me -> probe session from the SPA
router.get('/sso/me', (req: Request, res: Response): void => {
  logger.debug?.('GET /sso/me probe', {
    hasAccount: Boolean(req.session.account),
  });

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
