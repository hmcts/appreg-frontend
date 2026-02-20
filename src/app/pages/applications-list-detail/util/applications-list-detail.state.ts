import { ErrorItem } from '@components/error-summary/error-summary.component';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationCodeGetDetailDto,
  ApplicationListGetDetailDto,
  EntryGetDetailDto,
} from '@openapi';

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

  // Entry details
  entriesDetails: EntryGetDetailDto[];
  entryCodeDetails: Record<string, ApplicationCodeGetDetailDto>;
  allEntryIds: string[];
  allEntriesSummary: EntrySummary[];

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

  entriesDetails: [],
  entryCodeDetails: {},
  allEntryIds: [],
  allEntriesSummary: [],

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
