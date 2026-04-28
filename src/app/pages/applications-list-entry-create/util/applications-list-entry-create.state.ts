import { ApplicantStep } from './applications-list-entry-create.types';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SelectedStandardApplicantSummary } from '@components/standard-applicant-select/standard-applicant-select.component';
import { ApplicationCodeGetDetailDto } from '@openapi';

export interface ApplicationsListEntryCreateState {
  id: string;
  step: ApplicantStep;
  appCodeDetail: ApplicationCodeGetDetailDto | null;
  createDone: boolean;
  submitted: boolean;
  errorFound: boolean;
  summaryErrors: ErrorItem[];
  bulkApplicationsAllowed: boolean;
  isFeeRequired: boolean;
  currentStandardApplicantSummary: SelectedStandardApplicantSummary | null;
}

export const initialApplicationsListEntryCreateState: ApplicationsListEntryCreateState =
  {
    id: '',
    step: 'select',
    appCodeDetail: null,
    createDone: false,
    submitted: false,
    errorFound: false,
    summaryErrors: [],
    bulkApplicationsAllowed: false,
    isFeeRequired: false,
    currentStandardApplicantSummary: null,
  };
