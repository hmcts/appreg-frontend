// Authentication & Session Management
export const AUTH_CONSTANTS = {
  SESSION_ENDPOINT: '/sso/me',
  SESSION_COOKIE_NAME: 'appreg.sid',
  AUTHENTICATED_PROPERTY: 'authenticated',
  NAME_PROPERTY: 'name',
  USERNAME_PROPERTY: 'username',
  AUTHENTICATED_VALUE: true,
  SESSION_WAIT_TIME: 3000,
  MICROSOFT_LOGIN_DOMAIN: 'login.microsoftonline.com',
} as const;

// Timeouts
export const TIMEOUT_CONSTANTS = {
  DEFAULT_TIMEOUT: 10000,
  EXTENDED_TIMEOUT: 15000,
  LONG_TIMEOUT: 30000,
} as const;

// HTTP Status Codes
export const HTTP_CONSTANTS = {
  STATUS_OK: 200,
} as const;

// UI Text & Labels
export const UI_CONSTANTS = {
  BUTTON_TEXT_SIGN_IN: 'Sign in',
  BUTTON_TEXT_SIGN_OUT: 'Sign out',
} as const;

// Application URLs
export const APP_URLS = {
  HOME: '/',
  APPLICATIONS_LIST: '/applications-list',
} as const;
