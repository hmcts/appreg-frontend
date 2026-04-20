import { Location, isPlatformBrowser } from '@angular/common';
import { FormGroup } from '@angular/forms';

import {
  ApplicationCodeGetDetailDto,
  ApplicationListGetDetailDto,
  ApplicationListGetSummaryDto,
  ApplicationListStatus,
} from '@openapi';
import { CivilFeeMeta } from '@shared-types/civil-fee/civil-fee';
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

export type ApplicationEntriesBaseContext = {
  id: string;
} & ApplicantContext;

export type ApplicationEntriesResultContext = ApplicationEntriesBaseContext & {
  sequenceNumber: string;
};

export type ApplicationEntriesMoveContext = ApplicationEntriesBaseContext & {
  feeRequired: 'Yes' | 'No';
  resulted: string | null;
};

export type PaymentRefReturn = {
  updatedRowId: string;
  newPaymentReference: string;
};

export type EntryDetailSnapshot = {
  form?: unknown;
  personForm?: unknown;
  organisationForm?: unknown;
  respondentPersonForm?: unknown;
  respondentOrganisationForm?: unknown;
  appCodeDetail?: ApplicationCodeGetDetailDto | null;
  feeMeta?: CivilFeeMeta | null;
  isFeeRequired?: boolean;
  bulkApplicationsAllowed?: boolean;
  wordingAppliedBannerVisible?: boolean;
};

export type EntryDetailNavState = {
  appListId?: string;
  resultApplicantContext?: ApplicantContext;
  paymentRefReturn?: PaymentRefReturn;
  entryDetailSnapshot?: EntryDetailSnapshot;
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

function getRowLocation(
  x: ApplicationListGetSummaryDto | ApplicationListGetDetailDto,
): string {
  if ('location' in x) {
    return x.location;
  }

  return x.courtName ?? x.otherLocationDescription ?? '';
}

export function toRow(
  x: ApplicationListGetSummaryDto | ApplicationListGetDetailDto,
): ApplicationListRow {
  return {
    id: x.id,
    date: x.date,
    time: normaliseTime(x.time) ?? '',
    location: getRowLocation(x),
    description: x.description,
    entries: x.entriesCount ?? 0,
    status: x.status,
    deletable: x.status === ApplicationListStatus.OPEN,
    etag: null,
    rowVersion: 'version' in x ? x.version.toString() : null,
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
