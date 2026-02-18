import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const isEmpty = (v: unknown): boolean => {
  if (v === null || v === undefined) {
    return true;
  }
  if (typeof v === 'string') {
    return v.trim() === '';
  }
  return false;
};
export const optional =
  (validator: ValidatorFn): ValidatorFn =>
  (c: AbstractControl): ValidationErrors | null =>
    isEmpty(c.value) ? null : validator(c);
