import { FormGroup } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  BuildFormErrorSummaryOptions,
  FormErrorMessages,
} from '@core-types/error/form-error-messages.type';
import { buildFormErrorSummary } from '@util/error-summary';

const APPLICATIONS_LIST_DEFAULT_HREFS = {
  time: '#time-hours',
} as const;

export function buildApplicationsListErrorSummary<
  TErrorMessages extends FormErrorMessages,
>(
  form: FormGroup,
  messages: TErrorMessages,
  options?: BuildFormErrorSummaryOptions,
): ErrorItem[] {
  return buildFormErrorSummary(form, messages, {
    ...options,
    hrefs: {
      ...APPLICATIONS_LIST_DEFAULT_HREFS,
      ...options?.hrefs,
    },
  });
}
