import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { ApplicantType } from '@shared-types/applications-list-entry-create/application-list-entry-form';

export const standardApplicantCodeConditionalRequired: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const code = String(control.value ?? '').trim();

  // parent is the form group
  const parent = control.parent as {
    controls?: { applicantType?: { value?: ApplicantType } };
  } | null;
  const applicantType = parent?.controls?.applicantType?.value;

  if (applicantType === 'standard' && !code) {
    return { required: true };
  }

  return null;
};
