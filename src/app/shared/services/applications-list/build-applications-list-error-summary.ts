import { FormGroup } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@constants/applications-list/applications-list.constants';
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

export function buildErrorSummary<TErrorMessages extends FormErrorMessages>(
  form: FormGroup,
  messages: TErrorMessages,
): ErrorItem[] {
  const errors = buildApplicationsListErrorSummary(form, messages);

  if (form.hasError('atLeastOneRequired') && !errors.length) {
    errors.push({
      id: 'search-error',
      href: '#search',
      text: APPLICATIONS_LIST_ERROR_MESSAGES.invalidSearchCriteria,
    });
  }

  return errors;
}
