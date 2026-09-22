import { TableColumn } from '@components/sortable-table/sortable-table.component';
import { Applicant, StandardApplicantGetSummaryDto } from '@openapi';
import { formatDate } from '@util/standard-applicant-helpers';
import { StandardApplicantRow } from '@util/types/applications-list-entry/types';

export const standardAppColumns: TableColumn[] = [
  { header: 'Code', field: 'code', sortable: true },
  { header: 'Name', field: 'name', sortable: true },
  { header: 'Use from', field: 'useFrom', sortable: true },
  { header: 'Use to', field: 'useTo', sortable: true },
];

export function mapSaToRow(
  sa: StandardApplicantGetSummaryDto & {
    name?: string | null;
    applicant?: Applicant;
  },
): StandardApplicantRow {
  const code = sa.code ?? '';
  // Optional legacy applicant supports FE-first deployment; remove
  // after all environments use the flat-name contract. Never use personal names.
  const name = sa.name ?? sa.applicant?.organisation?.name ?? '';

  return {
    code,
    name,
    useFrom: formatDate(sa.startDate),
    useTo: formatDate(sa.endDate),
  };
}
