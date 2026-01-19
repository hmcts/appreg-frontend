import { Location, isPlatformBrowser } from '@angular/common';
import { FormGroup } from '@angular/forms';

import { ApplicationListGetSummaryDto, ApplicationListStatus } from '@openapi';
import { hasStringProp, isRecord } from '@util/data-utils';
import { has } from '@util/has';
import { isNullableString } from '@util/string-helpers';
import { normaliseTime } from '@util/time-helpers';
import { ApplicationListRow } from '@util/types/application-list/types';

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

export function toRow(x: ApplicationListGetSummaryDto): ApplicationListRow {
  return {
    id: x.id,
    date: x.date,
    time: normaliseTime(x.time) ?? '',
    location: x.location,
    description: x.description,
    entries: x.entriesCount,
    status: x.status,
    deletable: x.status === ApplicationListStatus.OPEN,
    etag: null,
    rowVersion: null,
  };
}

export function hasAnyParams(form: FormGroup): boolean {
  const values = form.getRawValue() as Record<string, unknown>;
  return (
    has(values['date']) ||
    has(values['time']) ||
    has(values['description']) ||
    has(values['status']) ||
    has(values['court']) ||
    has(values['location']) ||
    has(values['cja'])
  );
}
