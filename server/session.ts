import type { HmctsLogger } from '@hmcts/nodejs-logging';
import { RedisStore } from 'connect-redis';
import type { RequestHandler } from 'express';
import session, {
  MemoryStore,
  type SessionOptions,
  type Store,
} from 'express-session';
import { type RedisClientType, createClient } from 'redis';

import { AppInsights } from '../server/modules/appinsights';
import { HmctsLoggerBridge } from '../server/modules/logger';

export interface SetupSessionArgs {
  isProd: boolean;
  useRedis: boolean;
  redisUrl?: string;
  cookieName: string;
  sessionSecret: string;
  prefix?: string;
  secureInProd?: boolean;
  maxAgeMs?: number;
  connectTimeoutMs?: number;
}

/**
 * Creates an Express session middleware.
 */
export async function setupSession({
  isProd,
  useRedis,
  redisUrl = '',
  cookieName,
  sessionSecret,
  prefix = 'appreg:sess:',
  secureInProd = true,
  maxAgeMs = 1000 * 60 * 60 * 8,
  connectTimeoutMs = 10_000,
}: SetupSessionArgs): Promise<RequestHandler> {
  const logger: HmctsLogger = HmctsLoggerBridge.enable(
    'hmcts applications register - session',
    AppInsights.client(),
  );

  let store: Store;

  if (useRedis) {
    const url = (redisUrl || '').trim();
    if (!url) {
      throw new Error(
        'Redis connection string is missing (secrets.appreg.redis-connection-string).',
      );
    }

    const client: RedisClientType = createClient({
      url,
      socket: {
        connectTimeout: connectTimeoutMs,
      },
    });

    client.on('error', (err) => logger.error('[redis] client error', err));
    await client.connect();

    store = new RedisStore({ client, prefix });
    logger.info('Using RedisStore');
  } else {
    store = new MemoryStore();
    logger.warn(
      isProd
        ? 'Using MemoryStore (Redis disabled for this run)'
        : 'Using MemoryStore for local dev',
    );
  }

  const prodCookie = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: secureInProd,
    maxAge: maxAgeMs,
    path: '/',
  };

  const devCookie = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: false,
  };

  const options: SessionOptions = {
    name: cookieName,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: isProd ? prodCookie : devCookie,
    rolling: false,
    store,
  };

  return session(options);
}
