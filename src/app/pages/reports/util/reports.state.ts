import { ErrorItem } from '@components/error-summary/error-summary.component';
import { JobStatus2 } from '@openapi';

export interface ReportsState {
  errorSummary: ErrorItem[];
  submitted: boolean;
  reportJobId: string | null;
  reportJobStatus: JobStatus2 | null;
  isReportGenerating: boolean;
}

export const initialReportsState: ReportsState = {
  errorSummary: [],
  submitted: false,
  reportJobId: null,
  reportJobStatus: null,
  isReportGenerating: false,
};
