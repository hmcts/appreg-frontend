import { ErrorItem } from '@components/error-summary/error-summary.component';
import { Row } from '@core-types/table/row.types';
import { ApplicationListGetDetailDto } from '@openapi';

export type EntrySummary = NonNullable<
  ApplicationListGetDetailDto['entriesSummary']
>[number];

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
  createDone: boolean;
  isLoading: boolean;
  updateDone: boolean;
  updateInvalid: boolean;
  moveDone: boolean;

  // errors
  errorHint: string;
  errorSummary: ErrorItem[];
  preserveErrorSummaryOnLoad: boolean;

  // internal
  hasPrefilledFromApi: boolean;
}

export const initialApplicationsListDetailState: ApplicationsListDetailState = {
  currentPage: 0,
  pageSize: 10,
  totalPages: 0,

  rows: [],
  selectedIds: new Set<string>(),
  selectedRows: [],

  createDone: false,
  isLoading: true,
  updateDone: false,
  updateInvalid: false,
  moveDone: false,

  errorHint: '',
  errorSummary: [],
  preserveErrorSummaryOnLoad: false,

  hasPrefilledFromApi: false,
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
  moveDone: false
});
