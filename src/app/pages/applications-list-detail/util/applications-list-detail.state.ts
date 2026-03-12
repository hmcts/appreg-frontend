import { ErrorItem } from '@components/error-summary/error-summary.component';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationCodeGetDetailDto,
  EntryGetDetailDto,
  EntryGetSummaryDto,
} from '@openapi';
import { CloseValidationLoadStatus } from '@shared-types/applications-list-close/applications-list-close.type';

export interface ApplicationsListDetailState {
  // paging
  currentPage: number;
  pageSize: number;
  totalPages: number;

  // rows + selection
  rows: Row[];
  selectedIds: Set<string>;
  selectedRows: Row[];

  // Entry details
  entriesDetails: EntryGetDetailDto[];
  entryCodeDetails: Record<string, ApplicationCodeGetDetailDto>;
  allEntryIds: string[];
  allEntriesSummary: EntryGetSummaryDto[];
  closeSummaryStatus: CloseValidationLoadStatus;
  closeEntryDetailsStatus: CloseValidationLoadStatus;
  closeCodeDetailsStatus: CloseValidationLoadStatus;

  // flags
  createDone: boolean;
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
  currentPage: 0,
  pageSize: 10,
  totalPages: 0,

  rows: [],
  selectedIds: new Set<string>(),
  selectedRows: [],

  entriesDetails: [],
  entryCodeDetails: {},
  allEntryIds: [],
  allEntriesSummary: [],
  closeSummaryStatus: 'idle',
  closeEntryDetailsStatus: 'idle',
  closeCodeDetailsStatus: 'idle',

  createDone: false,
  isLoading: true,
  updateDone: false,
  updateInvalid: false,

  errorHint: '',
  errorSummary: [],

  hasPrefilledFromApi: false,
};

export const clearUpdateNotificationsPatch = (): Pick<
  ApplicationsListDetailState,
  'updateDone' | 'updateInvalid' | 'errorHint' | 'errorSummary' | 'createDone'
> => ({
  updateDone: false,
  updateInvalid: false,
  errorHint: '',
  errorSummary: [],
  createDone: false,
});
