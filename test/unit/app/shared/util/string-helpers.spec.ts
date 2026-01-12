import {
  mapOptionValueToTitle,
  mapTitleToOptionValue,
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

describe('mapTitleToOptionValue', () => {
  const options = [
    { value: 'mr', label: 'Mr' },
    { value: 'mrs', label: 'Mrs' },
    { value: 'other', label: 'Other' },
  ];

  it('normalises known titles to option values', () => {
    expect(mapTitleToOptionValue('Mr', options)).toBe('mr');
    expect(mapTitleToOptionValue('  MRS  ', options)).toBe('mrs');
    expect(mapTitleToOptionValue('Mr.', options)).toBe('mr');
  });

  it('returns empty string for empty or whitespace input', () => {
    expect(mapTitleToOptionValue('', options)).toBe('');
    expect(mapTitleToOptionValue('   ', options)).toBe('');
    expect(mapTitleToOptionValue(undefined, options)).toBe('');
    expect(mapTitleToOptionValue(null, options)).toBe('');
  });

  it('returns fallback value for unrecognised titles when fallback exists', () => {
    expect(mapTitleToOptionValue('Dr', options)).toBe('other');
  });

  it('returns empty string when fallback is not an option value', () => {
    expect(
      mapTitleToOptionValue('Dr', [{ value: 'mr', label: 'Mr' }], 'other'),
    ).toBe('');
  });
});

describe('mapOptionValueToTitle', () => {
  const options = [
    { value: 'mr', label: 'Mr' },
    { value: 'mrs', label: 'Mrs' },
  ];

  it('returns the label when a matching option exists', () => {
    expect(mapOptionValueToTitle('mr', options)).toBe('Mr');
    expect(mapOptionValueToTitle('mrs', options)).toBe('Mrs');
  });

  it('returns undefined for empty or whitespace input', () => {
    expect(mapOptionValueToTitle('', options)).toBeUndefined();
    expect(mapOptionValueToTitle('   ', options)).toBeUndefined();
    expect(mapOptionValueToTitle(undefined, options)).toBeUndefined();
    expect(mapOptionValueToTitle(null, options)).toBeUndefined();
  });

  it('returns undefined when the value does not match an option', () => {
    expect(mapOptionValueToTitle('dr', options)).toBeUndefined();
  });
});
