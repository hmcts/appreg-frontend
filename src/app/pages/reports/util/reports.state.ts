import { ErrorItem } from '@components/error-summary/error-summary.component';

export interface ReportsState {
  errorSummary: ErrorItem[];
  submitted: boolean;
}

export const initialReportsState: ReportsState = {
  errorSummary: [],
  submitted: false,
};
