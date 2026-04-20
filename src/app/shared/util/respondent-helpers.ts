import { AbstractControl } from '@angular/forms';

export function controlHasAnyValue(
  control: AbstractControl | null | undefined,
): boolean {
  // Recursively check control for values
  if (!control) {
    return false;
  }

  if (control.dirty) {
    return true;
  }

  const hasAnyValue = (value: unknown): boolean => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (Array.isArray(value)) {
      return value.some(hasAnyValue);
    }

    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some(hasAnyValue);
    }

    return false;
  };

  return hasAnyValue(control.getRawValue());
}

// Check if respondent forms have values
export function respondentFormsHaveAnyValue(params: {
  numberOfRespondents: AbstractControl | null | undefined;
  respondentPersonForm: AbstractControl | null | undefined;
  respondentOrganisationForm: AbstractControl | null | undefined;
}): boolean {
  return (
    controlHasAnyValue(params.numberOfRespondents) ||
    controlHasAnyValue(params.respondentPersonForm) ||
    controlHasAnyValue(params.respondentOrganisationForm)
  );
}
