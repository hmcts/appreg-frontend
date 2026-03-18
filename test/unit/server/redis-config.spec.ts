import { getRedisUrl } from '../../../server/redis-config';

type ConfigMap = Record<string, unknown>;

function makeConfig(values: ConfigMap) {
  return {
    has: (key: string): boolean => Object.hasOwn(values, key),
    get: <T = unknown>(key: string): T => values[key] as T,
  };
}

describe('redis-config', () => {
  it('reads the configured redis connection string', () => {
    const config = makeConfig({
      'secrets.appreg.redis-connection-string':
        'rediss://default:demo-password@appreg-demo.redis.cache.windows.net:6380',
    });

    expect(getRedisUrl(config)).toBe(
      'rediss://default:demo-password@appreg-demo.redis.cache.windows.net:6380',
    );
  });

  it('treats placeholder redis urls as unusable', () => {
    const config = makeConfig({
      'secrets.appreg.redis-connection-string': 'dummyRedisConnectionString',
    });

    expect(getRedisUrl(config)).toBe('');
  });
});
