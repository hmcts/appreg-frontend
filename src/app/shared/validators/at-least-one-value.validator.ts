/**
 * Form group validator that ensures at least 1 value is given
 */

import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export function atLeastOneRequiredValidator(
  controlNames?: readonly string[],
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const controls = controlNames
      ? controlNames.map((name) => control.controls[name])
      : Object.values(control.controls);

    const hasValue = controls.some((child: AbstractControl) => {
      const value: unknown = child?.value;

      if (value === null || value === undefined) {
        return false;
      }

      if (typeof value === 'string') {
        return value.trim().length > 0;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return true;
    });

    return hasValue ? null : { atLeastOneRequired: true };
  };
}
