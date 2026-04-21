import { ErrorItem } from '@components/error-summary/error-summary.component';

export interface StandardApplicantSelectPagingState {
  hasSearched: boolean;
  pageIndex: number;
  totalPages: number;
  pageSize: number;
  sortField: { key: string; direction: 'desc' | 'asc' };
  loading: boolean;
  searchErrors: ErrorItem[];
}

export const initialStandardApplicantSelectPagingState: StandardApplicantSelectPagingState =
  {
    hasSearched: false,
    pageIndex: 0,
    totalPages: 0,
    pageSize: 10,
    sortField: { key: 'code', direction: 'asc' },
    loading: false,
    searchErrors: [],
  };
