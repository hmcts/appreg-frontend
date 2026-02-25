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
  summaryErrors: ErrorItem[];
  bulkApplicationsAllowed: boolean;
}

export const initialApplicationsListEntryCreateState: ApplicationsListEntryCreateState =
  {
    id: '',
    step: 'select',
    appCodeDetail: undefined,
    createDone: false,
    submitted: false,
    errorFound: false,
    summaryErrors: [],
    bulkApplicationsAllowed: false,
  };
