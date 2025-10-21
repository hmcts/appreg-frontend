import {
  AccountInfo,
  AuthenticationResult,
  ConfidentialClientApplication,
} from '@azure/msal-node';
import * as nodejsLogging from '@hmcts/nodejs-logging';
import { HmctsLogger } from '@hmcts/nodejs-logging';
import config from 'config';
import express, { Express, NextFunction, Request, Response } from 'express';
import { type RateLimitRequestHandler, rateLimit } from 'express-rate-limit';
import { v4 as uuid } from 'uuid';

import { buildAuthCodeRequest, buildAuthCodeUrlRequest } from '../msal';

const { Logger } = nodejsLogging as unknown as {
  Logger: { getLogger(name: string): HmctsLogger };
};
const logger: HmctsLogger = Logger.getLogger(
  'hmcts applications register - sso routes',
);

// --- Session typing ----------------------------------------------------------
declare module 'express-session' {
  interface SessionData {
    authState?: string;
    nonce?: string;
    account?: AccountInfo;
    tokenCache?: string;
  }
}

// --- Public types/exports ----------------------------------------------------
export type SsoConfigOverrides = Partial<{
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  postLogoutRedirectUri: string;
}>;

let ccaInstance: ConfidentialClientApplication | null = null;

/** Optional accessor if other modules need the MSAL instance */
export function getCca(): ConfidentialClientApplication {
  if (!ccaInstance) {
    throw new Error('SSO not initialised yet: call setupSsoRoutes(app) first.');
  }
  return ccaInstance;
}

// --- Internal constants ------------------------------------------------------
const loginRateWindowMs =
  (config.has?.('rateLimit.login.windowMs') &&
    config.get<number>('rateLimit.login.windowMs')) ||
  60_000; // 1 minute
const loginRateMax =
  (config.has?.('rateLimit.login.max') &&
    config.get<number>('rateLimit.login.max')) ||
  10;

const loginLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: loginRateWindowMs,
  max: loginRateMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.',
  statusCode: 429,
});

function getSignedOrPlainCookie(
  req: Request,
  name: string,
): string | undefined {
  const signed = (req as unknown as { signedCookies?: Record<string, unknown> })
    .signedCookies;
  const plain = (req as unknown as { cookies?: Record<string, unknown> })
    .cookies;
  const val = signed?.[name] ?? plain?.[name];
  return typeof val === 'string' ? val : undefined;
}

function getIdTokenNonce(
  ar: AuthenticationResult | null | undefined,
): string | undefined {
  const claims = ar?.idTokenClaims as unknown;
  if (!claims || typeof claims !== 'object') {
    return undefined;
  }
  const nonce = (claims as Record<string, unknown>)['nonce'];
  return typeof nonce === 'string' ? nonce : undefined;
}

// --- Main API (similar to setupInfoRoute) ------------------------------------
export function setupSsoRoutes(
  app: Express,
  overrides?: SsoConfigOverrides,
): void {
  // Resolve config NOW (post /mnt/secrets load), not at module import time
  const tenantId =
    overrides?.tenantId ??
    config.get<string>('secrets.appreg.azure-tenant-id-fe');
  const clientId =
    overrides?.clientId ?? config.get<string>('secrets.appreg.azure-app-id-fe');
  const clientSecret =
    overrides?.clientSecret ??
    config.get<string>('secrets.appreg.azure-client-secret-fe');
  const postLogoutRedirectUri =
    overrides?.postLogoutRedirectUri ??
    config.get<string>('auth.postLogoutRedirectUri');

  // Build MSAL with the real tenant/credentials
  ccaInstance = new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  });

  // Scoped router that carries session/cookie middleware only for SSO endpoints
  const router = express.Router();

  // ---- Routes ---------------------------------------------------------------

  // GET /sso/login -> redirect user to Entra ID
  router.get(
    '/sso/login',
    loginLimiter,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const state = uuid();
        const nonce = uuid();

        // short-lived, signed, httpOnly cookies (double-submit cookie pattern)
        res.cookie('sso_state', state, {
          httpOnly: true,
          sameSite: 'lax',
          secure: true,
          signed: true,
          maxAge: 5 * 60_000,
          path: '/sso',
        });
        res.cookie('sso_nonce', nonce, {
          httpOnly: true,
          sameSite: 'lax',
          secure: true,
          signed: true,
          maxAge: 5 * 60_000,
          path: '/sso',
        });

        const url = getCca().getAuthCodeUrl(
          buildAuthCodeUrlRequest(state, nonce),
        );
        res.redirect(await url);
        return;
      } catch (err) {
        logger.error(err as Error, 'Error during /sso/login');
        next(err);
        return;
      }
    },
  );

  // GET /sso/login-callback -> exchange code for tokens
  router.get(
    '/sso/login-callback',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const code =
          typeof req.query['code'] === 'string' ? req.query['code'] : undefined;
        const state =
          typeof req.query['state'] === 'string'
            ? req.query['state']
            : undefined;

        const cookieState = getSignedOrPlainCookie(req, 'sso_state');
        if (!code || !state || !cookieState || cookieState !== state) {
          res.status(400).send('Invalid auth response (state).');
          return;
        }

        const tokenResponse = await getCca().acquireTokenByCode(
          buildAuthCodeRequest(code),
        );

        if (!tokenResponse?.account) {
          res.status(401).send('Invalid auth response (no account).');
          return;
        }

        const cookieNonce = getSignedOrPlainCookie(req, 'sso_nonce');
        const nonceClaim = getIdTokenNonce(tokenResponse);
        if (!cookieNonce || !nonceClaim || cookieNonce !== nonceClaim) {
          res.status(401).send('Invalid auth response (nonce).');
          return;
        }

        // Clear one-time cookies
        res.clearCookie('sso_state', { path: '/sso' });
        res.clearCookie('sso_nonce', { path: '/sso' });

        // Persist identity + MSAL cache in the session (unchanged)
        req.session.account = tokenResponse.account;
        req.session.tokenCache = getCca().getTokenCache().serialize();

        req.session.save(() => {
          res.redirect('/applications-list');
        });
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
    const logoutUrl =
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout` +
      `?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

    req.session.destroy(() => {
      res.redirect(logoutUrl);
    });
  });

  // GET /sso/me -> simple session probe
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

  // Mount once
  app.use(router);
}
