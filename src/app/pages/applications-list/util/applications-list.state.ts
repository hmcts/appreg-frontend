import { ErrorItem } from '@components/error-summary/error-summary.component';

export interface ApplicationsListState {
  isSearch: boolean;
  deleteDone: boolean;
  deleteInvalid: boolean;
  isLoading: boolean;
  searchErrors: { id: string; text: string }[];
  errorSummary: ErrorItem[];
}

export const initialApplicationsListState: ApplicationsListState = {
  isSearch: false,
  deleteDone: false,
  deleteInvalid: false,
  isLoading: false,
  searchErrors: [],
  errorSummary: [],
};

// Clear all error/success/notification states
export const clearNotificationsPatch = (): Pick<
  ApplicationsListState,
  'deleteDone' | 'deleteInvalid' | 'errorSummary' | 'searchErrors'
> => ({
  deleteDone: false,
  deleteInvalid: false,
  errorSummary: [],
  searchErrors: [],
});
