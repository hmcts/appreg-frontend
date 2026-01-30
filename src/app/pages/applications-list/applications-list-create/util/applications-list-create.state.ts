import { ErrorItem } from '@components/error-summary/error-summary.component';

export interface ApplicationsListCreateState {
  errorSummary: ErrorItem[];
  createInvalid: boolean;
  createDone: boolean;
  submitted: boolean;
  errorHint: string;
}

export const initialApplicationsListCreateState: ApplicationsListCreateState = {
  submitted: false,
  errorSummary: [],
  createInvalid: false,
  createDone: false,
  errorHint: 'There is a problem',
};

// Clear all error/success/notification states
export const clearNotificationsPatch = (): Pick<
  ApplicationsListCreateState,
  'errorSummary' | 'createInvalid' | 'createDone' | 'errorHint'
> => ({
  errorSummary: [],
  createInvalid: false,
  createDone: false,
  errorHint: 'There is a problem',
});
