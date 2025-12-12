import {
  emailIncorrectFormatMsg,
  phoneIncorrectFormatMsg,
} from '../../../../../src/app/shared/constants/err-msgs';
import {
  type ContactFieldIds,
  isValidPhone,
  isValidUkPostcode,
  validateOptionalContactFields,
} from '../../../../../src/app/shared/util/validation';

type ValidationErrors = { [key: string]: unknown };

const makeGetWithEmail =
  (email: string): ((name: string) => string) =>
  (name: string) =>
    name === 'emailAddress' ? email : '';

describe('isValidUkPostcode', () => {
  it('returns true for a valid UK postcode with space', () => {
    expect(isValidUkPostcode('SW1A 1AA')).toBe(true);
    expect(isValidUkPostcode('EC1A 1BB')).toBe(true);
  });

  it('returns true for a valid UK postcode without space and in lowercase', () => {
    expect(isValidUkPostcode('sw1a1aa')).toBe(true);
  });

  it('returns false for obviously invalid values', () => {
    expect(isValidUkPostcode('')).toBe(false);
    expect(isValidUkPostcode('XYZ')).toBe(false);
    expect(isValidUkPostcode('SW1A')).toBe(false);
    expect(isValidUkPostcode('12345')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('returns true for a 10–15 digit phone number', () => {
    expect(isValidPhone('0123456789')).toBe(true);
    expect(isValidPhone('07123456789')).toBe(true);
    expect(isValidPhone('+44 (0) 20 7946 0000')).toBe(true);
  });

  it('returns false when there are fewer than 10 digits', () => {
    expect(isValidPhone('123456789')).toBe(false);
    expect(isValidPhone('(01234) 5678')).toBe(false);
  });

  it('returns false when there are more than 15 digits', () => {
    expect(isValidPhone('1234567890123456')).toBe(false);
  });
});

describe('validateOptionalContactFields', () => {
  const ids: ContactFieldIds = {
    postcode: 'person-postcode',
    phone: 'person-phone-number',
    mobile: 'person-mobile-number',
    email: 'person-email-address',
  };

  it('does not add any errors when all optional fields are empty', () => {
    const get: (name: string) => string = () => '';
    const getErrors: (
      name: string,
    ) => ValidationErrors | null | undefined = () => null;

    const add: (id: string, text: string, href: string) => void = jest.fn();

    validateOptionalContactFields(get, getErrors, ids, add);

    expect(add).not.toHaveBeenCalled();
  });

  it('adds an error when postcode is invalid', () => {
    const get: (name: string) => string = (name) => {
      if (name === 'postcode') {
        return 'SW1A 1A';
      }
      return '';
    };
    const getErrors: (
      name: string,
    ) => ValidationErrors | null | undefined = () => null;

    const add: (id: string, text: string, href: string) => void = jest.fn();

    validateOptionalContactFields(get, getErrors, ids, add);

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(
      ids.postcode,
      'Enter a real postcode, like SW1A 1AA',
      `#${ids.postcode}`,
    );
  });

  it('adds an error when phone number is invalid', () => {
    const get: (name: string) => string = (name) => {
      if (name === 'phoneNumber') {
        return '12345';
      }
      return '';
    };
    const getErrors: (
      name: string,
    ) => ValidationErrors | null | undefined = () => null;

    const add: (id: string, text: string, href: string) => void = jest.fn();

    validateOptionalContactFields(get, getErrors, ids, add);

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(
      ids.phone,
      phoneIncorrectFormatMsg,
      `#${ids.phone}`,
    );
  });

  it('adds an error when mobile number is invalid', () => {
    const get: (name: string) => string = (name) => {
      if (name === 'mobileNumber') {
        return '999';
      }
      return '';
    };
    const getErrors: (
      name: string,
    ) => ValidationErrors | null | undefined = () => null;

    const add: (id: string, text: string, href: string) => void = jest.fn();

    validateOptionalContactFields(get, getErrors, ids, add);

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(
      ids.mobile,
      phoneIncorrectFormatMsg,
      `#${ids.mobile}`,
    );
  });

  it('adds an error when email has an Angular email validation error', () => {
    const get = makeGetWithEmail('user@example.com');

    const getErrors: (name: string) => ValidationErrors | null | undefined = (
      name,
    ) => {
      if (name === 'emailAddress') {
        return { email: true };
      }
      return null;
    };

    const add: (id: string, text: string, href: string) => void = jest.fn();

    validateOptionalContactFields(get, getErrors, ids, add);

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(
      ids.email,
      emailIncorrectFormatMsg,
      `#${ids.email}`,
    );
  });

  it('does not add an email error when there is no email validator error', () => {
    const get = makeGetWithEmail('user@example.com');

    const getErrors: (
      name: string,
    ) => ValidationErrors | null | undefined = () => null;

    const add: (id: string, text: string, href: string) => void = jest.fn();

    validateOptionalContactFields(get, getErrors, ids, add);

    expect(add).not.toHaveBeenCalled();
  });
});
