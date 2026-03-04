import { AbstractControl, FormGroup } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { RespondentEntryType } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import { ErrorMessageMap, buildFormErrorSummary } from '@util/error-summary';
import { controlHasAnyValue } from '@util/respondent-helpers';

interface BuildRespondentErrorsParams<ErrorMessageMap> {
  respondentEntryType: RespondentEntryType | null | undefined;

  respondentPersonForm: FormGroup;
  respondentOrganisationForm: FormGroup;

  errorMessages: ErrorMessageMap;

  respondentPersonHrefs: Record<string, string>;
  respondentOrganisationHrefs: Record<string, string>;
  respondentBulkControl: AbstractControl;
  respondentBulkHrefs: Record<string, string>;
  bulkCountRequired?: boolean;
}

function BulkRequiredError(
  control: AbstractControl,
  shouldRequireValue: boolean,
): void {
  const currentErrors = (control.errors ?? {}) as Record<string, unknown>;
  const nextErrors = { ...currentErrors };

  if (shouldRequireValue) {
    nextErrors['required'] = true;
  } else {
    delete nextErrors['required'];
  }

  control.setErrors(Object.keys(nextErrors).length > 0 ? nextErrors : null);
}

// Validation for respondent form. Returns errors or empty array
export function buildRespondentErrors<TErrorMessages extends ErrorMessageMap>({
  respondentEntryType,
  respondentPersonForm,
  respondentOrganisationForm,
  errorMessages,
  respondentPersonHrefs,
  respondentOrganisationHrefs,
  respondentBulkControl,
  respondentBulkHrefs,
  bulkCountRequired = false,
}: BuildRespondentErrorsParams<TErrorMessages>): ErrorItem[] {
  if (respondentEntryType === 'person') {
    respondentPersonForm.markAllAsTouched();
    respondentPersonForm.updateValueAndValidity({ emitEvent: false });

    return buildFormErrorSummary(respondentPersonForm, errorMessages, {
      hrefs: respondentPersonHrefs,
    });
  }

  if (respondentEntryType === 'organisation') {
    respondentOrganisationForm.markAllAsTouched();
    respondentOrganisationForm.updateValueAndValidity({ emitEvent: false });

    return buildFormErrorSummary(respondentOrganisationForm, errorMessages, {
      hrefs: respondentOrganisationHrefs,
    });
  }

  if (respondentEntryType === 'bulk') {
    respondentBulkControl.markAsTouched();
    respondentBulkControl.updateValueAndValidity({ emitEvent: false });

    BulkRequiredError(
      respondentBulkControl,
      bulkCountRequired && !controlHasAnyValue(respondentBulkControl),
    );

    const bulkGroup = new FormGroup({
      numberOfRespondents: respondentBulkControl,
    });

    return buildFormErrorSummary(bulkGroup, errorMessages, {
      hrefs: respondentBulkHrefs,
    });
  }

  return [];
}
