/* 
Helper functions for applications-list.ts - onDelete()

Input: Unknown
Process: If an error occurs, get the status code and return informative text and link to error
Output: SummaryItem
*/

import { HttpErrorResponse } from '@angular/common/http';

type SummaryItem = { text: string; href: string };
type ProblemDetails = { detail?: unknown; title?: unknown };

const TABLE: Record<number, SummaryItem[]> = {
  401: [
    {
      text: 'You are not signed in. Please sign in and try again.',
      href: '/sign-in',
    },
  ],
  403: [
    {
      text: 'You do not have permission to delete this list.',
      href: '/applications-list#sortable-table',
    },
  ],
  404: [
    {
      text: 'Application List not found. Return to the Lists view.',
      href: '/applications-list#sortable-table',
    },
  ],
  409: [
    {
      text: 'This list has entries or is in a non-deletable state.',
      href: '/applications-list#sortable-table',
    },
  ],
  412: [
    {
      text: 'The list has changed. Refresh the page and try again.',
      href: '/applications-list#sortable-table',
    },
  ],
};

const DEFAULT_SUMMARY: SummaryItem[] = [
  {
    text: 'Unable to delete list. Please try again later.',
    href: '/applications-list#sortable-table',
  },
];

export function statusSummary(status: number): SummaryItem[] {
  return TABLE[status] ?? DEFAULT_SUMMARY;
}

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
