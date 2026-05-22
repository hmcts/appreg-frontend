import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { setControlError } from '@util/validation-helpers';

export function dateToOnOrAfterDateFromValidator(
  fromControlName = 'dateFrom',
  toControlName = 'dateTo',
  errorKey = 'dateRange',
): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!(ctrl instanceof FormGroup)) {
      return null;
    }

    const dateFrom = readIsoDate(ctrl.get(fromControlName)?.value);
    const dateTo = readIsoDate(ctrl.get(toControlName)?.value);
    const hasInvalidDateRange = !!dateFrom && !!dateTo && dateTo < dateFrom;

    setControlError(ctrl, toControlName, errorKey, hasInvalidDateRange);

    return hasInvalidDateRange ? { [errorKey]: true } : null;
  };
}

function readIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}
