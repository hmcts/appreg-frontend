import { ErrorItem } from '@components/error-summary/error-summary.component';
import { EntryGetSummaryDto } from '@openapi';
import { ApplicationRow } from '@shared-types/applications/applications.type';

export interface ApplicationsState {
  isSearch: boolean;
  isLoading: boolean;
  submitted: boolean;
  isAdvancedSearch: boolean;

  errorHint: string;
  searchErrors: ErrorItem[];
  errorSummary: ErrorItem[];

  // results
  rows: EntryGetSummaryDto[];

  // paging
  currentPage: number;
  totalPages: number;
  pageSize: number;

  // table
  selectedIds: Set<string>;
  selectedRows: ApplicationRow[];
}

export const initialApplicationsState: ApplicationsState = {
  isSearch: false,
  isLoading: false,
  submitted: false,
  isAdvancedSearch: false,
  errorHint: 'There is a problem',
  searchErrors: [],
  errorSummary: [],

  rows: [],

  currentPage: 0,
  totalPages: 1,
  pageSize: 10,
  selectedIds: new Set<string>(),
  selectedRows: [],
};

// Clear error/notification state before a new search
export const clearNotificationsPatch = (): Pick<
  ApplicationsState,
  'errorSummary' | 'searchErrors'
> => ({
  errorSummary: [],
  searchErrors: [],
});

// When starting a search
export const startSearchPatch = (): Pick<
  ApplicationsState,
  'isLoading' | 'isSearch' | 'submitted'
> => ({
  isLoading: true,
  isSearch: true,
  submitted: true,
});

// When a search succeeds
export const searchSuccessPatch = (
  rows: EntryGetSummaryDto[],
  totalPages: number,
): Pick<ApplicationsState, 'rows' | 'totalPages' | 'isLoading'> => ({
  rows,
  totalPages,
  isLoading: false,
});

// When a search fails
export const searchErrorPatch = (): Pick<
  ApplicationsState,
  'errorHint' | 'searchErrors' | 'isLoading'
> => ({
  errorHint: 'There is a problem',
  searchErrors: [
    {
      id: '',
      text: 'There was a problem retrieving the applications. Try again.',
    },
  ],
  isLoading: false,
});

// Reset results/paging
export const clearResultsPatch = (): Pick<
  ApplicationsState,
  'rows' | 'currentPage' | 'totalPages' | 'submitted' | 'isSearch'
> => ({
  rows: [],
  currentPage: 0,
  totalPages: 1,
  submitted: false,
  isSearch: false,
});
