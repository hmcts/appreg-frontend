import type { AccountInfo, SilentFlowRequest } from '@azure/msal-node';
import * as nodejsLogging from '@hmcts/nodejs-logging';
import { HmctsLogger } from '@hmcts/nodejs-logging';
import config from 'config';
import express, { NextFunction, Request, Response } from 'express';

import { cca } from '../msal';

declare module 'express-session' {
  interface SessionData {
    account?: AccountInfo;
    tokenCache?: string;
  }
}

const { Logger } = nodejsLogging as unknown as {
  Logger: { getLogger(name: string): HmctsLogger };
};
const logger = Logger.getLogger('hmcts applications register - api routes');

const router = express.Router();

/** Require login (session must hold account + token cache) */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.account || !req.session?.tokenCache) {
    res.status(401).json({ error: 'Not authenticated' });
    return; // <-- ensure this path returns
  }
  next();
  return; // <-- ensure all code paths return
}

/** GET /api/test -> calls SpringBoot /test with user JWT */
router.get('/api/test', requireAuth, async (req, res, next): Promise<void> => {
  try {
    // Rehydrate token cache for this request
    cca.getTokenCache().deserialize(req.session.tokenCache!); // session holds cache from login

    const scopes = config.get<string[]>('api.scopes');
    const token = await cca.acquireTokenSilent({
      account: req.session.account!,
      scopes,
    } as SilentFlowRequest);

    if (!token?.accessToken) {
      res.status(401).json({ error: 'No access token' });
      return; // <-- explicit void return
    }

    const apiBase = config.get<string>('api.baseUrl');
    const upstream = await fetch(`${apiBase}/test`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });

    const bodyText = await upstream.text();
    res
      .status(upstream.status)
      .type(upstream.headers.get('content-type') || 'text/plain')
      .send(bodyText);
    return; // <-- explicit void return
  } catch (err) {
    logger.error(err as Error, 'Proxy /api/test failed');
    next(err);
    return; // <-- explicit void return
  }
});

export default router;
