/**
 * Generic cross form validator which sets a form control validator to requied
 */

import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { setControlError } from '@util/validation-helpers';

export function crossFormValidation(
  firstControl: string,
  secondControl: string,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const sourceValue = control.get(firstControl)?.value as unknown;
    const targetValue = control.get(secondControl)?.value as unknown;
    const sourceHasText =
      typeof sourceValue === 'string' && sourceValue.trim().length > 0;
    const targetHasText =
      typeof targetValue === 'string' && targetValue.trim().length > 0;

    setControlError(
      control,
      secondControl,
      'required',
      sourceHasText && !targetHasText,
    );

    return null;
  };
}
