import config from 'config';
import * as express from 'express';
import helmet from 'helmet';

const self = "'self'";
const localApiOrigin = 'http://localhost:4550';
const defaultLocalDevServerOrigin = 'http://localhost:4000';
const microsoftLoginOrigin = 'https://login.microsoftonline.com';
const appInsightsBrowserConfigOrigin = 'https://js.monitor.azure.com';
const APP_INSIGHTS_CONNECTION_STRING_KEY =
  'secrets.appreg.app-insights-connection-string-fe';

/**
 * Module that enables helmet in the application
 */
export class Helmet {
  private readonly developmentMode: boolean;
  constructor(developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  public enableFor(app: express.Express): void {
    // This is strict as we don't run any inline scripts.
    // If any are added in the future, it will need a hash added here.
    const scriptSrc = [self];
    const connectSrc = [self, localApiOrigin, ...getAppInsightsConnectSrc()];

    // logout is now a post req and we want to allow this in csp
    const formAction = [self, microsoftLoginOrigin];

    if (this.developmentMode) {
      // Uncaught EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval'
      // is not an allowed source of script in the following Content Security Policy directive:
      // "script-src 'self' *.google-analytics.com 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='".
      // seems to be related to webpack
      scriptSrc.push("'unsafe-eval'");
      formAction.push(getLocalDevServerOrigin());
    }

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            connectSrc,
            defaultSrc: [self, localApiOrigin],
            fontSrc: [self, 'data:'],
            formAction,
            imgSrc: [self],
            objectSrc: [self],
            scriptSrc,
            styleSrc: [self, "'unsafe-inline'"],
          },
        },
        referrerPolicy: { policy: 'origin' },
      }),
    );
  }
}

function getLocalDevServerOrigin(): string {
  const port = process.env['PORT'];
  return port ? `http://localhost:${port}` : defaultLocalDevServerOrigin;
}

function getAppInsightsConnectSrc(): string[] {
  const connectionString = readTrimmedConfigValue(
    APP_INSIGHTS_CONNECTION_STRING_KEY,
  );

  if (!connectionString) {
    return [];
  }

  const connectionStringMap = parseConnectionString(connectionString);
  const origins = new Set<string>([appInsightsBrowserConfigOrigin]);

  for (const endpointKey of ['ingestionendpoint', 'liveendpoint']) {
    const endpoint = connectionStringMap.get(endpointKey);
    if (endpoint) {
      addOrigin(origins, endpoint);
    }
  }

  const endpointSuffix = connectionStringMap.get('endpointsuffix');
  if (endpointSuffix) {
    const locationPrefix = toLocationPrefix(
      connectionStringMap.get('location'),
    );
    addOrigin(origins, `https://${locationPrefix}dc.${endpointSuffix}`);
    addOrigin(origins, `https://live.${endpointSuffix}`);
  }

  return Array.from(origins);
}

function parseConnectionString(connectionString: string): Map<string, string> {
  const map = new Map<string, string>();

  for (const segment of connectionString.split(';')) {
    const [rawKey, ...rawValueParts] = segment.split('=');
    const key = rawKey?.trim().toLowerCase();
    const value = rawValueParts.join('=').trim();

    if (key && value) {
      map.set(key, value);
    }
  }

  return map;
}

function toLocationPrefix(location: string | undefined): string {
  return location && location.length > 0 ? `${location}.` : '';
}

function addOrigin(origins: Set<string>, endpoint: string): void {
  try {
    origins.add(new URL(endpoint).origin);
  } catch {
    // Ignore invalid endpoint values and keep the rest of the policy intact.
  }
}

function readTrimmedConfigValue(key: string): string | null {
  if (!config.has(key)) {
    return null;
  }

  const value = String(config.get<string>(key) || '').trim();
  return value.length > 0 ? value : null;
}
