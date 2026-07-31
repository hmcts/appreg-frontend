import { Applicant } from '@openapi';
import {
  formatFullName,
  formatPartyName,
  formatPersonName,
  getDateStamp,
  hasText,
  mapOptionValueToTitle,
  mapTitleToOptionValue,
  returnOrgName,
  toNullableInteger,
  trimToNull,
  trimToString,
  trimToUndefined,
} from '@util/string-helpers';

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

describe('trimToNull', () => {
  it('returns the trimmed string when given a non-empty string with spaces', () => {
    expect(trimToNull('  hello  ')).toBe('hello');
  });

  it('returns null for empty, whitespace-only, and non-string values', () => {
    expect(trimToNull('')).toBeNull();
    expect(trimToNull('   ')).toBeNull();
    expect(trimToNull(null)).toBeNull();
    expect(trimToNull(undefined)).toBeNull();
    expect(trimToNull(123)).toBeNull();
  });
});

describe('hasText', () => {
  it('returns true only for strings with non-whitespace text', () => {
    expect(hasText('  hello  ')).toBe(true);
    expect(hasText('')).toBe(false);
    expect(hasText('   ')).toBe(false);
    expect(hasText(null)).toBe(false);
    expect(hasText(123)).toBe(false);
  });
});

describe('toNullableInteger', () => {
  it('returns integer numbers unchanged', () => {
    expect(toNullableInteger(12)).toBe(12);
    expect(toNullableInteger(0)).toBe(0);
    expect(toNullableInteger(-1)).toBe(-1);
  });

  it('parses strings containing whole numbers', () => {
    expect(toNullableInteger(' 12 ')).toBe(12);
    expect(toNullableInteger('0')).toBe(0);
    expect(toNullableInteger('0012')).toBe(12);
  });

  it('returns null for blank, non-numeric, and non-integer values', () => {
    expect(toNullableInteger(null)).toBeNull();
    expect(toNullableInteger(undefined)).toBeNull();
    expect(toNullableInteger('')).toBeNull();
    expect(toNullableInteger('   ')).toBeNull();
    expect(toNullableInteger('12.5')).toBeNull();
    expect(toNullableInteger('-1')).toBeNull();
    expect(toNullableInteger('abc')).toBeNull();
    expect(toNullableInteger(12.5)).toBeNull();
    expect(toNullableInteger(Number.NaN)).toBeNull();
    expect(toNullableInteger({})).toBeNull();
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
    expect(mapTitleToOptionValue('Other', options)).toBe('other');
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

describe('formatFullName', () => {
  it('returns null when name is missing', () => {
    expect(formatFullName()).toBeNull();
    expect(formatFullName(null)).toBeNull();
  });

  it('formats first forename and surname only', () => {
    expect(
      formatFullName({
        title: 'Mr',
        firstName: 'John',
        middleName: 'Paul',
        lastName: 'Smith',
      }),
    ).toBe('John Smith');
  });

  it('returns the available non-empty name part when one is missing', () => {
    expect(
      formatFullName({
        title: 'Mr',
        firstName: 'John',
        middleName: null,
        lastName: 'Smith',
      }),
    ).toBe('John Smith');
  });
});

describe('formatPersonName', () => {
  it('returns null when applicant or person name is missing', () => {
    expect(formatPersonName()).toBeNull();
    expect(formatPersonName({} as Applicant)).toBeNull();
    expect(formatPersonName({ person: {} } as Applicant)).toBeNull();
  });

  it('formats title, forenames, and surname', () => {
    const applicant = {
      person: {
        name: {
          title: 'Mr',
          firstName: 'John',
          middleName: 'Paul',
          lastName: 'Smith',
        },
      },
    } as Applicant;

    expect(formatPersonName(applicant)).toBe('John Smith');
  });

  it('skips missing forenames and empty title parts', () => {
    const applicant = {
      person: {
        name: {
          title: 'Mr',
          firstName: 'John',
          lastName: 'Smith',
        },
      },
    } as Applicant;

    expect(formatPersonName(applicant)).toBe('John Smith');
  });
});

describe('returnOrgName', () => {
  it('returns null when applicant or organisation is missing', () => {
    expect(returnOrgName()).toBeNull();
    expect(returnOrgName({} as Applicant)).toBeNull();
  });

  it('returns the organisation name when present', () => {
    const applicant = {
      organisation: {
        name: 'Acme Ltd',
      },
    } as Applicant;

    expect(returnOrgName(applicant)).toBe('Acme Ltd');
  });
});

describe('formatPartyName', () => {
  it('prefers organisation name over person name', () => {
    // Ignore this error
    const applicant = {
      organisation: { name: 'Acme Ltd' },
      person: {
        name: {
          title: 'Ms',
          firstForename: 'Jane',
          surname: 'Doe',
        },
      },
    } as Applicant;

    expect(formatPartyName(applicant)).toBe('Acme Ltd');
  });

  it('falls back to person name when organisation is absent', () => {
    const applicant = {
      person: {
        name: {
          title: 'Ms',
          firstName: 'Jane',
          lastName: 'Doe',
        },
      },
    } as Applicant;

    expect(formatPartyName(applicant)).toBe('Jane Doe');
  });
});

describe('getDateStamp', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns today in yyyy-mm-dd format', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-06T09:30:00Z'));

    expect(getDateStamp()).toBe('2026-07-06');
  });
});
