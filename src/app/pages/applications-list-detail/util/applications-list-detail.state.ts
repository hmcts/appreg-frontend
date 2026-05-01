import { ErrorItem } from '@components/error-summary/error-summary.component';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListGetDetailDto,
  EntryApplicationListGetFilterDto,
} from '@openapi';

export type EntrySummary = NonNullable<
  ApplicationListGetDetailDto['entriesSummary']
>[number];

export interface ApplicationsListDetailState {
  // paging
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalEntries: number;
  sortField: { key: string; direction: 'desc' | 'asc' };

  // rows + selection
  rows: Row[];
  selectedIds: Set<string>;
  selectedRows: Row[];
  allMatchingSelected: boolean;

  // flags
  createDone: boolean;
  isLoading: boolean;
  isSelectingAll: boolean;
  updateDone: boolean;
  updateInvalid: boolean;
  moveDone: boolean;

  // errors
  errorHint: string;
  errorSummary: ErrorItem[];
  preserveErrorSummaryOnLoad: boolean;

  // internal
  hasPrefilledFromApi: boolean;

  // Request
  getFilters: EntryApplicationListGetFilterDto;
}

export const initialApplicationsListDetailState: ApplicationsListDetailState = {
  currentPage: 0,
  pageSize: 10,
  totalPages: 0,
  totalEntries: 0,
  sortField: { key: 'sequenceNumber', direction: 'asc' },

  rows: [],
  selectedIds: new Set<string>(),
  selectedRows: [],
  allMatchingSelected: false,

  createDone: false,
  isLoading: true,
  isSelectingAll: false,
  updateDone: false,
  updateInvalid: false,
  moveDone: false,

  errorHint: '',
  errorSummary: [],
  preserveErrorSummaryOnLoad: false,

  hasPrefilledFromApi: false,

  getFilters: {},
};

export const clearUpdateNotificationsPatch = (): Pick<
  ApplicationsListDetailState,
  | 'updateDone'
  | 'updateInvalid'
  | 'errorHint'
  | 'errorSummary'
  | 'createDone'
  | 'preserveErrorSummaryOnLoad'
  | 'moveDone'
> => ({
  updateDone: false,
  updateInvalid: false,
  errorHint: '',
  errorSummary: [],
  createDone: false,
  preserveErrorSummaryOnLoad: false,
  moveDone: false,
});
