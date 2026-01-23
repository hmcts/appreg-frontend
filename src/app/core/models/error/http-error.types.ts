export type ErrorDisplay = 'COMPONENT' | 'PAGE';

export interface ErrorMessage {
  status: number;
  statusText?: string;
  detail?: ProblemDetails;
  message?: string[];
  endpoint?: string;
  route?: string;
  display?: ErrorDisplay;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}
