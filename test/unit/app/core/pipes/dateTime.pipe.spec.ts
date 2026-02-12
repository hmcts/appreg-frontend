import { DateTimePipe } from '@core/pipes/dateTime.pipe';

describe('DateTimePipe', () => {
  const pipe = new DateTimePipe();

  it('returns null for undefined', () => {
    expect(pipe.transform(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(pipe.transform('')).toBeNull();
  });

  it('formats ISO date YYYY-MM-DD using mediumDate by default', () => {
    expect(pipe.transform('2025-01-09')).toBe('9 Jan 2025');
    expect(pipe.transform('2025-11-24')).toBe('24 Nov 2025');
  });

  it('formats ISO date YYYY-MM-DD using longDate when format is longDate', () => {
    expect(pipe.transform('2025-01-09', 'longDate')).toBe('9 January 2025');
    expect(pipe.transform('2025-11-24', 'longDate')).toBe('24 November 2025');
  });

  it('returns the original input when it does not match YYYY-MM-DD', () => {
    expect(pipe.transform('2025/04/24')).toBe('2025/04/24');
    expect(pipe.transform('24-04-2025')).toBe('24-04-2025');
    expect(pipe.transform('not-a-date')).toBe('not-a-date');
  });

  it('returns the original input when month is out of range', () => {
    expect(pipe.transform('2025-00-24')).toBe('2025-00-24');
    expect(pipe.transform('2025-13-24')).toBe('2025-13-24');
    expect(pipe.transform('2025-13-32')).toBe('2025-13-32');
    expect(pipe.transform('2025-13-00')).toBe('2025-13-00');
  });
});
