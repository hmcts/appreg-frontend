/**
 * Validator checking if an applications-list can be closed in
 * src/app/pages/applications-list-detail/applications-list-detail-list-details
 *
 * There are several rules that are too complicated to validate on FE so here we will check
 * if the duration control value is not null/undefined/0 when status = 'CLOSED' and then rely
 * on BE responses for more thorough validation.
 */

import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { CLOSE_MESSAGES } from '@constants/application-list-detail-update/error-messages';
import { getTrimmedStringOrNullFromGroup } from '@util/string-helpers';
import { hasAnyDuration } from '@util/time-helpers';
import { setControlError } from '@util/validation-helpers';

type ClosePermittedOptions = {
  statusControlName?: string;
  durationControlName?: string;
};

export function closePermitted(
  options: ClosePermittedOptions = {},
): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!(ctrl instanceof FormGroup)) {
      return null;
    }

    const statusName = options.statusControlName ?? 'status';
    const durationName = options.durationControlName ?? 'duration';

    const status = getTrimmedStringOrNullFromGroup(ctrl, statusName);
    if (status !== 'closed') {
      // Reset this so that if the status is changed to open we don't show the error
      setControlError(ctrl, durationName, 'closeDurationMissing', false, {
        errorTextKey: 'durationErrorText',
        errorText: CLOSE_MESSAGES.durationMissing,
      });
      setControlError(ctrl, durationName, 'closeDurationMissing', false, {
        errorTextKey: 'durationErrorText',
        errorText: CLOSE_MESSAGES.durationNonPositive,
      });
      return null;
    }

    const noClose: string[] = [];

    // Rule 5
    const durationCtrl = ctrl.get(
      durationName,
    ) as AbstractControl<unknown> | null;
    const durationValue = durationCtrl?.value;

    const durationProvided = hasAnyDuration(durationValue);
    const durationNonPositive = isNonPositiveDuration(durationValue);

    if (!durationProvided) {
      noClose.push(CLOSE_MESSAGES.durationMissing);
      setControlError(ctrl, durationName, 'closeDurationMissing', true, {
        errorTextKey: 'durationErrorText',
        errorText: CLOSE_MESSAGES.durationMissing,
      });
    } else if (durationNonPositive) {
      noClose.push(CLOSE_MESSAGES.durationNonPositive);
      setControlError(ctrl, durationName, 'closeDurationMissing', true, {
        errorTextKey: 'durationErrorText',
        errorText: CLOSE_MESSAGES.durationNonPositive,
      });
    } else {
      setControlError(ctrl, durationName, 'closeDurationMissing', false, {
        errorTextKey: 'durationErrorText',
        errorText: CLOSE_MESSAGES.durationMissing,
      });
      setControlError(ctrl, durationName, 'closeDurationMissing', false, {
        errorTextKey: 'durationErrorText',
        errorText: CLOSE_MESSAGES.durationNonPositive,
      });
    }

    return noClose.length
      ? ({ closeNotPermitted: { noClose } } as ValidationErrors)
      : null;
  };
}

const isNonPositiveDuration = (v: unknown): boolean => {
  if (!v || typeof v !== 'object') {
    return false;
  }

  const { hours, minutes } = v as {
    hours?: unknown;
    minutes?: unknown;
  };

  const h = typeof hours === 'number' ? hours : null;
  const m = typeof minutes === 'number' ? minutes : null;
  if (h === null && m === null) {
    return false;
  }
  if (h !== null && !Number.isFinite(h)) {
    return false;
  }
  if (m !== null && !Number.isFinite(m)) {
    return false;
  }

  const totalMinutes = (h ?? 0) * 60 + (m ?? 0);
  return totalMinutes <= 0;
};
