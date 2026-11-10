/**
 * Form group validator that stops a single date being combined with a date
 * range. The API rejects that combination (ALE-57).
 *
 * The error is set on the single date control, which always has a value when
 * the rule fails, so the message shows next to a field the user filled in.
 * A range needs only one of its ends to count as given.
 */

import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

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

    const hasDate = hasValue(ctrl.get(dateControlName)?.value);
    const hasRange =
      hasValue(ctrl.get(fromControlName)?.value) ||
      hasValue(ctrl.get(toControlName)?.value);
    const hasBoth = hasDate && hasRange;

    setControlError(ctrl, dateControlName, errorKey, hasBoth);

    return hasBoth ? { [errorKey]: true } : null;
  };
}

function hasValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
