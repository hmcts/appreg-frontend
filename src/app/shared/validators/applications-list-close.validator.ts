/**
 * Validator checking if an applications-list can be closed in
 * src/app/pages/applications-list-detail/applications-list-detail-list-details
 *
 * Rules for closing an applications-list are as follows:
 *
    1. Result requirement
        The entry must have at least one Application List Entry Result.
        How we

    2. Officials requirement
        The entry must have at least one linked Application List Entry Official.

    3. Fees requirement
        If the entry has associated fees, it must have at least one Application List Entry Fee Status marked PAID.

    4. Respondent requirement
        If the Application Code requires a respondent, the entry must have a respondent recorded.

    5. Duration requirement
        A duration (hours and/or minutes) must be recorded for the entry.

  We can check rules 1 & 5 easily but with 2, 3, 4 its a little more complicated

  Run GET /application-lists/{listId}/entries/{entryId} for all entries on the list
  then check if all entries have an official arr length < 0 and throw error.
  This endpoint also gives application code which is used for another endpoint

  We then need to run GET /application-codes/{code} to determine whether respondent is required.
  If respondent is required, check respondent field is populated.
  If fees are required, check if fee string is 'PAID'

  Note: entries are all paginated so we need to check all pages if there's a large number of entries
 */

import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { CLOSE_MESSAGES } from '@constants/application-list-detail-update/error-messages';
import { CloseValidationEntry } from '@shared-types/applications-list-close/applications-list-close.type';
import { getTrimmedStringOrNullFromGroup } from '@util/string-helpers';
import { hasAnyDuration } from '@util/time-helpers';
import { setControlError } from '@util/validation-helpers';

type ClosePermittedOptions = {
  getEntries?: () => readonly CloseValidationEntry[];
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

    const entries = options.getEntries?.() ?? [];

    const noClose: string[] = [];

    // Rule 1
    if (entries.some((e) => e.hasResult === false)) {
      noClose.push(CLOSE_MESSAGES.resultMissing);
    }

    // Rule 2
    if (entries.some((e) => e.hasOfficials === false)) {
      noClose.push(CLOSE_MESSAGES.officialsMissing);
    }

    // Rule 3
    if (entries.some((e) => e.hasFees === true && e.hasPaidFee === false)) {
      noClose.push(CLOSE_MESSAGES.feeMissing);
    }

    // Rule 4
    if (
      entries.some(
        (e) => e.requiresRespondent === true && e.hasRespondent === false,
      )
    ) {
      noClose.push(CLOSE_MESSAGES.respondentMissing);
    }

    // Rule 5
    const durationCtrl = ctrl.get(
      durationName,
    ) as AbstractControl<unknown> | null;
    const durationValue = durationCtrl?.value;
    const entryDurationMissing = entries.some((e) => e.hasDuration === false);

    const durationProvided = hasAnyDuration(durationValue);
    const durationNonPositive = isNonPositiveDuration(durationValue);

    if (entryDurationMissing || !durationProvided) {
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
