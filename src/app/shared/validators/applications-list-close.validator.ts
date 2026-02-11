/**
 * Validator checking if an applications-list can be closed
 * Rules for closing an applications-list are as follows:
 *
    1. Result requirement
        The entry must have at least one Application List Entry Result.

    2. Officials requirement
        The entry must have at least one linked Application List Entry Official.

    3. Fees requirement
        If the entry has associated fees, it must have at least one Application List Entry Fee Status marked PAID.

    4. Respondent requirement
        If the Application Code requires a respondent, the entry must have a respondent recorded.

    5. Duration requirement
        A duration (hours and/or minutes) must be recorded for the entry.
 */

import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { CLOSE_MESSAGES } from '@constants/application-list-detail-update/error-messages';
import { readStringOrNullFromGroup } from '@util/string-helpers';
import { hasAnyDuration } from '@util/time-helpers';
import { setControlError } from '@validators/validation-helpers';

export type CloseValidationEntry = {
  id?: string;
  hasResult?: boolean | null;
  hasOfficials?: boolean | null;
  hasFees?: boolean | null;
  hasPaidFee?: boolean | null;
  requiresRespondent?: boolean | null;
  hasRespondent?: boolean | null;
  hasDuration?: boolean | null;
};

export type CloseNotPermittedError = {
  noClose: string[];
};

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

    const status = readStringOrNullFromGroup(ctrl, statusName);
    if (status !== 'closed') {
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

    // TODO: we need to run another query i think to check if fees have been paid
    // Rule 3
    if (entries.some((e) => e.hasFees === true && e.hasPaidFee === false)) {
      noClose.push(CLOSE_MESSAGES.feeMissing);
    }

    // Rule 4 : this brokie
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

    if (entryDurationMissing || !hasAnyDuration(durationValue)) {
      noClose.push(CLOSE_MESSAGES.durationMissing);
      setControlError(ctrl, durationName, 'closeDurationMissing', true, {
        errorTextKey: 'durationErrorText',
        errorText: CLOSE_MESSAGES.durationMissing,
      });
    }

    return noClose.length
      ? ({ closeNotPermitted: { noClose } } as ValidationErrors)
      : null;
  };
}
