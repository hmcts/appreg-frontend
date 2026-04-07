import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ErrorItem } from '@components/error-summary/error-summary.component';

export interface ApplicationsListCreateState {
  errorSummary: ErrorItem[];
  createInvalid: boolean;
  submitted: boolean;
  errorHint: string;

  listId: string;
  entriesToMove: ApplicationEntriesResultContext[];
}

export const initialApplicationsListCreateState: ApplicationsListCreateState = {
  submitted: false,
  errorSummary: [],
  createInvalid: false,
  errorHint: 'There is a problem',
  listId: '',
  entriesToMove: [],
};

// Clear all error/success/notification states
export const clearNotificationsPatch = (): Pick<
  ApplicationsListCreateState,
  'errorSummary' | 'createInvalid' | 'errorHint'
> => ({
  errorSummary: [],
  createInvalid: false,
  errorHint: 'There is a problem',
});
