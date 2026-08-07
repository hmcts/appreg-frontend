import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { hasText } from '@util/string-helpers';
import { setControlError } from '@util/validation-helpers';

export const OFFICIAL_ROW_INCOMPLETE_ERROR = 'officialRowIncomplete';

export function officialRowRequiredValidator(
  titleControl: string,
  firstNameControl: string,
  surnameControl: string,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const title: unknown = control.get(titleControl)?.value;
    const firstName: unknown = control.get(firstNameControl)?.value;
    const surname: unknown = control.get(surnameControl)?.value;
    const rowStarted = hasText(title) || hasText(firstName) || hasText(surname);
    const incomplete = rowStarted && (!hasText(firstName) || !hasText(surname));

    setControlError(
      control,
      firstNameControl,
      'required',
      rowStarted && !hasText(firstName),
    );
    setControlError(
      control,
      surnameControl,
      'required',
      rowStarted && !hasText(surname),
    );

    return incomplete ? { [OFFICIAL_ROW_INCOMPLETE_ERROR]: true } : null;
  };
}
