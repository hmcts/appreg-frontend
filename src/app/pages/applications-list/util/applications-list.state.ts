import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ApplicationListRow } from '@util/types/application-list/types';

export interface ApplicationsListState {
  submitted: boolean;
  isSearch: boolean;
  deleteDone: boolean;
  deleteInvalid: boolean;
  isLoading: boolean;
  searchErrors: { id: string; text: string }[];
  errorSummary: ErrorItem[];
  deletingId: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  rows: ApplicationListRow[];
  sortField: { key: string; direction: 'desc' | 'asc' };
}

export const initialApplicationsListState: ApplicationsListState = {
  submitted: false,
  isSearch: false,
  deleteDone: false,
  deleteInvalid: false,
  isLoading: false,
  searchErrors: [],
  errorSummary: [],
  deletingId: null,
  currentPage: 1,
  totalPages: 5,
  pageSize: 10,
  rows: [],
  sortField: { key: 'date', direction: 'desc' },
};

// Clear all error/success/notification states
export const clearNotificationsPatch = (): Pick<
  ApplicationsListState,
  'deleteDone' | 'deleteInvalid' | 'errorSummary' | 'searchErrors' | 'submitted'
> => ({
  deleteDone: false,
  deleteInvalid: false,
  errorSummary: [],
  searchErrors: [],
  submitted: false,
});
