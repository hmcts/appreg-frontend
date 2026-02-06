import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { validateCourtVsLocOrCja } from '@util/location-suggestion-helpers';

type CourtLocCja = {
  court: string | null;
  location: string | null;
  cja: string | null;
};

function setControlError(
  group: FormGroup,
  controlName: string,
  key: string,
  on: boolean,
): void {
  const c = group.get(controlName);
  if (!c) {
    return;
  }

  const current = { ...(c.errors ?? {}) };
  if (on) {
    current[key] = true;
  } else {
    delete current[key];
  }

  c.setErrors(Object.keys(current).length ? current : null);
}

function readStringOrNullFromGroup(
  group: FormGroup,
  name: string,
): string | null {
  const v: unknown = group.get(name)?.value;
  if (typeof v !== 'string') {
    return null;
  }
  const s = v.trim();
  return s || null;
}

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
