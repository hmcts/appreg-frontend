import { BulkUploadError } from './bulk-upload-error';

export interface BulkUploadResponse {
  successfulCount: number;
  errors: BulkUploadError[];
}
