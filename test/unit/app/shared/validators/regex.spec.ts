import {
  ADDRESS_REGEX,
  ALPHANUMERIC_REGEX,
  APPLICATION_CODE_REGEX,
  ISO_DATE_REGEX,
  NAME_REGEX,
  SEARCHED_APPLICATION_CODE_REGEX,
  STANDARD_APPLICANT_CODE_REGEX,
  UK_POSTCODE_REGEX,
  UUID_REGEX,
} from '@constants/regex';

describe('regex constants', () => {
  describe('ALPHANUMERIC_REGEX', () => {
    it('accepts empty string', () => {
      expect(ALPHANUMERIC_REGEX.test('')).toBe(true);
    });

    it('accepts letters and numbers only', () => {
      expect(ALPHANUMERIC_REGEX.test('abcXYZ0123')).toBe(true);
    });

    it('rejects spaces and punctuation', () => {
      expect(ALPHANUMERIC_REGEX.test('abc 123')).toBe(false);
      expect(ALPHANUMERIC_REGEX.test('abc-123')).toBe(false);
      expect(ALPHANUMERIC_REGEX.test('abc_123')).toBe(false);
    });
  });

  describe('APPLICATION_CODE_REGEX', () => {
    it('accepts empty string', () => {
      expect(APPLICATION_CODE_REGEX.test('')).toBe(true);
    });

    it('accepts letters and numbers', () => {
      expect(APPLICATION_CODE_REGEX.test('APP2026X')).toBe(true);
      expect(APPLICATION_CODE_REGEX.test('123456')).toBe(true);
    });

    it('rejects anything else', () => {
      expect(APPLICATION_CODE_REGEX.test('APP-2026')).toBe(false);
      expect(APPLICATION_CODE_REGEX.test('APP 2026')).toBe(false);
      expect(APPLICATION_CODE_REGEX.test('APP.2026')).toBe(false);
    });
  });

  describe('SEARCHED_APPLICATION_CODE_REGEX', () => {
    it('accepts 1 to 10 letters and digits', () => {
      expect(SEARCHED_APPLICATION_CODE_REGEX.test('A')).toBe(true);
      expect(SEARCHED_APPLICATION_CODE_REGEX.test('AP99001')).toBe(true);
      expect(SEARCHED_APPLICATION_CODE_REGEX.test('ABCDEFGHIJ')).toBe(true);
    });

    it('rejects an empty code, other characters and more than 10 characters', () => {
      expect(SEARCHED_APPLICATION_CODE_REGEX.test('')).toBe(false);
      expect(SEARCHED_APPLICATION_CODE_REGEX.test('AP-99001')).toBe(false);
      expect(SEARCHED_APPLICATION_CODE_REGEX.test('AP 99001')).toBe(false);
      expect(SEARCHED_APPLICATION_CODE_REGEX.test('ABCDEFGHIJK')).toBe(false);
    });
  });

  describe('ISO_DATE_REGEX', () => {
    it('accepts a yyyy-MM-dd date', () => {
      expect(ISO_DATE_REGEX.test('2026-11-02')).toBe(true);
    });

    it('rejects anything else', () => {
      expect(ISO_DATE_REGEX.test('')).toBe(false);
      expect(ISO_DATE_REGEX.test('2026-11')).toBe(false);
      expect(ISO_DATE_REGEX.test('02/11/2026')).toBe(false);
      expect(ISO_DATE_REGEX.test('2026-11-02T00:00:00')).toBe(false);
    });
  });

  describe('UUID_REGEX', () => {
    it('accepts a UUID in either case', () => {
      expect(UUID_REGEX.test('3fa85f64-5717-4562-b3fc-2c963f66afa6')).toBe(
        true,
      );
      expect(UUID_REGEX.test('3FA85F64-5717-4562-B3FC-2C963F66AFA6')).toBe(
        true,
      );
    });

    it('rejects anything else', () => {
      expect(UUID_REGEX.test('')).toBe(false);
      expect(UUID_REGEX.test('3fa85f6457174562b3fc2c963f66afa6')).toBe(false);
      expect(UUID_REGEX.test('3fa85f64-5717-4562-b3fc-2c963f66afa')).toBe(
        false,
      );
      expect(UUID_REGEX.test('3fa85f64-5717-4562-b3fc-2c963f66afag')).toBe(
        false,
      );
      expect(UUID_REGEX.test('{3fa85f64-5717-4562-b3fc-2c963f66afa6}')).toBe(
        false,
      );
      expect(UUID_REGEX.test(' 3fa85f64-5717-4562-b3fc-2c963f66afa6')).toBe(
        false,
      );
    });
  });

  describe('STANDARD_APPLICANT_CODE_REGEX', () => {
    it('accepts allowed characters', () => {
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC123')).toBe(true);
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC-123')).toBe(true);
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC+123')).toBe(true);
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC_123')).toBe(true);
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC.123')).toBe(true);
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC 123')).toBe(true);
      expect(STANDARD_APPLICANT_CODE_REGEX.test('A+B-C._ 9')).toBe(true);
    });

    it('rejects disallowed characters', () => {
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC/123')).toBe(false);
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC@123')).toBe(false);
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC:123')).toBe(false);
      expect(STANDARD_APPLICANT_CODE_REGEX.test('ABC£123')).toBe(false);
    });
  });

  describe('UK_POSTCODE_REGEX (strict space enforced)', () => {
    it('accepts valid UK postcodes with a space', () => {
      expect(UK_POSTCODE_REGEX.test('SW1A 1AA')).toBe(true);
      expect(UK_POSTCODE_REGEX.test('EC1A 1BB')).toBe(true);
      expect(UK_POSTCODE_REGEX.test('W1A 0AX')).toBe(true);
      expect(UK_POSTCODE_REGEX.test('M1 1AE')).toBe(true);
      expect(UK_POSTCODE_REGEX.test('B33 8TH')).toBe(true);
      expect(UK_POSTCODE_REGEX.test('CR2 6XH')).toBe(true);
      expect(UK_POSTCODE_REGEX.test('DN55 1PT')).toBe(true);
    });

    it('accepts GIR 0AA special case (space required in this pattern)', () => {
      expect(UK_POSTCODE_REGEX.test('GIR 0AA')).toBe(true);
      expect(UK_POSTCODE_REGEX.test('gir 0aa')).toBe(true);
    });

    it('rejects postcodes without a space', () => {
      expect(UK_POSTCODE_REGEX.test('SW1A1AA')).toBe(false);
      expect(UK_POSTCODE_REGEX.test('EC1A1BB')).toBe(false);
      expect(UK_POSTCODE_REGEX.test('M11AE')).toBe(false);
    });

    it('rejects obvious invalid postcodes', () => {
      expect(UK_POSTCODE_REGEX.test('NOT A PC')).toBe(false);
      expect(UK_POSTCODE_REGEX.test('123 456')).toBe(false);
      expect(UK_POSTCODE_REGEX.test('SW1A AAA')).toBe(false);
      expect(UK_POSTCODE_REGEX.test('SW1A 1A')).toBe(false);
    });

    it('rejects leading/trailing whitespace unless trimmed by caller', () => {
      expect(UK_POSTCODE_REGEX.test(' SW1A 1AA')).toBe(false);
      expect(UK_POSTCODE_REGEX.test('SW1A 1AA ')).toBe(false);
    });
  });

  describe('NAME_REGEX / ADDRESS_REGEX (no control chars)', () => {
    const VALID_SAMPLES = [
      '',
      "John O'Connor",
      'François Dupont',
      'ACME (UK) Ltd #4',
      '10 Downing Street, London SW1A 2AA',
      '東京 1-2-3',
      'Contains < > { } [ ] ; # ~ = " $ ^ * (all allowed here)',
    ];

    it('accepts normal text including punctuation and unicode', () => {
      for (const s of VALID_SAMPLES) {
        expect(NAME_REGEX.test(s)).toBe(true);
        expect(ADDRESS_REGEX.test(s)).toBe(true);
      }
    });

    it('rejects newline (\\n)', () => {
      expect(NAME_REGEX.test('Line1\nLine2')).toBe(false);
      expect(ADDRESS_REGEX.test('Line1\nLine2')).toBe(false);
    });

    it('rejects carriage return (\\r)', () => {
      expect(NAME_REGEX.test('Line1\rLine2')).toBe(false);
      expect(ADDRESS_REGEX.test('Line1\rLine2')).toBe(false);
    });

    it('rejects tab (\\t)', () => {
      expect(NAME_REGEX.test('A\tB')).toBe(false);
      expect(ADDRESS_REGEX.test('A\tB')).toBe(false);
    });

    it('rejects NUL (\\u0000)', () => {
      expect(NAME_REGEX.test('A\u0000B')).toBe(false);
      expect(ADDRESS_REGEX.test('A\u0000B')).toBe(false);
    });

    it('rejects DEL (\\u007F) and C1 controls (\\u009F)', () => {
      expect(NAME_REGEX.test('A\u007FB')).toBe(false);
      expect(ADDRESS_REGEX.test('A\u007FB')).toBe(false);

      expect(NAME_REGEX.test('A\u009FB')).toBe(false);
      expect(ADDRESS_REGEX.test('A\u009FB')).toBe(false);
    });
  });
});
