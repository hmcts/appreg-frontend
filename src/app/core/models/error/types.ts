export interface HttpErrorSummary {
  hasFatalError: boolean;
  errorHint: string;
  errorSummary: ErrorSummaryItem[];
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[] | string>;
}

export type ErrorSummaryItem = { text: string; href?: string };
