import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

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

    const court = readStringOrNullFromGroup(ctrl, 'court');
    const location = readStringOrNullFromGroup(ctrl, 'location');
    const cja = readStringOrNullFromGroup(ctrl, 'cja');

    const hasCourt = !!court;
    const hasLoc = !!location;
    const hasCja = !!cja;

    // ---- Requiredness for CREATE ----
    // Valid if: court OR (location AND cja)
    const hasPair = hasLoc && hasCja;
    const valid = hasCourt || hasPair;

    // If court isn't provided, both location and cja must be present
    setControlError(ctrl, 'location', 'locationRequired', !hasCourt && !hasLoc);
    setControlError(ctrl, 'cja', 'cjaRequired', !hasCourt && !hasCja);

    // Single message for the rule (use court as the anchor)
    setControlError(ctrl, 'court', 'courtOrLocCjaRequired', !valid);

    // If court is provided, clear the dependent required errors
    if (hasCourt) {
      setControlError(ctrl, 'location', 'locationRequired', false);
      setControlError(ctrl, 'cja', 'cjaRequired', false);
    }

    // ---- Conflict ----
    // If court is filled and either other field is filled => conflict
    const conflictMsg =
      hasCourt && (hasLoc || hasCja)
        ? 'You can not have Court and Other Location or CJA filled in'
        : null;

    // Put the conflict on control
    const courtCtrl = ctrl.get('court');
    if (courtCtrl) {
      const current = { ...(courtCtrl.errors ?? {}) };

      if (conflictMsg) {
        current['courtLocCjaConflict'] = conflictMsg;
      } else {
        delete current['courtLocCjaConflict'];
      }

      courtCtrl.setErrors(Object.keys(current).length ? current : null);
    }

    return null;
  };
}
