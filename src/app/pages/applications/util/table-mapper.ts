import { EntryGetSummaryDto } from '@openapi';
import { ApplicationRow } from '@shared-types/applications/applications.type';
import { formatPartyName } from '@util/string-helpers';

export function mapToRow(dto: EntryGetSummaryDto): ApplicationRow {
  return {
    id: dto.id,
    date: dto.date ?? '',
    applicant: formatPartyName(dto.applicant) ?? '',
    respondent: formatPartyName(dto.respondent) ?? '',
    title: dto.applicationTitle ?? '',
    fee: dto.isFeeRequired ? 'Yes' : 'No',
    resulted: dto.isResulted ? 'Yes' : 'No',
    status: dto.status ?? '',
    actions: dto.id,
  };
}
