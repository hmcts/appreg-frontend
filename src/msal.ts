import {
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
} from '@azure/msal-node';
import config from 'config';

const redirectUri = config.get<string>('auth.redirectUri');

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
