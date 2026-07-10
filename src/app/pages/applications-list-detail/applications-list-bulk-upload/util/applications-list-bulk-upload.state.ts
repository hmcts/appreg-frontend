import { ErrorItem } from '@components/error-summary/error-summary.component';
import { JobAcknowledgement } from '@openapi';

export interface BulkUploadFeedback {
  kind: 'progress' | 'success' | 'warning' | 'error';
  heading: string;
  body: string;
  title?: string;
}

export interface ApplicationsListBulkUploadState {
  isValidCSV: boolean | null;
  errorSummary: ErrorItem[];
  file: File | null;
  isUploadInProgress: boolean;
  fileUploadStatus: 'error' | null;
  jobAcknowledgement: JobAcknowledgement | null;
  listId: string;
  uploadSuccessful: boolean;
  bulkUploadFeedback: BulkUploadFeedback | null | void;
}

export const InitialBulkUploadState: ApplicationsListBulkUploadState = {
  isValidCSV: null,
  errorSummary: [],
  isUploadInProgress: false,
  fileUploadStatus: null,
  listId: '',
  file: null,
  jobAcknowledgement: null,
  uploadSuccessful: false,
  bulkUploadFeedback: null,
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
