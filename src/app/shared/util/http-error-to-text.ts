import { HttpErrorResponse } from '@angular/common/http';

import { ProblemDetails } from '@core-types/error/error.types';

type ErrorResponseBodyShape = 'detail' | 'title';

export function getHttpStatus(err: unknown): number {
  if (err instanceof HttpErrorResponse) {
    return err.status;
  }
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const s = (err as Record<string, unknown>)['status'];
    if (typeof s === 'number') {
      return s;
    }
  }
  return 0;
}

function isProblemDetails(x: unknown): x is ProblemDetails {
  return typeof x === 'object' && x !== null && ('detail' in x || 'title' in x);
}

// True when an HTTP error body carries a non-empty problem detail or title
export function hasProblemText(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse) || !isProblemDetails(err.error)) {
    return false;
  }
  const { detail, title } = err.error;
  return (
    (typeof detail === 'string' && detail.trim() !== '') ||
    (typeof title === 'string' && title.trim() !== '')
  );
}

export function getProblemText(
  err: unknown,
  textSelection: ErrorResponseBodyShape = 'detail',
): string {
  if (err instanceof HttpErrorResponse) {
    const e: unknown = err.error;
    if (isProblemDetails(e)) {
      const detail = typeof e.detail === 'string' ? e.detail.trim() : '';
      const title = typeof e.title === 'string' ? e.title.trim() : '';

      // Customisable priority
      if (textSelection === 'detail') {
        return detail || title || err.message || 'Request failed';
      } else if (textSelection === 'title') {
        return title || detail || err.message || 'Request failed';
      }
    }
    return err.message || 'Request failed';
  }

  if (isProblemDetails(err)) {
    const detail = typeof err.detail === 'string' ? err.detail.trim() : '';
    const title = typeof err.title === 'string' ? err.title.trim() : '';

    if (textSelection === 'detail') {
      return detail || title || 'Request failed';
    } else if (textSelection === 'title') {
      return title || detail || 'Request failed';
    }
  }

  return 'Request failed';
}
