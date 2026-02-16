import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { validateCourtVsLocOrCja } from '@util/location-suggestion-helpers';
import { readStringOrNullFromGroup } from '@util/string-helpers';
import { setControlError } from '@validators/validation-helpers';

//Checks requiredness and conflicts between court, location and cja fields
export function courtLocCjaValidator(opts?: {
  getCourtTyped?: () => string;
  getCjaTyped?: () => string;
}): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!(ctrl instanceof FormGroup)) {
      return null;
    }

    const court = readStringOrNullFromGroup(ctrl, 'court');
    const location = readStringOrNullFromGroup(ctrl, 'location');
    const cja = readStringOrNullFromGroup(ctrl, 'cja');

    const courtTyped = (opts?.getCourtTyped?.() ?? '').trim();
    const cjaTyped = (opts?.getCjaTyped?.() ?? '').trim();

    // Treat typing as "present" so we don't show Location/CJA required while user is using the court path
    const hasCourt = !!court || !!courtTyped;
    const hasLoc = !!location;
    const hasCja = !!cja || !!cjaTyped;

    // ---- Requiredness for UPDATE/CREATE rule ----
    // Valid if: court OR (location AND cja)
    const hasPair = hasLoc && hasCja;
    const valid = hasCourt || hasPair;

    // Only show "Other location required" when user has started/selected CJA (i.e. they're on that path)
    setControlError(
      ctrl,
      'location',
      'locationRequired',
      !hasCourt && hasCja && !hasLoc,
    );
    setControlError(ctrl, 'cja', 'cjaRequired', !hasCourt && hasLoc && !hasCja);

    // Single “rule” error (anchor on court)
    setControlError(ctrl, 'court', 'courtOrLocCjaRequired', !valid);

    // ---- Conflict ----
    // Only a real conflict if the CODE is set (not just typed) and user also filled other fields
    const conflictMsg =
      !!court && (hasLoc || !!cja)
        ? validateCourtVsLocOrCja({ court, location, cja })
        : null;

    // Store conflict on court control (so summary anchors consistently)
    const courtCtrl = ctrl.get('court');
    if (courtCtrl) {
      const current = { ...(courtCtrl.errors ?? {}) };
      if (conflictMsg) {
        current['courtLocCjaConflict'] = true;
      } else {
        delete current['courtLocCjaConflict'];
      }
      courtCtrl.setErrors(Object.keys(current).length ? current : null);
    }

    return null;
  };
}
