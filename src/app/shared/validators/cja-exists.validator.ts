import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { setControlError } from '@validators/validation-helpers';

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

export function cjaMustExistIfTypedValidator(opts: {
  getTyped: () => string;
  getValidCodes: () => readonly string[];
}): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!(ctrl instanceof FormGroup)) {
      return null;
    }

    const typed = (opts.getTyped() ?? '').trim();

    // If they haven't typed anything, don't enforce existence.
    // Also clear any previous cjaNotFound error.
    if (!typed) {
      setControlError(ctrl, 'cja', 'cjaNotFound', false);
      return null;
    }

    const cjaCode = readStringOrNullFromGroup(ctrl, 'cja');
    const valid = !!cjaCode && opts.getValidCodes().includes(cjaCode);

    setControlError(ctrl, 'cja', 'cjaNotFound', !valid);

    return null;
  };
}
