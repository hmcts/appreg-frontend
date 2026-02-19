/*
Common field validators
*/

import { FormGroup } from '@angular/forms';

import { ControlErrorTextOptions } from '@shared-types/validators/validator.type';

export function setControlError(
  group: FormGroup,
  controlName: string,
  key: string,
  on: boolean,
  options: ControlErrorTextOptions = {},
): void {
  const c = group.get(controlName);
  if (!c) {
    return;
  }

  const current = { ...c.errors } as Record<string, unknown>;
  if (on) {
    current[key] = true;
    if (
      options.errorTextKey &&
      options.errorText &&
      typeof current[options.errorTextKey] !== 'string'
    ) {
      current[options.errorTextKey] = options.errorText;
    }
  } else {
    delete current[key];
    if (
      options.errorTextKey &&
      options.errorText &&
      current[options.errorTextKey] === options.errorText
    ) {
      delete current[options.errorTextKey];
    }
  }

  c.setErrors(Object.keys(current).length ? current : null);
}
