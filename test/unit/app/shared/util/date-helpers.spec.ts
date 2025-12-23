import { asIsoDate } from '@util/date-helpers';

describe('date-helpers: asIsoDate', () => {
  it('returns empty string for non-string inputs', () => {
    expect(asIsoDate(null)).toBe('');
    expect(asIsoDate(undefined)).toBe('');
    expect(asIsoDate(123)).toBe('');
    expect(asIsoDate({})).toBe('');
    expect(asIsoDate([])).toBe('');
    expect(asIsoDate(true)).toBe('');
  });

  it('returns empty string for empty/whitespace-only strings', () => {
    expect(asIsoDate('')).toBe('');
    expect(asIsoDate('   ')).toBe('');
    expect(asIsoDate('\n\t')).toBe('');
  });

  it('returns the trimmed value for yyyy-mm-dd', () => {
    expect(asIsoDate('2025-01-02')).toBe('2025-01-02');
    expect(asIsoDate('  2025-01-02  ')).toBe('2025-01-02');
  });

  it('returns the trimmed value for full ISO strings starting with yyyy-mm-dd', () => {
    expect(asIsoDate('2025-01-02T12:34:56Z')).toBe('2025-01-02T12:34:56Z');
    expect(asIsoDate(' 2025-01-02T12:34:56.789+01:00 ')).toBe(
      '2025-01-02T12:34:56.789+01:00',
    );
  });

  it('returns empty string for non-ISO date formats', () => {
    expect(asIsoDate('02-01-2025')).toBe('');
    expect(asIsoDate('2025/01/02')).toBe('');
    expect(asIsoDate('2025-1-2')).toBe('');
    expect(asIsoDate('not-a-date')).toBe('');
  });
});
