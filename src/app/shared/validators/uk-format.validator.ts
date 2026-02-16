import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { UK_POSTCODE_REGEX } from '@constants/regex';

export const ukPostcode: ValidatorFn = (
  c: AbstractControl,
): ValidationErrors | null => {
  const v = `${c.value ?? ''}`.trim();
  if (!v) {
    return null;
  }
  return UK_POSTCODE_REGEX.test(v) ? null : { postcode: true };
};

export const ukPhone: ValidatorFn = (c) => {
  const digits = `${c.value ?? ''}`.trim().replace(/\D/g, '');
  return (digits.length === 11 && digits.startsWith('0')) ||
    (digits.length === 12 && digits.startsWith('44'))
    ? null
    : { phone: true };
};

export const ukMobile: ValidatorFn = (c) => {
  const digits = `${c.value ?? ''}`.trim().replace(/\D/g, '');
  return (digits.length === 11 && digits.startsWith('07')) ||
    (digits.length === 12 && digits.startsWith('447'))
    ? null
    : { mobile: true };
};
