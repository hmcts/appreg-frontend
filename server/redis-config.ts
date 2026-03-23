type ConfigLike = {
  has: (key: string) => boolean;
  get: <T = unknown>(key: string) => T;
};

const REDIS_URL_SECRET_KEY = 'secrets.appreg.redis-connection-string';
const PLACEHOLDER_REDIS_URL = 'dummyRedisConnectionString';

function readTrimmedConfigValue(config: ConfigLike, key: string): string {
  if (!config.has(key)) {
    return '';
  }

  return String(config.get<string>(key) || '').trim();
}

export function getRedisUrl(config: ConfigLike): string {
  const url = readTrimmedConfigValue(config, REDIS_URL_SECRET_KEY);
  return url !== PLACEHOLDER_REDIS_URL ? url : '';
}
