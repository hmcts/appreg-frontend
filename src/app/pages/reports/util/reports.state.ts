import { ErrorItem } from '@components/error-summary/error-summary.component';

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
}

export const initialReportsState: ReportsState = {
  errorSummary: [],
  reportFeedback: null,
  submitted: false,
};
