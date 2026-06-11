import type { HmctsLogger } from '@hmcts/nodejs-logging';
import { RedisStore } from 'connect-redis';
import type { CookieOptions, Request, RequestHandler } from 'express';
import session, {
  MemoryStore,
  type SessionOptions,
  type Store,
} from 'express-session';
import {
  type RedisClientType,
  type RedisClusterType,
  createClient,
  createCluster,
} from 'redis';

import { AppInsights } from '../server/modules/appinsights';
import { HmctsLoggerBridge } from '../server/modules/logger';

export interface SetupSessionArgs {
  isProd: boolean;
  useRedis: boolean;
  redisUrl?: string;
  cookieName: string;
  sessionSecret: string;
  prefix?: string;
  secureCookies?: boolean | 'auto';
  maxAgeMs?: number;
  connectTimeoutMs?: number;
}

type RedisSessionClient = RedisClientType | RedisClusterType;

// 'strict' breaks SSO
export const COOKIE_SAME_SITE = 'lax' as const;

function parseRedisConnectionUrl(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

function isManagedRedisUrl(parsedUrl: URL | undefined): boolean {
  return Boolean(
    parsedUrl?.protocol === 'rediss:' &&
    parsedUrl.hostname.endsWith('.redis.azure.net'),
  );
}

function decodeUrlComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function resolveSecureCookiesSetting(
  secureCookies?: boolean | 'auto',
): boolean | 'auto' {
  return secureCookies ?? 'auto';
}

export function shouldUseSecureCookies(
  req: Pick<Request, 'secure'>,
  secureCookies: boolean | 'auto',
): boolean {
  return secureCookies === 'auto' ? req.secure : secureCookies;
}

export function buildXsrfCookieOptions(
  req: Pick<Request, 'secure'>,
  secureCookies: boolean | 'auto',
): CookieOptions {
  return {
    httpOnly: false,
    sameSite: COOKIE_SAME_SITE,
    secure: shouldUseSecureCookies(req, secureCookies),
    path: '/',
  };
}

export function buildSessionCookieOptions(
  req: Pick<Request, 'secure'>,
  secureCookies: boolean | 'auto',
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: COOKIE_SAME_SITE,
    secure: shouldUseSecureCookies(req, secureCookies),
    path: '/',
  };
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
  secureCookies,
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

    const parsedUrl = parseRedisConnectionUrl(url);
    const useClusterClient = isManagedRedisUrl(parsedUrl);
    const clusterCredentials = parsedUrl
      ? {
          ...(parsedUrl.username
            ? { username: decodeUrlComponent(parsedUrl.username) }
            : {}),
          ...(parsedUrl.password
            ? { password: decodeUrlComponent(parsedUrl.password) }
            : {}),
        }
      : {};

    const client: RedisSessionClient = useClusterClient
      ? createCluster({
          rootNodes: [{ url }],
          defaults: {
            ...clusterCredentials,
            socket: {
              tls: true,
              connectTimeout: connectTimeoutMs,
            },
          },
        })
      : createClient({
          url,
          socket: {
            connectTimeout: connectTimeoutMs,
          },
        });

    client.on('error', (err) => logger.error('[redis] client error', err));
    await client.connect();

    store = new RedisStore({ client, prefix });
    logger.info(
      useClusterClient
        ? 'Using RedisStore with Redis cluster client'
        : 'Using RedisStore',
    );
  } else {
    store = new MemoryStore();
    logger.warn(
      isProd
        ? 'Using MemoryStore (Redis disabled for this run)'
        : 'Using MemoryStore for local dev',
    );
  }

  const secureCookiesSetting = resolveSecureCookiesSetting(secureCookies);
  const cookie = {
    httpOnly: true,
    sameSite: COOKIE_SAME_SITE,
    secure: secureCookiesSetting,
    path: '/',
    ...(isProd ? { maxAge: maxAgeMs } : {}),
  };

  const options: SessionOptions = {
    name: cookieName,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie,
    rolling: false,
    store,
  };

  return session(options);
}
