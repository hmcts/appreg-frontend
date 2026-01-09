import { Location, isPlatformBrowser } from '@angular/common';

import { hasStringProp, isRecord } from '@util/data-utils';
import { isNullableString } from '@util/string-helpers';

export type ApplicantContext = {
  applicant: string;
  respondent: string;
  title: string;
};

export type EntryDetailNavState = {
  appListId?: string;
  resultApplicantContext?: ApplicantContext;
};

function isApplicantContext(x: unknown): boolean {
  if (!isRecord(x)) {
    return false;
  }
  return (
    typeof x['applicant'] === 'string' &&
    typeof x['respondent'] === 'string' &&
    typeof x['title'] === 'string'
  );
}

function isRow(x: unknown): boolean {
  if (!isRecord(x)) {
    return false;
  }
  if (!hasStringProp(x, 'id')) {
    return false;
  }

  // resultApplicantContext optional
  const ctx = x['resultApplicantContext'];
  if (ctx === undefined || ctx === null) {
    return true;
  }

  return isApplicantContext(ctx);
}

export function isNavState(x: unknown): x is EntryDetailNavState {
  if (!isRecord(x)) {
    return false;
  }

  // appListId optional
  if (!isNullableString(x['appListId'])) {
    return false;
  }

  // row optional
  const row = x['row'];
  if (row === undefined || row === null) {
    return true;
  }

  return isRow(row);
}

export function readNavState(
  location: Location,
  platformId: object,
): EntryDetailNavState | null {
  if (!isPlatformBrowser(platformId)) {
    return null;
  }

  const raw: unknown = location.getState();
  return isNavState(raw) ? raw : null;
}
