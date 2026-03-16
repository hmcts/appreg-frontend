import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ApplicationCodeGetDetailDto } from '@openapi';

export interface ApplicationsListEntryDetailState {
  appListId: string;
  AppCodeDetail: ApplicationCodeGetDetailDto | null;
  formSubmitted: boolean;
  errorFound: boolean;
  summaryErrors: ErrorItem[];
  bulkApplicationsAllowed: boolean;
  isFeeRequired: boolean;
}

export const initialApplicationsListEntryDetailState: ApplicationsListEntryDetailState =
  {
    appListId: '',
    AppCodeDetail: null,
    formSubmitted: false,
    errorFound: false,
    summaryErrors: [],
    bulkApplicationsAllowed: false,
    isFeeRequired: false,
  };
