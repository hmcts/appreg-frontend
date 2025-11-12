import {
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
} from '@azure/msal-node';
import config from 'config';

export const buildAuthCodeUrlRequest = (
  state: string,
  nonce: string,
  redirectUri: string,
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
  redirectUri: string,
): AuthorizationCodeRequest => ({
  code,
  scopes: config.get<string[]>('auth.scopes'),
  redirectUri,
});
