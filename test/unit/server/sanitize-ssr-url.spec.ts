import { sanitizeSsrUrl } from '../../../server/utils/sanitize-ssr-url';

describe('sanitizeSsrUrl', () => {
  it.each([
    ['//evil.com/path', '/evil.com/path'],
    ['/\\\\evil.com/path', '/evil.com/path'],
    ['\\\\evil.com/path', '/evil.com/path'],
  ])('normalizes unsafe SSR URL %s', (input, expected) => {
    expect(sanitizeSsrUrl(input)).toBe(expected);
  });

  it.each([
    ['/applications-list', '/applications-list'],
    ['/assets/main.js', '/assets/main.js'],
    ['/sso/login', '/sso/login'],
  ])('leaves safe URL %s unchanged', (input, expected) => {
    expect(sanitizeSsrUrl(input)).toBe(expected);
  });
});
