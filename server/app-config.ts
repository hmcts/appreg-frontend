import config from 'config';

export interface BrowserAppConfig {
  environment: string;
  appInsights: {
    connectionString: string | null;
    enabled: boolean;
  };
}

const LOCAL_ENVIRONMENTS = new Set(['development', 'local', 'test']);

function readTrimmedConfigValue(key: string): string | null {
  if (!config.has(key)) {
    return null;
  }

  const value = String(config.get<string>(key) || '').trim();
  return value.length > 0 ? value : null;
}

function isLocalEnvironment(environment: string): boolean {
  return LOCAL_ENVIRONMENTS.has(environment.toLowerCase());
}

function isAppInsightsEnabled(
  environment: string,
  connectionString: string | null,
): boolean {
  const explicitEnabled = config.get<boolean | null>('appInsights.enabled');

  if (explicitEnabled !== null) {
    return explicitEnabled && Boolean(connectionString);
  }

  return !isLocalEnvironment(environment) && Boolean(connectionString);
}

export default function appConfig(): BrowserAppConfig {
  const environment = process.env['NODE_ENV'] || 'development';
  const connectionString = readTrimmedConfigValue(
    'secrets.appreg.app-insights-connection-string-fe',
  );
  const enabled = isAppInsightsEnabled(environment, connectionString);

  return {
    environment,
    appInsights: {
      enabled,
      connectionString: enabled ? connectionString : null,
    },
  };
}
