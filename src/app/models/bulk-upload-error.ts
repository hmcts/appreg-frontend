import { CsvRow } from './bulk-upload-csv-row';

export interface BulkUploadError {
  rowNumber: number;
  row: CsvRow;
  errorMessage: string;
}
