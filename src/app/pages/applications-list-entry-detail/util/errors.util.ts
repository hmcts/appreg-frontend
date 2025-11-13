export type ErrorSummaryItem = { text: string; href?: string };

export function mapHttpErrorToSummary(err: unknown): {
  hasFatalError: boolean;
  errorHint: string;
  errorSummary: ErrorSummaryItem[];
} {
  let status = 0;
  let statusText: string | undefined;
  let detail: string | undefined;

  // Narrow and extract fields safely
  if (typeof err === 'object' && err !== null) {
    const r = err as Record<string, unknown>;

    const maybeStatus = r['status'];
    if (typeof maybeStatus === 'number') {
      status = maybeStatus;
    }

    const maybeStatusText = r['statusText'];
    if (typeof maybeStatusText === 'string') {
      statusText = maybeStatusText;
    }

    const maybeError = r['error'];
    if (typeof maybeError === 'object' && maybeError !== null) {
      const e = maybeError as Record<string, unknown>;
      if (typeof e['title'] === 'string') {
        if (typeof e['detail'] === 'string') {
          detail = e['detail'];
        }
      }
    }
  }

  const items = (...lines: (string | undefined)[]): ErrorSummaryItem[] =>
    lines
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((text) => ({ text }));

  // Default values
  let errorHint = 'There is a problem';
  let errorSummary: ErrorSummaryItem[] = [];

  switch (status) {
    case 400:
      // Always show friendly hint; keep backend text in summary only
      errorHint = 'Bad request';
      errorSummary = items(detail || 'We could not process your request.');
      break;

    case 401:
      // Force consistent sign-in wording regardless of backend title
      errorHint = 'You need to sign in';
      errorSummary = items(
        detail || 'Your session may have expired. Sign in and try again.',
      );
      break;

    case 403:
      errorHint = 'You do not have permission';
      errorSummary = items(
        detail || 'Ask an administrator to grant you access.',
      );
      break;

    case 404:
      errorHint = 'Not found';
      errorSummary = items(
        detail || 'We could not find what you were looking for.',
      );
      break;

    default:
      if (status === 0 || status >= 500) {
        errorHint = 'A server error occurred';
        errorSummary = items(
          detail ||
            'Something went wrong on our side. Try again in a few moments.',
        );
      } else {
        errorHint = 'There is a problem';
        errorSummary = items(
          detail || statusText || 'An unexpected error occurred. Try again.',
        );
      }
      break;
  }

  return { hasFatalError: true, errorHint, errorSummary };
}
