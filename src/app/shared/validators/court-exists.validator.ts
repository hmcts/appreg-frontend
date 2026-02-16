import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

function setOrClearControlError(
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

export function courtMustExistIfTypedValidator(opts: {
  getTyped: () => string;
  getValidCodes: () => readonly string[];
}): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!(ctrl instanceof FormGroup)) {
      return null;
    }

    const typed = (opts.getTyped() ?? '').trim();

    // If they haven't typed anything, don't enforce existence.
    // Also clear any previous courtNotFound error.
    if (!typed) {
      setOrClearControlError(ctrl, 'court', 'courtNotFound', false);
      return null;
    }

    const courtCode = readStringOrNullFromGroup(ctrl, 'court');
    const valid = !!courtCode && opts.getValidCodes().includes(courtCode);

    setOrClearControlError(ctrl, 'court', 'courtNotFound', !valid);

    return null;
  };
}
