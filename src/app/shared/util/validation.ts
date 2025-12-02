/* 
Common field validators
*/

export interface ContactFieldIds {
  postcode: string;
  phone: string;
  mobile: string;
  email: string;
}

export interface ValidationResult {
  fieldErrors: Record<string, string>;
  summaryItems: { text: string; href: string }[];
  valid: boolean;
}

export function isValidUkPostcode(s: string): boolean {
  const re = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i; // GOV.UK-friendly, lenient
  return re.test(s.trim());
}

export function isValidPhone(s: string): boolean {
  const digits = s.replaceAll(/[^\d]/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function isValidEmail(input: string): boolean {
  const value = input.trim();
  if (!value) {
    return false;
  }

  if (value.includes(' ')) {
    return false;
  }

  const atIndex = value.indexOf('@');
  if (atIndex <= 0 || atIndex === value.length - 1) {
    return false;
  }

  if (value.includes('@', atIndex + 1)) {
    return false;
  }

  const dotIndex = value.indexOf('.', atIndex + 1);
  if (dotIndex <= atIndex + 1 || dotIndex === value.length - 1) {
    return false;
  }

  return true;
}

export function validateOptionalContactFields(
  get: (name: string) => string,
  ids: ContactFieldIds,
  add: (id: string, text: string, href: string) => void,
): void {
  const postcode = get('postcode');
  if (postcode && !isValidUkPostcode(postcode)) {
    add(
      ids.postcode,
      'Enter a real postcode, like SW1A 1AA',
      `#${ids.postcode}`,
    );
  }

  const phone = get('phoneNumber');
  if (phone && !isValidPhone(phone)) {
    add(
      ids.phone,
      'Enter a phone number in the correct format',
      `#${ids.phone}`,
    );
  }

  const mobile = get('mobileNumber');
  if (mobile && !isValidPhone(mobile)) {
    add(
      ids.mobile,
      'Enter a mobile number in the correct format',
      `#${ids.mobile}`,
    );
  }

  const email = get('emailAddress');
  if (email && !isValidEmail(email)) {
    add(
      ids.email,
      'Enter an email address in the correct format',
      `#${ids.email}`,
    );
  }
}
