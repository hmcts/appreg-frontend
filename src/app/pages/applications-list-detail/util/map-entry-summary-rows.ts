import { selectedRow } from './applications-list-detail.types';

import { EntryGetSummaryDto, ResultCodeGetSummaryDto } from '@openapi';
import { formatPersonName, returnOrgName } from '@util/string-helpers';

export function mapEntrySummaryRows(
  entries: EntryGetSummaryDto[],
): selectedRow[] {
  return entries.map((entry) => ({
    id: entry.id,
    sequenceNumber: entry.sequenceNumber!,
    accountNumber: entry.accountNumber ?? '',
    applicant: entry.applicant?.person
      ? formatPersonName(entry.applicant)
      : returnOrgName(entry.applicant),
    respondent: entry.respondent?.person
      ? formatPersonName(entry.respondent)
      : returnOrgName(entry.respondent),
    postCode:
      entry.respondent?.person?.contactDetails?.postcode ??
      entry.respondent?.organisation?.contactDetails?.postcode ??
      '',
    title: `${entry.applicationTitle}`.trim(),
    feeReq: entry.isFeeRequired ? 'Yes' : 'No',
    resulted: joinResultCodes(getResultCodes(entry)),
  }));
}

function getResultCodes(entry: EntryGetSummaryDto): string[] {
  const resulted = (
    entry as EntryGetSummaryDto & {
      resulted?: ResultCodeGetSummaryDto | ResultCodeGetSummaryDto[];
    }
  ).resulted;

  if (Array.isArray(resulted)) {
    return resulted
      .map((resultCode) =>
        typeof resultCode === 'string' ? resultCode : resultCode.resultCode,
      )
      .filter(Boolean);
  }

  return [];
}

function joinResultCodes(resultCodes: string[]): string {
  return resultCodes
    .map((resultCode) => resultCode.trim())
    .filter(Boolean)
    .join(', ');
}
