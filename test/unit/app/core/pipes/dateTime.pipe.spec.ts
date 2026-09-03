import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DateTimePipe } from '@core/pipes/dateTime.pipe';

describe('DateTimePipe', () => {
  let pipe: DateTimePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DateTimePipe, { provide: LOCALE_ID, useValue: 'en-GB' }],
    });
    pipe = TestBed.inject(DateTimePipe);
  });

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

  it('formats an ISO timestamp using mediumDateTime', () => {
    expect(pipe.transform('2026-08-28T10:15:30Z', 'mediumDateTime')).toBe(
      '28 Aug 2026 at 11:15',
    );
  });

  it('formats an ISO timestamp in GMT outside British Summer Time', () => {
    expect(pipe.transform('2026-01-28T10:15:30Z', 'mediumDateTime')).toBe(
      '28 Jan 2026 at 10:15',
    );
  });
});
