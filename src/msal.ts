import {
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  ConfidentialClientApplication,
} from '@azure/msal-node';
import config from 'config';

const tenantId = config.get<string>('secrets.appreg.azure-tenant-id-fe');
const clientId = config.get<string>('secrets.appreg.azure-app-id-fe');
const clientSecret = config.get<string>(
  'secrets.appreg.azure-client-secret-fe',
);
const redirectUri = config.get<string>('auth.redirectUri');

console.log('clientId: ', clientId);

export const cca = new ConfidentialClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret,
  },
  system: { loggerOptions: { piiLoggingEnabled: false } },
});

export const buildAuthCodeUrlRequest = (
  state: string,
  nonce: string,
): AuthorizationUrlRequest => ({
  scopes: config.get<string[]>('auth.scopes'),
  redirectUri,
  responseMode: 'query',
  state,
  nonce,
  prompt: 'select_account',
});

export const buildAuthCodeRequest = (
  code: string,
): AuthorizationCodeRequest => ({
  code,
  scopes: config.get<string[]>('auth.scopes'),
  redirectUri,
});
