import {
  normaliseTime,
  parseTimeToDuration,
  requireTime,
  toTimeString,
  todayIsoDate,
} from '@util/time-helpers';

type TimeInput = Parameters<typeof toTimeString>[0];

const makeDuration = (hours: number, minutes: number): TimeInput =>
  ({ hours, minutes }) as unknown as TimeInput;

describe('toTimeString', () => {
  it('returns trimmed HH:mm for a valid string input', () => {
    expect(toTimeString('09:15')).toBe('09:15');
    expect(toTimeString(' 09:15 ')).toBe('09:15');
  });

  it('returns undefined for invalid string formats or out-of-range times', () => {
    expect(toTimeString('9:15')).toBeUndefined();
    expect(toTimeString('24:00')).toBeUndefined();
    expect(toTimeString('12:60')).toBeUndefined();
    expect(toTimeString('not-a-time')).toBeUndefined();
  });

  it('converts a valid Duration to padded HH:mm', () => {
    const input = makeDuration(9, 5);
    expect(toTimeString(input)).toBe('09:05');
  });

  it('returns undefined for non-integer or out-of-range Duration values', () => {
    expect(toTimeString(makeDuration(23, 60))).toBeUndefined();
    expect(toTimeString(makeDuration(-1, 0))).toBeUndefined();
    expect(toTimeString(makeDuration(1.5, 10))).toBeUndefined();
  });
});

describe('normaliseTime', () => {
  it('returns empty string for null, undefined, or empty input', () => {
    expect(normaliseTime(null)).toBe('');
    expect(normaliseTime(undefined)).toBe('');
    expect(normaliseTime('')).toBe('');
  });

  it('returns HH:mm for a valid HH:mm string', () => {
    expect(normaliseTime('09:05')).toBe('09:05');
  });

  it('strips seconds and keeps HH:mm when seconds are present', () => {
    expect(normaliseTime('09:05:30')).toBe('09:05');
    expect(normaliseTime('23:59:59')).toBe('23:59');
  });

  it('returns empty string for non-time strings', () => {
    expect(normaliseTime('not-a-time')).toBe('');
    expect(normaliseTime('123')).toBe('');
  });
});

describe('parseTimeToDuration', () => {
  it('returns null for null, undefined, or empty input', () => {
    expect(parseTimeToDuration(null)).toBeNull();
    expect(parseTimeToDuration(undefined)).toBeNull();
    expect(parseTimeToDuration('')).toBeNull();
  });

  it('parses a simple HH:mm string into hours and minutes', () => {
    const result = parseTimeToDuration('09:05');
    expect(result).not.toBeNull();
    expect(result?.hours).toBe(9);
    expect(result?.minutes).toBe(5);
  });

  it('trims whitespace and parses the first two segments of a longer time', () => {
    const result = parseTimeToDuration(' 09:05:30 ');
    expect(result).not.toBeNull();
    expect(result?.hours).toBe(9);
    expect(result?.minutes).toBe(5);
  });

  it('returns null when there are fewer than two segments', () => {
    expect(parseTimeToDuration('12')).toBeNull();
  });

  it('returns null when hours or minutes are not finite numbers', () => {
    expect(parseTimeToDuration('aa:bb')).toBeNull();
    expect(parseTimeToDuration('12:xx')).toBeNull();
  });
});

describe('requireTime', () => {
  it('returns HH:mm for a valid HH:mm string input', () => {
    expect(requireTime('09:05')).toBe('09:05');
    expect(requireTime('23:59')).toBe('23:59');
  });

  it('returns HH:mm for a valid Duration input', () => {
    const input = makeDuration(9, 5);
    expect(requireTime(input)).toBe('09:05');
  });

  it('throws an error when toTimeString returns undefined (invalid time)', () => {
    expect(() => requireTime('24:00' as TimeInput)).toThrow('time required');
    expect(() => requireTime('not-a-time' as TimeInput)).toThrow(
      'time required',
    );
  });

  it('throws an error for null or undefined input', () => {
    expect(() => requireTime(null as TimeInput)).toThrow();
    expect(() => requireTime(undefined as TimeInput)).toThrow();
  });
});

describe('todayIsoDate', () => {
  it('returns the local date in YYYY-MM-DD format', () => {
    const fixed = new Date(2024, 1, 3, 9, 15, 0);
    jest.useFakeTimers();
    jest.setSystemTime(fixed);

    try {
      expect(todayIsoDate()).toBe('2024-02-03');
    } finally {
      jest.useRealTimers();
    }
  });
});
