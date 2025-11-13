export type ErrorSummaryItem = { text: string; href?: string };

export function mapHttpErrorToSummary(err: unknown): {
  hasFatalError: boolean;
  errorHint: string;
  errorSummary: ErrorSummaryItem[];
} {
  let status = 0;
  let statusText: string | undefined;
  let title: string | undefined;
  let detail: string | undefined;

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
        title = e['title'];
      }
      if (typeof e['detail'] === 'string') {
        detail = e['detail'];
      }
    }
  }

  const items = (...lines: (string | undefined)[]) =>
    lines
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((text) => ({ text }));

  let errorHint = 'There is a problem';
  let errorSummary: ErrorSummaryItem[] = [];

  switch (status) {
    case 400:
      errorHint = title || 'Bad request';
      errorSummary = items(detail || 'We could not process your request.');
      break;
    case 401:
      errorHint = title || 'You need to sign in';
      errorSummary = items(
        detail || 'Your session may have expired. Sign in and try again.',
      );
      break;
    case 403:
      errorHint = title || 'You do not have permission';
      errorSummary = items(
        detail || 'Ask an administrator to grant you access.',
      );
      break;
    case 404:
      errorHint = title || 'Not found';
      errorSummary = items(
        detail || 'We could not find what you were looking for.',
      );
      break;
    default:
      if (status === 0 || status >= 500) {
        errorHint = title || 'A server error occurred';
        errorSummary = items(
          detail || 'Something went wrong on our side. Try again in a few moments.',
        );
      } else {
        errorHint = title || 'There is a problem';
        errorSummary = items(
          detail || statusText || 'An unexpected error occurred. Try again.',
        );
      }
  }

  return { hasFatalError: true, errorHint, errorSummary };
}
