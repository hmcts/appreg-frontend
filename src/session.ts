import type { HmctsLogger } from '@hmcts/nodejs-logging';
import { RedisStore } from 'connect-redis';
import type { RequestHandler } from 'express';
import session, { MemoryStore, type SessionOptions, type Store } from 'express-session';
import { type RedisClientType, createClient } from 'redis';

import { AppInsights } from './modules/appinsights';
import { HmctsLoggerBridge } from './modules/logger';


export interface SetupSessionArgs {
  isProd: boolean;
  redisHost: string;
  redisAccessKey: string;
  cookieName: string;
  sessionSecret: string;
  prefix?: string;
  secureInProd?: boolean;
  maxAgeMs?: number;
  connectTimeoutMs?: number;
}

/**
 * Creates an Express session middleware.
 * - In prod (isProd=true): RedisStore over TLS on :6380 with AUTH "default:<key>"
 * - In dev or when isProd=false: MemoryStore, secure:false cookie
 */
export async function setupSession({
                                     isProd,
                                     redisHost,
                                     redisAccessKey,
                                     cookieName,
                                     sessionSecret,
                                     prefix = 'appreg:sess:',
                                     secureInProd = true,
                                     maxAgeMs = 1000 * 60 * 60 * 8,
                                     connectTimeoutMs = 10_000,
                                   }: SetupSessionArgs): Promise<RequestHandler> {

  const logger: HmctsLogger = HmctsLoggerBridge.enable(
      'hmcts applications register - server',
      AppInsights.client(),
  );

  let store: Store;

  if (isProd) {
    const key = (redisAccessKey || '').trim();
    if (!key) {
      throw new Error('Redis access key is missing (secrets.appreg.redis-access-key).');
    }

    const url = `rediss://default:${encodeURIComponent(key)}@${redisHost}:6380`;

    const client: RedisClientType = createClient({
      url,
      socket: {
        connectTimeout: connectTimeoutMs
      },
    });

    client.on('error', (err) => logger.error('[redis] client error', err));
    await client.connect();

    store = new RedisStore({ client, prefix });
    logger.info('[session] Using RedisStore');
  } else {
    store = new MemoryStore();
    logger.warn(
      isProd
        ? '[session] Using MemoryStore (Redis disabled for this run)'
        : '[session] Using MemoryStore for local dev',
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
