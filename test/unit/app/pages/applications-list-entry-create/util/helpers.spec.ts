// helpers.spec.ts
// Adjust the import path to match your project structure.
import {
  compactStrings,
  hasRequiredOrg,
  hasRequiredPerson,
  makeContactDetails,
  normalisePhone,
  pruneNullish,
  toOptionalTrimmed,
} from '@components/applications-list-entry-create/util/helpers';

describe('helpers', () => {
  describe('toOptionalTrimmed', () => {
    it('returns undefined for null/undefined/empty/whitespace', () => {
      expect(toOptionalTrimmed(undefined)).toBeUndefined();
      expect(toOptionalTrimmed(null)).toBeUndefined();
      expect(toOptionalTrimmed('')).toBeUndefined();
      expect(toOptionalTrimmed('   ')).toBeUndefined();
    });

    it('trims and returns non-empty strings', () => {
      expect(toOptionalTrimmed('  abc  ')).toBe('abc');
      expect(toOptionalTrimmed('a')).toBe('a');
    });
  });

  describe('compactStrings', () => {
    it('returns undefined for empty input or when all values are empty after trim', () => {
      expect(compactStrings([])).toBeUndefined();
      expect(compactStrings([null, undefined, '', '   '])).toBeUndefined();
    });

    it('trims values and filters out nullish/empty strings', () => {
      expect(
        compactStrings([' a ', null, 'b', '   ', undefined, ' c ']),
      ).toEqual(['a', 'b', 'c']);
    });

    it('preserves order', () => {
      expect(compactStrings(['  z ', 'a', '  m  '])).toEqual(['z', 'a', 'm']);
    });
  });

  describe('hasRequiredPerson', () => {
    it('requires firstName + surname (trimmed); ignores addressLine1', () => {
      expect(hasRequiredPerson({ firstName: 'John', surname: 'Smith' })).toBe(
        true,
      );

      expect(
        hasRequiredPerson({ firstName: '  John  ', surname: '  Smith  ' }),
      ).toBe(true);

      expect(hasRequiredPerson({ firstName: 'John', surname: '' })).toBe(false);
      expect(hasRequiredPerson({ firstName: '', surname: 'Smith' })).toBe(
        false,
      );
      expect(hasRequiredPerson({ firstName: '   ', surname: 'Smith' })).toBe(
        false,
      );
      expect(hasRequiredPerson({ firstName: 'John', surname: '   ' })).toBe(
        false,
      );
      expect(hasRequiredPerson({})).toBe(false);

      // addressLine1 currently not checked by implementation
      expect(
        hasRequiredPerson({
          firstName: 'John',
          surname: 'Smith',
          addressLine1: '',
        }),
      ).toBe(true);
    });
  });

  describe('hasRequiredOrg', () => {
    it('requires name + addressLine1 (trimmed)', () => {
      expect(hasRequiredOrg({ name: 'ACME', addressLine1: '1 High St' })).toBe(
        true,
      );

      expect(
        hasRequiredOrg({ name: '  ACME  ', addressLine1: '  1 High St  ' }),
      ).toBe(true);

      expect(hasRequiredOrg({ name: 'ACME', addressLine1: '' })).toBe(false);
      expect(hasRequiredOrg({ name: '', addressLine1: '1 High St' })).toBe(
        false,
      );
      expect(hasRequiredOrg({ name: '   ', addressLine1: '1 High St' })).toBe(
        false,
      );
      expect(hasRequiredOrg({ name: 'ACME', addressLine1: '   ' })).toBe(false);
      expect(hasRequiredOrg({})).toBe(false);
    });
  });

  describe('pruneNullish', () => {
    it('deletes keys with null values but keeps undefined', () => {
      const o: {
        a?: string | null;
        b?: string | undefined;
        c?: number | null;
      } = {
        a: null,
        b: undefined,
        c: null,
      };

      const out = pruneNullish(o);

      expect(out).toBe(o); // mutates + returns same object
      expect('a' in out).toBe(false);
      expect('c' in out).toBe(false);
      expect('b' in out).toBe(true);
      expect(out.b).toBeUndefined();
    });

    it('does not delete falsy non-null values', () => {
      const o: Record<string, unknown> = { a: '', b: 0, c: false, d: null };
      pruneNullish(o);

      expect(o).toEqual({ a: '', b: 0, c: false });
    });
  });

  describe('normalisePhone', () => {
    it('returns undefined for null/undefined/empty/whitespace', () => {
      expect(normalisePhone(undefined)).toBeUndefined();
      expect(normalisePhone(null)).toBeUndefined();
      expect(normalisePhone('')).toBeUndefined();
      expect(normalisePhone('   ')).toBeUndefined();
    });

    it('trims and removes everything except digits, spaces, and hyphens', () => {
      expect(normalisePhone('+44 (0)20 7946 0018')).toBe('44 020 7946 0018');
      expect(normalisePhone('  07123-456-789  ')).toBe('07123-456-789');
      expect(normalisePhone('ext.123')).toBe('123');
    });

    it('preserves existing spaces/hyphens', () => {
      expect(normalisePhone('07 123 - 456 789')).toBe('07 123 - 456 789');
    });
  });

  describe('makeContactDetails', () => {
    it('trims address lines and email, uppercases postcode, normalises phone/mobile', () => {
      const cd = makeContactDetails({
        addressLine1: '  1 High St  ',
        addressLine2: '  Line 2 ',
        addressLine3: null,
        addressLine4: undefined,
        addressLine5: '   ',
        postcode: '  sw1a 1aa  ',
        phoneNumber: '+44 (0)20 7946 0018',
        mobileNumber: '  +44 7123 456789  ',
        emailAddress: '  test@example.com  ',
      });

      expect(cd.addressLine1).toBe('1 High St');
      expect(cd.addressLine2).toBe('Line 2');
      expect(cd.addressLine3).toBeUndefined();
      expect(cd.addressLine4).toBeUndefined();
      expect(cd.addressLine5).toBeUndefined(); // whitespace-only trimmed to undefined

      expect(cd.postcode).toBe('SW1A 1AA');

      expect(cd.phone).toBe('44 020 7946 0018');
      expect(cd.mobile).toBe('44 7123 456789');

      expect(cd.email).toBe('test@example.com');
    });

    it('keeps optional fields undefined when missing', () => {
      const cd = makeContactDetails({
        addressLine1: '1 High St',
      });

      expect(cd.addressLine1).toBe('1 High St');
      expect(cd.addressLine2).toBeUndefined();
      expect(cd.addressLine3).toBeUndefined();
      expect(cd.addressLine4).toBeUndefined();
      expect(cd.addressLine5).toBeUndefined();
      expect(cd.postcode).toBeUndefined();
      expect(cd.phone).toBeUndefined();
      expect(cd.mobile).toBeUndefined();
      expect(cd.email).toBeUndefined();
    });

    it('does not include null values after pruneNullish', () => {
      const cd = makeContactDetails({
        addressLine1: '1 High St',
        addressLine2: null,
        emailAddress: null,
      });

      expect(cd.addressLine2).toBeUndefined();
      expect(cd.email).toBeUndefined();
    });
  });
});
