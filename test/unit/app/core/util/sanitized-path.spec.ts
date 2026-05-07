import { toSanitizedPath } from '@util/sanitized-path';

describe('toSanitizedPath', () => {
  it.each([null, undefined, ''])(
    'returns an empty string for %s',
    (url) => {
      expect(toSanitizedPath(url)).toBe('');
    },
  );

  it('returns only the pathname for an absolute URL', () => {
    expect(
      toSanitizedPath('https://appreg.example.test/application-lists?token=abc#details'),
    ).toBe('/application-lists');
  });

  it('returns only the pathname for a relative URL', () => {
    expect(toSanitizedPath('/reports?period=this-month#table')).toBe(
      '/reports',
    );
  });

  it('normalises a relative URL without a leading slash to a pathname', () => {
    expect(toSanitizedPath('applications-list?sort=desc')).toBe(
      '/applications-list',
    );
  });

  it.each([
    ['http://[::1/path?token=abc#details', 'http://[::1/path'],
    ['http://[::1/path?token=abc', 'http://[::1/path'],
    ['http://[::1/path#details', 'http://[::1/path'],
    ['http://[::1/path', 'http://[::1/path'],
  ])(
    'falls back to trimming query and hash from malformed URL %s',
    (url, expected) => {
      expect(toSanitizedPath(url)).toBe(expected);
    },
  );
});
