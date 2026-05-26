import { ErrorItem } from '@components/error-summary/error-summary.component';
import { JobStatus2 } from '@openapi';

export type ReportFeedback =
  | {
      kind: 'progress';
    }
  | {
      kind: 'success';
      heading: string;
      body: string;
    }
  | {
      kind: 'error';
      title: string;
      items: ErrorItem[];
    };

export interface ReportsState {
  errorSummary: ErrorItem[];
  reportFeedback: ReportFeedback | null;
  submitted: boolean;
  reportJobId: string | null;
  reportJobStatus: JobStatus2 | null;
  isReportGenerating: boolean;
}

export const initialReportsState: ReportsState = {
  errorSummary: [],
  reportFeedback: null,
  submitted: false,
  reportJobId: null,
  reportJobStatus: null,
  isReportGenerating: false,
};
