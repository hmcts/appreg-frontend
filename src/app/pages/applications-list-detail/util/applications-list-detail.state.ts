import { ErrorItem } from '@components/error-summary/error-summary.component';
import { Row } from '@core-types/table/row.types';
import {
  BulkActionPreviewResponseDto,
  EntryApplicationListGetFilterDto,
} from '@openapi';

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
  updateOfficialsDone?: boolean;
  updateInvalid: boolean;
  moveDone: boolean;
  updateFeesDone: boolean;
  bulkUploadDone: boolean;

  bulkUploadBannerText: string;

  // errors
  errorHint: string;
  errorSummary: ErrorItem[];
  preserveErrorSummaryOnLoad: boolean;

  // internal
  hasPrefilledFromApi: boolean;

  // Request
  getFilters: EntryApplicationListGetFilterDto;

  pdfLoading: boolean;

  previewRows: BulkActionPreviewResponseDto | null;
  isFilterSelection: boolean;
  excludedEntryIds: Set<string>;
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
  updateOfficialsDone: false,
  updateInvalid: false,
  moveDone: false,
  updateFeesDone: false,
  bulkUploadDone: false,

  bulkUploadBannerText: '',

  errorHint: '',
  errorSummary: [],
  preserveErrorSummaryOnLoad: false,

  hasPrefilledFromApi: false,

  getFilters: {},

  pdfLoading: false,

  previewRows: null,
  isFilterSelection: false,
  excludedEntryIds: new Set<string>(),
};

export const clearUpdateNotificationsPatch = (): Pick<
  ApplicationsListDetailState,
  | 'updateDone'
  | 'updateOfficialsDone'
  | 'updateInvalid'
  | 'errorHint'
  | 'errorSummary'
  | 'createDone'
  | 'preserveErrorSummaryOnLoad'
  | 'moveDone'
  | 'updateFeesDone'
  | 'bulkUploadDone'
> => ({
  updateDone: false,
  updateOfficialsDone: false,
  updateInvalid: false,
  errorHint: '',
  errorSummary: [],
  createDone: false,
  preserveErrorSummaryOnLoad: false,
  moveDone: false,
  updateFeesDone: false,
  bulkUploadDone: false,
});
