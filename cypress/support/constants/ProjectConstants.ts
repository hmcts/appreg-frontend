// Authentication Constants
export const AUTH_CONSTANTS = {
  SESSION_ENDPOINT: '/sso/me',
  SESSION_COOKIE_NAME: 'appreg.sid',
  AUTHENTICATED_PROPERTY: 'authenticated',
  NAME_PROPERTY: 'name',
  USERNAME_PROPERTY: 'username',
  HTTP_STATUS_OK: 200,
  AUTHENTICATED_VALUE: true,
  SESSION_WAIT_TIME: 3000,
  DEFAULT_TIMEOUT: 10000,
  EXTENDED_TIMEOUT: 15000,
  LONG_TIMEOUT: 30000
} as const;

// Application URLs
export const APP_URLS = {
  HOME: '/',
  APPLICATIONS_LIST: '/applications-list'
} as const;
