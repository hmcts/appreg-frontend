import { AccountInfo, ConfidentialClientApplication } from '@azure/msal-node';
import * as nodejsLogging from '@hmcts/nodejs-logging';
import { HmctsLogger } from '@hmcts/nodejs-logging';
import config from 'config';
import express, { Express, Request, Response } from 'express';
import { type RateLimitRequestHandler, rateLimit } from 'express-rate-limit';
import { v4 as uuid } from 'uuid';

import { buildAuthCodeRequest, buildAuthCodeUrlRequest } from '../msal';
import {
  buildSessionCookieOptions,
  resolveSecureCookiesSetting,
} from '../session';

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

/** Build redirect URI based on current request */
function publicBase(req: Request): string {
  const proto =
    (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || req.protocol;
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host')!;
  return `${proto}://${host}`;
}

function displayErr(err: unknown): Error {
  return err instanceof Error
    ? err
    : new Error(typeof err === 'string' ? err : JSON.stringify(err));
}

// Origin & referer checks
function isValidLogoutOrigin(req: Request): boolean {
  const origin = req.get('origin');
  const referer = req.get('referer');
  const base = publicBase(req);

  if (!origin && !referer) {
    return false;
  }

  if (origin && origin !== base) {
    return false;
  }

  if (referer && referer !== base && !referer.startsWith(`${base}/`)) {
    return false;
  }

  return true;
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
const secureCookies = resolveSecureCookiesSetting(
  config.has?.('session.secure')
    ? config.get<boolean>('session.secure')
    : undefined,
);
const env = process.env['NODE_ENV'] || 'development';
const isProd = env === 'production';
let cookieName = 'sid';
if (isProd) {
  cookieName = 'appreg.sid';
}
if (config.has?.('session.cookieName')) {
  cookieName = config.get<string>('session.cookieName');
}

const loginLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: loginRateWindowMs,
  max: loginRateMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.',
  statusCode: 429,
});

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
  router.get('/sso/login', loginLimiter, async (req, res, next) => {
    try {
      const state = uuid();
      const nonce = uuid();
      req.session.authState = state;
      req.session.nonce = nonce;

      const redirectUri = `${publicBase(req)}/sso/login-callback`;
      const authUrl = await getCca().getAuthCodeUrl(
        buildAuthCodeUrlRequest(state, nonce, redirectUri),
      );
      res.redirect(authUrl);
    } catch (err) {
      logger.error(err as Error, 'Error during /sso/login');
      next(err);
    }
  });

  // GET /sso/login-callback -> exchange code for tokens
  router.get('/sso/login-callback', async (req, res, next) => {
    try {
      const code =
        typeof req.query['code'] === 'string' ? req.query['code'] : undefined;
      const state =
        typeof req.query['state'] === 'string' ? req.query['state'] : undefined;
      if (!code || !state || state !== req.session.authState) {
        res.status(400).send('Invalid auth response.');
        return;
      }

      // Regen session on callback
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) {
            reject(displayErr(err));
            return;
          }
          resolve();
        });
      });

      const redirectUri = `${publicBase(req)}/sso/login-callback`;
      const tokenResponse = await getCca().acquireTokenByCode(
        buildAuthCodeRequest(code, redirectUri),
      );

      if (!tokenResponse?.account) {
        res.status(401).send('No account in token.');
        return;
      }

      req.session.account = tokenResponse.account;
      req.session.tokenCache = getCca().getTokenCache().serialize();

      // Save session
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: unknown) => {
          if (err) {
            reject(displayErr(err));
            return;
          }
          resolve();
        });
      });

      res.redirect('/');
    } catch (err) {
      logger.error(err as Error, 'Error during /sso/login-callback');
      next(err);
    }
  });

  // POST /sso/logout -> clear session and call Entra logout
  router.post(
    '/sso/logout',
    express.urlencoded({ extended: false }),
    (req, res) => {
      const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
      const cookieToken = cookies['XSRF-TOKEN'];

      const reqBody = typeof req.body === 'object' ? req.body : undefined;

      if (!reqBody) {
        res.status(400).send('Bad request: request body not found');
        return;
      }

      const submittedToken =
        typeof reqBody['_csrf'] === 'string' ? req.body['_csrf'] : undefined;

      if (
        !isValidLogoutOrigin(req) ||
        !cookieToken ||
        !submittedToken ||
        cookieToken !== submittedToken
      ) {
        res.status(403).send('Forbidden');
        return;
      }

      const postLogoutRedirectUri = `${publicBase(req)}/login`;

      const logoutUrl =
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout` +
        `?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

      req.session.destroy(() => {
        res.clearCookie(
          cookieName,
          buildSessionCookieOptions(req, secureCookies),
        );
        res.redirect(logoutUrl);
      });
    },
  );

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
