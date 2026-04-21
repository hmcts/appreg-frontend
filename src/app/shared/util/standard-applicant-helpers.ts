/*
Helper functions for Standard Applicants
*/

import { formatDate as ngFormatDate } from '@angular/common';

export function formatDate(iso?: string | null): string {
  if (!iso) {
    return '—';
  }

  try {
    return ngFormatDate(iso, 'mediumDate', 'en-GB');
  } catch {
    return '—';
  }
}
