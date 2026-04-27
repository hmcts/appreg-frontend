import { TableColumn } from '@components/sortable-table/sortable-table.component';

export const APPLICANT_COLUMNS: TableColumn[] = [
  { header: 'Code', field: 'code', numeric: true },
  { header: 'Name', field: 'name' },
  { header: 'Address line 1', field: 'address' },
  { header: 'Use from', field: 'useFrom' },
  { header: 'Use to', field: 'useTo' },
];

export const CODES_COLUMNS: TableColumn[] = [
  { header: 'Code', field: 'code', minWidth: '8rem', wrap: false },
  {
    header: 'Title',
    field: 'title',
    minWidth: '18rem',
    maxWidth: '28rem',
    wrap: true,
  },
  { header: 'Bulk', field: 'bulk', minWidth: '7rem', wrap: false },
  { header: 'Fee required', field: 'isFeeDue', minWidth: '7rem', wrap: false },
  { header: 'Actions', field: 'actions', minWidth: '8rem', wrap: false },
];

export const FEE_STATUS_OPTIONS = [
  { value: 'PAID', label: 'Paid' },
  { value: 'UNDERTAKEN', label: 'Undertaken' },
  { value: 'DUE', label: 'Due' },
  { value: 'REMITTED', label: 'Remitted' },
];

export const APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS = [
  { header: 'Sequence number', field: 'sequenceNumber' },
  { header: 'Applicant(s)', field: 'applicant' },
  { header: 'Respondent(s)', field: 'respondent' },
  { header: 'Application Title(s)', field: 'title' },
];

export const APPLICATION_ENTRIES_MOVE_COLUMNS = [
  { header: 'Applicant(s)', field: 'applicant' },
  { header: 'Respondent(s)', field: 'respondent' },
  { header: 'Application title', field: 'title' },
  { header: 'Fee required', field: 'feeRequired' },
  { header: 'Resulted', field: 'resulted' },
];

export const RESULT_WORDING_COLUMNS = [
  { header: 'Applicant(s)', field: 'applicant' },
  { header: 'Respondent(s)', field: 'respondent' },
  {
    header: 'Application title(s)',
    field: 'title',
    maxWidth: '25rem',
    wrap: true,
  },
];

export const EXISTING_RESULTS_WORDING_COLUMNS = [
  { header: 'Result', field: 'display' },
  { header: 'Wording', field: 'wording' },
  { header: 'Actions', field: 'actions', sortable: false },
];

export const CIVIL_FEE_COLUMNS: TableColumn[] = [
  { header: 'Fee Status', field: 'paymentStatus' },
  { header: 'Status Date', field: 'statusDateRaw' },
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
