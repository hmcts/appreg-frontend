import { formatIsoDateToDmy } from '@util/date-utils';

describe('formatIsoDateToDmy', () => {
  it('returns empty string for undefined', () => {
    expect(formatIsoDateToDmy(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatIsoDateToDmy('')).toBe('');
  });

  it('formats ISO date YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatIsoDateToDmy('2025-04-24')).toBe('24/04/2025');
  });

  it('returns the original input when it does not match YYYY-MM-DD', () => {
    expect(formatIsoDateToDmy('2025/04/24')).toBe('2025/04/24');
    expect(formatIsoDateToDmy('24-04-2025')).toBe('24-04-2025');
    expect(formatIsoDateToDmy('not-a-date')).toBe('not-a-date');
  });

  it('does not validate real calendar dates (keeps formatting if pattern matches)', () => {
    // Regex matches, even though 2025-13-40 is not a real date
    expect(formatIsoDateToDmy('2025-13-40')).toBe('40/13/2025');
  });

  it('handles leading/trailing whitespace as non-matching and returns original', () => {
    expect(formatIsoDateToDmy(' 2025-04-24')).toBe(' 2025-04-24');
    expect(formatIsoDateToDmy('2025-04-24 ')).toBe('2025-04-24 ');
  });
});
