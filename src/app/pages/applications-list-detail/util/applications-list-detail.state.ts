import { ErrorItem } from '@components/error-summary/error-summary.component';
import { Row } from '@core-types/table/row.types';

export interface ApplicationsListDetailState {
  // paging
  currentPage: number;
  pageSize: number;
  totalPages: number;

  // rows + selection
  rows: Row[];
  selectedIds: Set<string>;
  selectedRows: Row[];

  // flags
  isLoading: boolean;
  updateDone: boolean;
  updateInvalid: boolean;

  // errors
  errorHint: string;
  errorSummary: ErrorItem[];

  // internal
  hasPrefilledFromApi: boolean;
}

export const initialApplicationsListDetailState: ApplicationsListDetailState = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,

  rows: [],
  selectedIds: new Set<string>(),
  selectedRows: [],

  isLoading: true,
  updateDone: false,
  updateInvalid: false,

  errorHint: '',
  errorSummary: [],

  hasPrefilledFromApi: false,
};

export const clearUpdateNotificationsPatch = (): Pick<
  ApplicationsListDetailState,
  'updateDone' | 'updateInvalid' | 'errorHint' | 'errorSummary'
> => ({
  updateDone: false,
  updateInvalid: false,
  errorHint: '',
  errorSummary: [],
});
