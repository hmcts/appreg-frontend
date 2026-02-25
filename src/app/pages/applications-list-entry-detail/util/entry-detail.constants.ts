import { TableColumn } from '@components/sortable-table/sortable-table.component';

export const APPLICANT_COLUMNS: TableColumn[] = [
  { header: 'Code', field: 'code', numeric: true },
  { header: 'Name', field: 'name' },
  { header: 'Address line 1', field: 'address' },
  { header: 'Use from', field: 'useFrom' },
  { header: 'Use to', field: 'useTo' },
];

export const CODES_COLUMNS: TableColumn[] = [
  { header: 'Code', field: 'code' },
  { header: 'Title', field: 'title' },
  { header: 'Bulk', field: 'bulk' },
  { header: 'Fee req', field: 'fee' },
  { header: 'Actions', field: 'actions', sortable: false },
];

export const FEE_STATUS_OPTIONS = [
  { value: 'PAID', label: 'Paid' },
  { value: 'UNDERTAKEN', label: 'Undertaken' },
  { value: 'DUE', label: 'Due' },
  { value: 'REMITTED', label: 'Remitted' },
];

export const RESULT_WORDING_COLUMNS = [
  { header: 'Applicant(s)', field: 'applicant' },
  { header: 'Respondent(s)', field: 'respondent' },
  { header: 'Application title(s)', field: 'title' },
];

export const EXISTING_RESULTS_WORDING_COLUMNS = [
  { header: 'Result', field: 'display' },
  { header: 'Wording', field: 'wording' },
  { header: 'Actions', field: 'actions', sortable: false },
];

export const CIVIL_FEE_COLUMNS: TableColumn[] = [
  { header: 'Fee Status', field: 'paymentStatus' },
  { header: 'Status Date', field: 'statusDate' },
  { header: 'Payment Ref', field: 'paymentReference' },
];

export const APPLICANT_TYPE_OPTIONS = [
  { value: 'person', label: 'Person' },
  { value: 'org', label: 'Organisation' },
  { value: 'standard', label: 'Standard Applicant' },
];

export const RESPONDENT_TYPE_OPTIONS = [
  { value: 'person', label: 'Person' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'bulk', label: 'Bulk Application' },
] as const;

export const PERSON_TITLE_OPTIONS = [
  { value: 'mr', label: 'Mr' },
  { value: 'mrs', label: 'Mrs' },
  { value: 'miss', label: 'Miss' },
  { value: 'dr', label: 'Dr' },
  { value: 'other', label: 'Other' },
];

export const WORDING_REF_REGEX = /\{\s*TEXT\s*\|\s*Reference\s*\|\s*\d+\s*}/i;
