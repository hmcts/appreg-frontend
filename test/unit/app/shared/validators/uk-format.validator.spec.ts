import { AbstractControl } from '@angular/forms';

import { UK_POSTCODE_REGEX } from '@constants/regex';
import { ukMobile, ukPhone, ukPostcode } from '@validators/uk-format.validator';

const ctrl = (value: unknown): AbstractControl =>
  ({ value }) as AbstractControl;

describe('ukPostcode', () => {
  it('returns null for empty values (optional field)', () => {
    expect(ukPostcode(ctrl(null))).toBeNull();
    expect(ukPostcode(ctrl(undefined))).toBeNull();
    expect(ukPostcode(ctrl(''))).toBeNull();
    expect(ukPostcode(ctrl('   '))).toBeNull();
  });

  it('returns null for valid UK postcodes (including with whitespace)', () => {
    const samples = ['SW1A 2AA', 'sw1a 2aa', 'EC1A 1BB', 'M1 1AE', 'W1A 0AX'];

    for (const s of samples) {
      // sanity check against the actual regex constant used by the validator
      expect(UK_POSTCODE_REGEX.test(s.trim())).toBe(true);

      expect(ukPostcode(ctrl(s))).toBeNull();
      expect(ukPostcode(ctrl(`  ${s}  `))).toBeNull();
    }
  });

  it('returns { postcode: true } for invalid non-empty values', () => {
    expect(ukPostcode(ctrl('NOT A POSTCODE'))).toEqual({ postcode: true });
    expect(ukPostcode(ctrl('12345'))).toEqual({ postcode: true });
    expect(ukPostcode(ctrl('SW1A-2AA'))).toEqual({ postcode: true }); // dash
  });
});

describe('ukPhone', () => {
  it('accepts 11 digits starting with 0', () => {
    expect(ukPhone(ctrl('02079460000'))).toBeNull();
    expect(ukPhone(ctrl('07123456789'))).toBeNull();
  });

  it('accepts 12 digits starting with 44', () => {
    expect(ukPhone(ctrl('442079460000'))).toBeNull();
    expect(ukPhone(ctrl('447123456789'))).toBeNull();
  });

  it('strips non-digits before validating', () => {
    expect(ukPhone(ctrl('020 7946 0000'))).toBeNull();
    expect(ukPhone(ctrl('+44 20 7946 0000'))).toBeNull(); // "+", spaces
    expect(ukPhone(ctrl('(020) 7946-0000'))).toBeNull(); // punctuation
  });

  it('returns { phone: true } for invalid values', () => {
    expect(ukPhone(ctrl(null))).toEqual({ phone: true });
    expect(ukPhone(ctrl(undefined))).toEqual({ phone: true });
    expect(ukPhone(ctrl(''))).toEqual({ phone: true });
    expect(ukPhone(ctrl('   '))).toEqual({ phone: true });

    expect(ukPhone(ctrl('123'))).toEqual({ phone: true });
    expect(ukPhone(ctrl('99999999999'))).toEqual({ phone: true }); // 11 digits but not starting 0
  });

  it('does not accept 12 digits unless they start with 44', () => {
    expect(ukPhone(ctrl('331234567890'))).toEqual({ phone: true });
    expect(ukPhone(ctrl('001234567890'))).toEqual({ phone: true });
  });

  it('does not accept 11 digits unless they start with 0', () => {
    expect(ukPhone(ctrl('71234567890'))).toEqual({ phone: true });
    expect(ukPhone(ctrl('11234567890'))).toEqual({ phone: true });
  });
});

describe('ukMobile', () => {
  it('accepts 11 digits starting with 07', () => {
    expect(ukMobile(ctrl('07123456789'))).toBeNull();
  });

  it('accepts 12 digits starting with 447', () => {
    expect(ukMobile(ctrl('447123456789'))).toBeNull();
  });

  it('strips non-digits before validating', () => {
    expect(ukMobile(ctrl('07123 456 789'))).toBeNull();
    expect(ukMobile(ctrl('+44 7123 456789'))).toBeNull();
    expect(ukMobile(ctrl('(+44) 7123-456-789'))).toBeNull();
  });

  it('returns { mobile: true } for invalid values', () => {
    expect(ukMobile(ctrl(null))).toEqual({ mobile: true });
    expect(ukMobile(ctrl(undefined))).toEqual({ mobile: true });
    expect(ukMobile(ctrl(''))).toEqual({ mobile: true });
    expect(ukMobile(ctrl('   '))).toEqual({ mobile: true });

    expect(ukMobile(ctrl('02079460000'))).toEqual({ mobile: true }); // landline
    expect(ukMobile(ctrl('0723456789'))).toEqual({ mobile: true }); // too short
    expect(ukMobile(ctrl('071234567890'))).toEqual({ mobile: true }); // too long
    expect(ukMobile(ctrl('441234567890'))).toEqual({ mobile: true }); // 44 prefix but not 447
    expect(ukMobile(ctrl('44712345678'))).toEqual({ mobile: true }); // too short
  });
});
