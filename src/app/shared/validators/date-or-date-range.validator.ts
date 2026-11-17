/**
 * Form group validator that stops a list date being combined with a date
 * range, which the API rejects (ALE-57). The error goes on the date control,
 * which always has a value when the rule fails.
 */

import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { hasText } from '@util/string-helpers';
import { setControlError } from '@util/validation-helpers';

export function singleDateOrDateRangeValidator(
  dateControlName = 'date',
  fromControlName = 'dateFrom',
  toControlName = 'dateTo',
  errorKey = 'singleDateOrDateRange',
): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!(ctrl instanceof FormGroup)) {
      return null;
    }

    const hasDate = hasText(ctrl.get(dateControlName)?.value);
    const hasRange =
      hasText(ctrl.get(fromControlName)?.value) ||
      hasText(ctrl.get(toControlName)?.value);
    const hasBoth = hasDate && hasRange;

    setControlError(ctrl, dateControlName, errorKey, hasBoth);

    return hasBoth ? { [errorKey]: true } : null;
  };
}
