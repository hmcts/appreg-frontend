// Authentication & Session Management
export const AUTH_CONSTANTS = {
  SESSION_ENDPOINT: '/sso/me',
  SESSION_COOKIE_NAME: 'appreg.sid',
  AUTHENTICATED_PROPERTY: 'authenticated',
  NAME_PROPERTY: 'name',
  USERNAME_PROPERTY: 'username',
  AUTHENTICATED_VALUE: true,
  MICROSOFT_LOGIN_DOMAIN: 'login.microsoftonline.com',
} as const;

// Timeouts
export const TIMEOUT_CONSTANTS = {
  DEFAULT_TIMEOUT: 10000,
  EXTENDED_TIMEOUT: 15000,
  LONG_TIMEOUT: 30000,
  REDIRECT_SETTLE_MS: 2000,
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

// PDF
export const PDF_CONSTANTS = {
  DOWNLOADS_FOLDER: 'cypress/downloads',
  POLL_INTERVAL_MS: 500,
  DEFAULT_FIND_TIMEOUT_MS: 10000,
} as const;

// Application URLs
export const APP_URLS = {
  HOME: '/',
  APPLICATIONS_LIST: '/applications-list',
} as const;
