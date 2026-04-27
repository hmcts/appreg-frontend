import { TableColumn } from '@components/sortable-table/sortable-table.component';
import { StandardApplicantGetSummaryDto } from '@openapi';
import { formatDate } from '@util/standard-applicant-helpers';
import { formatPartyName } from '@util/string-helpers';
import { StandardApplicantRow } from '@util/types/applications-list-entry/types';

export const standardAppColumns: TableColumn[] = [
  { header: 'Code', field: 'code', sortable: true },
  { header: 'Name', field: 'name', sortable: true },
  { header: 'Address', field: 'address', sortable: true },
  { header: 'Use from', field: 'useFrom', sortable: true },
  { header: 'Use to', field: 'useTo', sortable: true },
];

export function mapSaToRow(
  sa: StandardApplicantGetSummaryDto,
): StandardApplicantRow {
  const code = sa.code ?? '';
  const applicant = sa.applicant;
  const person = sa.applicant?.person;
  const organisation = sa.applicant?.organisation;

  const name = formatPartyName(applicant) ?? '';

  const address =
    organisation?.contactDetails?.addressLine1 ??
    person?.contactDetails?.addressLine1 ??
    '';

  return {
    code,
    name,
    address,
    useFrom: formatDate(sa.startDate),
    useTo: formatDate(sa.endDate),
  };
}
