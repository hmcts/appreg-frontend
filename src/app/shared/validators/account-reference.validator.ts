import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { requiresAccountReference } from '@util/application-code-helpers';
import { getTrimmedStringOrNullFromGroup } from '@util/string-helpers';
import { setControlError } from '@util/validation-helpers';

const APPLICATION_CODE_CONTROL = 'applicationCode';
const ACCOUNT_REFERENCE_CONTROL = 'applicationNotes.accountReference';

export function accountReferenceRequiredForApplicationCode(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const applicationCode = getTrimmedStringOrNullFromGroup(
      control,
      APPLICATION_CODE_CONTROL,
    );
    const accountReference = getTrimmedStringOrNullFromGroup(
      control,
      ACCOUNT_REFERENCE_CONTROL,
    );

    setControlError(
      control,
      ACCOUNT_REFERENCE_CONTROL,
      'required',
      requiresAccountReference(applicationCode) && !accountReference,
    );

    return null;
  };
}
