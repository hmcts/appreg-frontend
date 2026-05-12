type CapturedSessionOptions = {
  name: string;
  secret: string;
  resave: boolean;
  saveUninitialized: boolean;
  rolling: boolean;
  cookie: Record<string, unknown>;
  store: unknown;
};

const mockSessionMiddleware = jest.fn();
const mockSession = jest.fn<unknown, [CapturedSessionOptions]>(
  () => mockSessionMiddleware,
);
const mockMemoryStore = jest.fn(() => ({ kind: 'memory-store' }));
const mockRedisStore = jest.fn(() => ({ kind: 'redis-store' }));
const mockRedisClient = {
  connect: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  on: jest.fn(),
};
const mockCreateClient = jest.fn(() => mockRedisClient);

jest.mock('express-session', () => ({
  __esModule: true,
  default: mockSession,
  MemoryStore: mockMemoryStore,
}));

jest.mock('connect-redis', () => ({
  RedisStore: mockRedisStore,
}));

jest.mock('redis', () => ({
  createClient: mockCreateClient,
}));

jest.mock('../../../server/modules/appinsights', () => ({
  AppInsights: {
    client: () => ({
      trackException: jest.fn(),
      trackTrace: jest.fn(),
    }),
  },
}));

jest.mock('../../../server/modules/logger', () => ({
  HmctsLoggerBridge: {
    enable: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

import {
  buildSessionCookieOptions,
  buildXsrfCookieOptions,
  resolveSecureCookiesSetting,
  setupSession,
  shouldUseSecureCookies,
} from '../../../server/session';

describe('server/session cookie helpers', () => {
  beforeEach(() => {
    mockSession.mockClear();
    mockMemoryStore.mockClear();
    mockRedisStore.mockClear();
    mockCreateClient.mockClear();
    mockRedisClient.connect.mockClear();
    mockRedisClient.on.mockClear();
  });

  const lastSessionOptions = (): CapturedSessionOptions => {
    const lastCall = mockSession.mock.calls.at(-1);
    if (!lastCall) {
      throw new Error('session was not called');
    }
    return lastCall[0];
  };

  test('defaults secure cookie handling to auto', () => {
    expect(resolveSecureCookiesSetting()).toBe('auto');
    expect(resolveSecureCookiesSetting(true)).toBe(true);
    expect(resolveSecureCookiesSetting(false)).toBe(false);
  });

  test('uses request security when secure cookies are auto', () => {
    expect(shouldUseSecureCookies({ secure: true }, 'auto')).toBe(true);
    expect(shouldUseSecureCookies({ secure: false }, 'auto')).toBe(false);
  });

  test('builds session cookies as HttpOnly', () => {
    expect(buildSessionCookieOptions({ secure: true }, 'auto')).toEqual({
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
  });

  test('builds xsrf cookies as browser-readable', () => {
    expect(buildXsrfCookieOptions({ secure: true }, 'auto')).toEqual({
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
  });

  test('setupSession uses MemoryStore for local development', async () => {
    const middleware = await setupSession({
      isProd: false,
      useRedis: false,
      cookieName: 'appreg.sid',
      sessionSecret: 'test-secret',
      secureCookies: false,
    });

    expect(middleware).toBe(mockSessionMiddleware);
    expect(mockMemoryStore).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(mockSession).toHaveBeenCalledTimes(1);
    expect(lastSessionOptions()).toEqual(
      expect.objectContaining({
        name: 'appreg.sid',
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        rolling: false,
        cookie: {
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          path: '/',
        },
        store: { kind: 'memory-store' },
      }),
    );
  });

  test('setupSession adds maxAge for production sessions', async () => {
    await setupSession({
      isProd: true,
      useRedis: false,
      cookieName: 'appreg.sid',
      sessionSecret: 'test-secret',
      maxAgeMs: 1234,
    });

    expect(lastSessionOptions().cookie).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: 'auto',
      path: '/',
      maxAge: 1234,
    });
  });

  test('setupSession rejects Redis mode when the connection string is missing', async () => {
    await expect(
      setupSession({
        isProd: true,
        useRedis: true,
        redisUrl: '   ',
        cookieName: 'appreg.sid',
        sessionSecret: 'test-secret',
      }),
    ).rejects.toThrow(
      'Redis connection string is missing (secrets.appreg.redis-connection-string).',
    );

    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(mockSession).not.toHaveBeenCalled();
  });

  test('setupSession connects Redis and uses RedisStore when Redis is enabled', async () => {
    await setupSession({
      isProd: true,
      useRedis: true,
      redisUrl: ' redis://localhost:6379 ',
      cookieName: 'appreg.sid',
      sessionSecret: 'test-secret',
      prefix: 'test:sess:',
      secureCookies: true,
      maxAgeMs: 5678,
      connectTimeoutMs: 4321,
    });

    expect(mockCreateClient).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
      socket: {
        connectTimeout: 4321,
      },
    });
    expect(mockRedisClient.on).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
    expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisStore).toHaveBeenCalledWith({
      client: mockRedisClient,
      prefix: 'test:sess:',
    });
    expect(lastSessionOptions()).toEqual(
      expect.objectContaining({
        cookie: {
          httpOnly: true,
          sameSite: 'lax',
          secure: true,
          path: '/',
          maxAge: 5678,
        },
        store: { kind: 'redis-store' },
      }),
    );
  });
});
