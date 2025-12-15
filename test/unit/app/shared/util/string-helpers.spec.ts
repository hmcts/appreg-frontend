import {
  trimToString,
  trimToUndefined,
} from '../../../../../src/app/shared/util/string-helpers';

describe('trimToString', () => {
  it('returns the trimmed string when given a string with surrounding spaces', () => {
    expect(trimToString('  hello  ')).toBe('hello');
  });

  it('returns the same string when already trimmed', () => {
    expect(trimToString('hello')).toBe('hello');
  });

  it('returns an empty string for an empty string input', () => {
    expect(trimToString('')).toBe('');
  });

  it('returns an empty string for a whitespace-only string', () => {
    expect(trimToString('   ')).toBe('');
    expect(trimToString('\n\t ')).toBe('');
  });

  it('returns an empty string for non-string values (number, boolean, null, undefined, object, array)', () => {
    expect(trimToString(123)).toBe('');
    expect(trimToString(true)).toBe('');
    expect(trimToString(false)).toBe('');
    expect(trimToString(null)).toBe('');
    expect(trimToString(undefined)).toBe('');
    expect(trimToString({})).toBe('');
    expect(trimToString([])).toBe('');
  });

  it('returns an empty string for functions and symbols', () => {
    expect(trimToString(Symbol('x'))).toBe('');
    expect(trimToString(() => 'hello')).toBe('');
  });
});

describe('trimToUndefined', () => {
  it('returns the trimmed string when given a non-empty string with spaces', () => {
    expect(trimToUndefined('  hello  ')).toBe('hello');
  });

  it('returns the same string when already trimmed and non-empty', () => {
    expect(trimToUndefined('hello')).toBe('hello');
  });

  it('returns undefined for an empty string', () => {
    expect(trimToUndefined('')).toBeUndefined();
  });

  it('returns undefined for a whitespace-only string', () => {
    expect(trimToUndefined('   ')).toBeUndefined();
    expect(trimToUndefined('\n\t ')).toBeUndefined();
  });

  it('returns undefined for non-string values (number, boolean, null, undefined, object, array)', () => {
    expect(trimToUndefined(123)).toBeUndefined();
    expect(trimToUndefined(true)).toBeUndefined();
    expect(trimToUndefined(false)).toBeUndefined();
    expect(trimToUndefined(null)).toBeUndefined();
    expect(trimToUndefined(undefined)).toBeUndefined();
    expect(trimToUndefined({})).toBeUndefined();
    expect(trimToUndefined([])).toBeUndefined();
  });

  it('returns undefined for functions and symbols', () => {
    expect(trimToUndefined(Symbol('x'))).toBeUndefined();
    expect(trimToUndefined(() => 'hello')).toBeUndefined();
  });
});
