import { FormGroup } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ErrorHrefsMap, ErrorMessageMap } from '@util/error-summary';

export interface FormErrorMessages {
  [controlName: string]: {
    [errorType: string]: string;
  };
}

export type BuildFormErrorSummaryOptions = {
  nested?: { path: string; prefixId?: string }[];
  hrefs?: ErrorHrefsMap;
  // external groups not nested under the root form
  groups?: { group: FormGroup; prefixId?: string }[];
};

export type BuildFormErrorSummaryFn = (
  form: FormGroup,
  messages: ErrorMessageMap,
  options?: BuildFormErrorSummaryOptions,
) => ErrorItem[];
