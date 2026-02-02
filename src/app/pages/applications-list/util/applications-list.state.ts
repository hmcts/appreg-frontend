import { ErrorItem } from '@components/error-summary/error-summary.component';

export interface ApplicationsListState {
  isSearch: boolean;
  deleteDone: boolean;
  deleteInvalid: boolean;
  isLoading: boolean;
  searchErrors: { id: string; text: string }[];
  errorSummary: ErrorItem[];
  deletingId: string | null;
  sortField: { key: string; direction: 'desc' | 'asc' };
}

export const initialApplicationsListState: ApplicationsListState = {
  isSearch: false,
  deleteDone: false,
  deleteInvalid: false,
  isLoading: false,
  searchErrors: [],
  errorSummary: [],
  deletingId: null,
  sortField: { key: 'date', direction: 'desc' }, // Default sort
};

// Clear all error/success/notification states
export const clearNotificationsPatch = (): Pick<
  ApplicationsListState,
  | 'deleteDone'
  | 'deleteInvalid'
  | 'errorSummary'
  | 'searchErrors'
  | 'sortField'
> => ({
  deleteDone: false,
  deleteInvalid: false,
  errorSummary: [],
  searchErrors: [],
  sortField: { key: 'date', direction: 'desc' },
});
