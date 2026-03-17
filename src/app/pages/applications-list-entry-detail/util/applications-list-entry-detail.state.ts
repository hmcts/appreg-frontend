import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SuccessBanner } from '@core-types/banner/banner.types';
import { ApplicationCodeGetDetailDto } from '@openapi';

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
  };
