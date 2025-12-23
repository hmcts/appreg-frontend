import { EntryGetFilterDto } from '@openapi';
import { ApplicationsSearchFormValue } from '@shared-types/applications/applications-form';
import { toStatus } from '@util/application-status-helpers';
import { has } from '@util/has';

export function hasAnyApplicationsEntrySearchParams(
  v: ApplicationsSearchFormValue,
): boolean {
  return (
    has(v.date) ||
    has(v.applicantOrg) ||
    has(v.respondentOrg) ||
    has(v.applicantSurname) ||
    has(v.respondentSurname) ||
    has(v.location) ||
    has(v.standardApplicantCode) ||
    has(v.respondentPostcode) ||
    has(v.accountReference) ||
    has(v.court) ||
    has(v.cja) ||
    has(v.status)
  );
}

export function loadApplicationsEntrySearchQuery(
  v: ApplicationsSearchFormValue,
): EntryGetFilterDto {
  const filter: EntryGetFilterDto = {};

  const trimmed = (s: string | null | undefined): string | undefined => {
    const t = s?.trim();
    return t || undefined;
  };

  const date = trimmed(v.date);
  if (date) {
    filter.date = date;
  }

  const court = trimmed(v.court);
  if (court) {
    filter.courtCode = court;
  }

  const location = trimmed(v.location);
  if (location) {
    filter.otherLocationDescription = location;
  }

  const cja = trimmed(v.cja);
  if (cja) {
    filter.cjaCode = cja;
  }

  const applicantOrg = trimmed(v.applicantOrg);
  if (applicantOrg) {
    filter.applicantOrganisation = applicantOrg;
  }

  const applicantSurname = trimmed(v.applicantSurname);
  if (applicantSurname) {
    filter.applicantSurname = applicantSurname;
  }

  const respondentOrg = trimmed(v.respondentOrg);
  if (respondentOrg) {
    filter.respondentOrganisation = respondentOrg;
  }

  const respondentSurname = trimmed(v.respondentSurname);
  if (respondentSurname) {
    filter.respondentSurname = respondentSurname;
  }

  const respondentPostcode = trimmed(v.respondentPostcode);
  if (respondentPostcode) {
    filter.respondentPostcode = respondentPostcode;
  }

  const standardApplicantCode = trimmed(v.standardApplicantCode);
  if (standardApplicantCode) {
    filter.standardApplicantCode = standardApplicantCode;
  }

  const accountReference = trimmed(v.accountReference);
  if (accountReference) {
    filter.accountReference = accountReference;
  }

  if (v.status) {
    filter.status = toStatus(v.status);
  }

  return filter;
}
