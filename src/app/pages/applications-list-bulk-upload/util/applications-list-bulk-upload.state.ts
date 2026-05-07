import { ErrorItem } from '@components/error-summary/error-summary.component';
import { JobAcknowledgement } from '@openapi';

export interface ApplicationsListBulkUploadState {
  isValidCSV: boolean | null;
  errorSummary: ErrorItem[];
  file: File | null;
  isUploadInProgress: boolean;
  fileUploadStatus: 'error' | null;
  jobAcknowledgement: JobAcknowledgement | null;
  listId: string;
}

export const InitialBulkUploadState: ApplicationsListBulkUploadState = {
  isValidCSV: null,
  errorSummary: [],
  isUploadInProgress: false,
  fileUploadStatus: null,
  listId: '',
  file: null,
  jobAcknowledgement: null,
};

export const clearFlags = (): Pick<
  ApplicationsListBulkUploadState,
  'isValidCSV' | 'errorSummary' | 'isUploadInProgress' | 'fileUploadStatus'
> => ({
  isValidCSV: null,
  errorSummary: [],
  isUploadInProgress: false,
  fileUploadStatus: null,
});
