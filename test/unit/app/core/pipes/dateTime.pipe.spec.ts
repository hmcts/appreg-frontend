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
});
