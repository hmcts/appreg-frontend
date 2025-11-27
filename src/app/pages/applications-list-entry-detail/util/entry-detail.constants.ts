import { TableColumn } from '../../../shared/components/sortable-table/sortable-table.component';

export const APPLICANT_COLUMNS: TableColumn[] = [
  { header: 'Code', field: 'code', numeric: true },
  { header: 'Name', field: 'name' },
  { header: 'Address line 1', field: 'address' },
  { header: 'Use from', field: 'useFrom' },
  { header: 'Use to', field: 'useTo' },
];

export const CODES_COLUMNS: TableColumn[] = [
  { header: 'Code', field: 'code', numeric: true },
  { header: 'Title', field: 'title' },
  { header: 'Bulk', field: 'bulk' },
  { header: 'Fee req', field: 'fee' },
  { header: 'Actions', field: 'actions', sortable: false },
];

export const FEE_STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'pending', label: 'Pending' },
];

export const RESULT_WORDING_COLUMNS = [
  { header: 'Applicant(s)', field: 'applicants' },
  { header: 'Respondent(s)', field: 'respondents' },
  { header: 'Application title(s)', field: 'titles' },
];

export const CIVIL_FEE_COLUMNS: TableColumn[] = [
  { header: 'Fee Status', field: 'status' },
  { header: 'Status Date', field: 'date' },
  { header: 'Payment Ref', field: 'paymentRef' },
];

export const APPLICANT_TYPE_OPTIONS = [
  { value: 'person', label: 'Person' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'standardApplicant', label: 'Standard Applicant' },
];

export const RESPONDENT_TYPE_OPTIONS = [
  { value: 'person', label: 'Person' },
  { value: 'organisation', label: 'Organisation' },
];

export const PERSON_TITLE_OPTIONS = [
  { value: 'mr', label: 'Mr' },
  { value: 'mrs', label: 'Mrs' },
  { value: 'miss', label: 'Miss' },
  { value: 'dr', label: 'Dr' },
  { value: 'other', label: 'Other' },
];

export const WORDING_REF_REGEX = /\{\s*TEXT\s*\|\s*Reference\s*\|\s*\d+\s*}/i;
