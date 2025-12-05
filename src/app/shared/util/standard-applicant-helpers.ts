/* 
Helper functions for Standard Applicants
*/

import { StandardApplicantGetSummaryDto } from '../../../generated/openapi';
import { StandardApplicantRow } from '../util/types/applications-list-entry/types';

function formatDate(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-GB') : '—';
}

export function buildStandardApplicantRows(
  saItems: StandardApplicantGetSummaryDto[],
): StandardApplicantRow[] {
  return saItems.map((sa) => {
    const applicant = sa.applicant;
    const person = applicant?.person;
    const organisation = applicant?.organisation;

    const personName = person?.name
      ? [
          person.name.title,
          person.name.firstForename,
          person.name.secondForename,
          person.name.thirdForename,
          person.name.surname,
        ]
          .filter(Boolean)
          .join(' ')
      : '';

    const name = organisation?.name ?? personName ?? '';

    const addressLine1 =
      person?.contactDetails?.addressLine1 ??
      organisation?.contactDetails?.addressLine1 ??
      '';

    return {
      code: sa.code ?? '',
      name,
      address: addressLine1,
      useFrom: formatDate(sa.startDate),
      useTo: formatDate(sa.endDate ?? null),
    };
  });
}
