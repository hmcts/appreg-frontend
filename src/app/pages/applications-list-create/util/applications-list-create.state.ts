import { ErrorItem } from '@components/error-summary/error-summary.component';

export interface ApplicationsListCreateState {
  unpopField: ErrorItem[];
  createInvalid: boolean;
  createDone: boolean;
  submitted: boolean;
  errorHint: string;
}

export const initialApplicationsListCreateState: ApplicationsListCreateState = {
  submitted: false,
  unpopField: [],
  createInvalid: false,
  createDone: false,
  errorHint: 'There is a problem',
};

// Clear all error/success/notification states
export const clearNotificationsPatch = (): Pick<
  ApplicationsListCreateState,
  'unpopField' | 'createInvalid' | 'createDone' | 'errorHint'
> => ({
  unpopField: [],
  createInvalid: false,
  createDone: false,
  errorHint: 'There is a problem',
});
