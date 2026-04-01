import { Applicant, EntryGetSummaryDto, Person } from '@openapi';
import { ApplicationRow } from '@shared-types/applications/applications.type';
import { returnOrgName } from '@util/string-helpers';

function formatFullName(person: Person): string {
  const n = person.name;

  return [n.title, n.firstForename, n.surname]
    .filter((x): x is string => !!x && x.trim().length > 0)
    .join(' ');
}

function applicantLikeDisplay(a?: Applicant): string {
  if (!a) {
    return '';
  }

  if (a.organisation) {
    return returnOrgName(a) ?? '';
  }

  if (a.person) {
    return formatFullName(a.person);
  }

  return '';
}

export function mapToRow(dto: EntryGetSummaryDto): ApplicationRow {
  return {
    id: dto.id,
    date: dto.date ?? '',
    applicant: applicantLikeDisplay(dto.applicant),
    respondent: applicantLikeDisplay(dto.respondent),
    title: dto.applicationTitle ?? '',
    fee: dto.isFeeRequired ? 'Yes' : 'No',
    resulted: dto.isResulted ? 'Yes' : 'No',
    status: dto.status ?? '',
    actions: dto.id,
  };
}
