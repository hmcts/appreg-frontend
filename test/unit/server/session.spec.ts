jest.mock('../../../server/modules/appinsights', () => ({
  AppInsights: {
    client: () => ({
      trackException: jest.fn(),
      trackTrace: jest.fn(),
    }),
  },
}));

jest.mock('../../../server/modules/logger', () => ({
  HmctsLoggerBridge: {
    enable: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

import {
  buildSessionCookieOptions,
  buildXsrfCookieOptions,
  resolveSecureCookiesSetting,
  shouldUseSecureCookies,
} from '../../../server/session';

describe('server/session cookie helpers', () => {
  test('defaults secure cookie handling to auto', () => {
    expect(resolveSecureCookiesSetting()).toBe('auto');
    expect(resolveSecureCookiesSetting(true)).toBe(true);
    expect(resolveSecureCookiesSetting(false)).toBe(false);
  });

  test('uses request security when secure cookies are auto', () => {
    expect(shouldUseSecureCookies({ secure: true }, 'auto')).toBe(true);
    expect(shouldUseSecureCookies({ secure: false }, 'auto')).toBe(false);
  });

  test('builds session cookies as HttpOnly', () => {
    expect(buildSessionCookieOptions({ secure: true }, 'auto')).toEqual({
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
  });

  test('builds xsrf cookies as browser-readable', () => {
    expect(buildXsrfCookieOptions({ secure: true }, 'auto')).toEqual({
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
  });
});
