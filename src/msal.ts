import config from 'config';
import { AuthorizationCodeRequest, AuthorizationUrlRequest, ConfidentialClientApplication } from '@azure/msal-node';

const tenantId = config.get<string>('secrets.apps-reg.app-TENANT-ID');
const clientId = config.get<string>('secrets.apps-reg.app-CLIENT-ID');
const clientSecret = config.get<string>('secrets.apps-reg.app-CLIENT-SECRET');
const redirectUri = config.get<string>('auth.redirectUri');

export const cca = new ConfidentialClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret,
  },
  system: { loggerOptions: { piiLoggingEnabled: false } }
});

export const buildAuthCodeUrlRequest = (state: string, nonce: string): AuthorizationUrlRequest => ({
  scopes: config.get<string[]>('auth.scopes'),
  redirectUri,
  responseMode: 'query',
  state,
  nonce,
  prompt: 'select_account'
});

export const buildAuthCodeRequest = (code: string): AuthorizationCodeRequest => ({
  code,
  scopes: config.get<string[]>('auth.scopes'),
  redirectUri
});
