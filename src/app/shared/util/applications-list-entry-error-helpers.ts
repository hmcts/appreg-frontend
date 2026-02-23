import { FormGroup } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { RespondentEntryType } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import { ErrorMessageMap, buildFormErrorSummary } from '@util/error-summary';

interface BuildRespondentErrorsParams<ErrorMessageMap> {
  respondentEntryType: RespondentEntryType | null | undefined;

  respondentPersonForm: FormGroup;
  respondentOrganisationForm: FormGroup;

  errorMessages: ErrorMessageMap;

  respondentPersonHrefs: Record<string, string>;
  respondentOrganisationHrefs: Record<string, string>;
}

// Validation for respondent form. Returns errors or empty array
export function buildRespondentErrors<TErrorMessages extends ErrorMessageMap>({
  respondentEntryType,
  respondentPersonForm,
  respondentOrganisationForm,
  errorMessages,
  respondentPersonHrefs,
  respondentOrganisationHrefs,
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

  return [];
}
