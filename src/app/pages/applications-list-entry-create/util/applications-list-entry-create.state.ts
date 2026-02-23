import { ApplicantStep } from './applications-list-entry-create.types';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ApplicationCodeGetDetailDto } from '@openapi';

export interface ApplicationsListEntryCreateState {
  id: string;
  step: ApplicantStep;
  appCodeDetail: ApplicationCodeGetDetailDto | undefined;
  createDone: boolean;
  submitted: boolean;
  errorFound: boolean;
  errorHint: string;
  summaryErrors: ErrorItem[];
}

export const initialApplicationsListEntryCreateState: ApplicationsListEntryCreateState =
  {
    id: '',
    step: 'select',
    appCodeDetail: undefined,
    createDone: false,
    submitted: false,
    errorFound: false,
    errorHint: '',
    summaryErrors: [],
  };

// Clear all error/success/notification states
export const clearStates = (): Pick<
  ApplicationsListEntryCreateState,
  | 'step'
  | 'createDone'
  | 'submitted'
  | 'errorFound'
  | 'errorHint'
  | 'summaryErrors'
> => ({
  step: 'select',
  createDone: false,
  submitted: false,
  errorFound: false,
  errorHint: '',
  summaryErrors: [],
});
