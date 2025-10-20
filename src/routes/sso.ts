import {
  AccountInfo,
  ConfidentialClientApplication,
} from '@azure/msal-node';
import * as nodejsLogging from '@hmcts/nodejs-logging';
import { HmctsLogger } from '@hmcts/nodejs-logging';
import config from 'config';
import express, {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import { type RateLimitRequestHandler, rateLimit } from 'express-rate-limit';
import type { ParamsDictionary } from 'express-serve-static-core';
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

// For POST (form_post) bodies
type LoginCallbackBody = {
  code?: string;
  state?: string;
  session_state?: string;
};

export type SsoConfigOverrides = Partial<{
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  postLogoutRedirectUri: string;
}>;

let ccaInstance: ConfidentialClientApplication | null = null;
export function getCca(): ConfidentialClientApplication {
  if (!ccaInstance) {
    throw new Error('SSO not initialised yet: call setupSsoRoutes(app) first.');
  }
  return ccaInstance;
}

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

// --- Shared helper: finish the code grant -----------------------------------
const finishAuthCodeGrant = async (
  req: Request,
  res: Response,
  code: string,
  state: string,
): Promise<void> => {
  if (state !== req.session.authState) {
    res.status(400).send('Invalid auth response.');
    return;
  }

  const tokenResponse = await getCca().acquireTokenByCode(
    buildAuthCodeRequest(code),
  );

  if (!tokenResponse?.account) {
    res.status(401).send('No account in token.');
    return;
  }

  req.session.account = tokenResponse.account;
  req.session.tokenCache = getCca().getTokenCache().serialize();
  res.redirect('/applications-list');
};

// --- Main API ---------------------------------------------------------------
export function setupSsoRoutes(
  app: Express,
  overrides?: SsoConfigOverrides,
): void {
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

  ccaInstance = new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  });

  const router = express.Router();

  // Login entrypoint
  router.get(
    '/sso/login',
    loginLimiter,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const state = uuid();
        const nonce = uuid();
        req.session.authState = state;
        req.session.nonce = nonce;

        const url = await getCca().getAuthCodeUrl(
          buildAuthCodeUrlRequest(state, nonce),
        );
        res.redirect(url);
      } catch (err) {
        logger.error(err as Error, 'Error during /sso/login');
        next(err);
      }
    },
  );

  // Parse application/x-www-form-urlencoded for form_post callbacks
  router.use(express.urlencoded({ extended: false }));

  // Unified callback: supports both GET (query) and POST (form_post)
  const loginCallback: RequestHandler<ParamsDictionary, unknown, LoginCallbackBody> = async (
    req,
    res,
    next,
  ) => {
    try {
      const fromBody = req.method === 'POST';
      const source: Partial<LoginCallbackBody> = fromBody
        ? req.body
        : (req.query as unknown as Partial<LoginCallbackBody>);

      const code  = typeof source.code  === 'string' ? source.code  : undefined;
      const state = typeof source.state === 'string' ? source.state : undefined;

      if (!code || !state) {
        res.status(400).send('Invalid auth response.');
        return;
      }

      await finishAuthCodeGrant(req, res, code, state); // ✅ now matches
    } catch (err) {
      next(err);
    }
  };

  router.all('/sso/login-callback', loginCallback);

  // Logout
  router.get('/sso/logout', (req: Request, res: Response): void => {
    const logoutUrl =
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout` +
      `?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

    req.session.destroy(() => {
      res.redirect(logoutUrl);
    });
  });

  // Session probe
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

  app.use(router);
}
