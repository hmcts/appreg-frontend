import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { validateCourtVsLocOrCja } from '@util/location-suggestion-helpers';
import { readStringOrNullFromGroup } from '@util/string-helpers';
import { setControlError } from '@util/validation';

type CourtLocCja = {
  court: string | null;
  location: string | null;
  cja: string | null;
};

//Checks requiredness and conflicts between court, location and cja fields
export function courtLocCjaValidator(): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!(ctrl instanceof FormGroup)) {
      return null;
    }

    const v: CourtLocCja = {
      court: readStringOrNullFromGroup(ctrl, 'court'),
      location: readStringOrNullFromGroup(ctrl, 'location'),
      cja: readStringOrNullFromGroup(ctrl, 'cja'),
    };

    const hasCourt = !!v.court;
    const hasLoc = !!v.location;
    const hasCja = !!v.cja;

    // Requiredness (matches collectMissing intent)
    if (!hasCourt) {
      setControlError(ctrl, 'location', 'locationRequired', !hasLoc);
      setControlError(ctrl, 'cja', 'cjaRequired', !hasCja);
      setControlError(ctrl, 'court', 'courtRequired', !(hasLoc || hasCja));
    } else {
      setControlError(ctrl, 'location', 'locationRequired', false);
      setControlError(ctrl, 'cja', 'cjaRequired', false);
      setControlError(ctrl, 'court', 'courtRequired', false);
    }

    // Conflict
    const conflictMsg = validateCourtVsLocOrCja(v);
    return conflictMsg
      ? { courtLocCjaConflict: { message: conflictMsg } }
      : null;
  };
}
