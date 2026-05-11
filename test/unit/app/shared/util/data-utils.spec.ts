import {
  asArr,
  asObj,
  asStrOrNum,
  asString,
  hasStringProp,
  isRecord,
  makeTempId,
} from '@util/data-utils';

describe('data-utils', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
    jest.useRealTimers();
  });

  function setCrypto(value: unknown): void {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value,
    });
  }

  it('coerces object and array values safely', () => {
    const obj = { id: '123' };

    expect(asObj(obj)).toBe(obj);
    expect(asObj(null)).toBeNull();
    expect(asObj('value')).toBeNull();
    expect(asArr(['a'])).toEqual(['a']);
    expect(asArr('a')).toEqual([]);
  });

  it('checks records and string properties', () => {
    const value: unknown = { name: 'Application', count: 1 };

    expect(isRecord(value)).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(asString('Application')).toBe('Application');
    expect(asString(123)).toBeNull();

    if (isRecord(value)) {
      expect(hasStringProp(value, 'name')).toBe(true);
      expect(hasStringProp(value, 'count')).toBe(false);
    }
  });

  it('returns strings unchanged and numbers as strings', () => {
    expect(asStrOrNum('abc')).toBe('abc');
    expect(asStrOrNum(123)).toBe('123');
  });

  it('returns an empty string for non string-or-number values', () => {
    expect(asStrOrNum(null)).toBe('');
    expect(asStrOrNum({ id: 1 })).toBe('');
  });

  it('uses crypto.randomUUID when available', () => {
    setCrypto({
      randomUUID: jest.fn(() => 'uuid-123'),
    });

    expect(makeTempId('row')).toBe('row_uuid-123');
  });

  it('falls back to crypto.getRandomValues when randomUUID is unavailable', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-08T12:00:00.000Z'));
    setCrypto({
      getRandomValues: jest.fn((array: Uint8Array) => {
        array.set(Array.from({ length: 16 }, (_, index) => index + 1));
        return array;
      }),
    });

    expect(makeTempId('row')).toBe(
      'row_1778241600000_0102030405060708090a0b0c0d0e0f10',
    );
  });

  it('falls back to Date.now when crypto is unavailable', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-08T12:00:00.000Z'));
    setCrypto(undefined);

    expect(makeTempId('row')).toBe('row_1778241600000_1778241600000000');
  });
});
