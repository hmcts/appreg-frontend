import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SuccessBanner } from '@core-types/banner/banner.types';
import { ApplicationCodeGetDetailDto } from '@openapi';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';

export interface ApplicationsListEntryDetailState {
  appListId: string;
  appCodeDetail: ApplicationCodeGetDetailDto | null;
  formSubmitted: boolean;
  formReady: boolean;
  errorFound: boolean;
  summaryErrors: ErrorItem[];
  bulkApplicationsAllowed: boolean;
  isFeeRequired: boolean;
  successBanner: SuccessBanner | null;
  errorHint: string | null;
  pendingResults: boolean;
  resultsPayload: {
    listId: string;
    entryId: string;
    payload: ResultSectionSubmitPayload;
  };
}

export const initialApplicationsListEntryDetailState: ApplicationsListEntryDetailState =
  {
    appListId: '',
    appCodeDetail: null,
    formSubmitted: false,
    formReady: false,
    errorFound: false,
    summaryErrors: [],
    bulkApplicationsAllowed: false,
    isFeeRequired: false,
    successBanner: null,
    errorHint: 'There is a problem',
    pendingResults: false,
    resultsPayload: {
      listId: '',
      entryId: '',
      payload: { pendingToCreate: [], existingToUpdate: [] },
    },
  };
