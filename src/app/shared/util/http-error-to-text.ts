import { HttpErrorResponse } from '@angular/common/http';

import { ProblemDetails } from './types/shared-types';

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

export function getProblemText(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const e: unknown = err.error;
    if (isProblemDetails(e)) {
      const detail = typeof e.detail === 'string' ? e.detail.trim() : '';
      const title = typeof e.title === 'string' ? e.title.trim() : '';
      return detail || title || err.message || 'Request failed';
    }
    return err.message || 'Request failed';
  }

  if (isProblemDetails(err)) {
    const detail = typeof err.detail === 'string' ? err.detail.trim() : '';
    const title = typeof err.title === 'string' ? err.title.trim() : '';
    return detail || title || 'Request failed';
  }

  return 'Request failed';
}
