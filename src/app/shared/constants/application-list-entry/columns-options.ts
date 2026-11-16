/**
 * Options and columns shared by applications-list-entry-details and
 * applications-list-entry-create components
 */

import { TableColumn } from '@components/sortable-table/sortable-table.component';

// Options
export const PERSON_TITLE_OPTIONS = [
  { value: 'mr', label: 'Mr' },
  { value: 'mrs', label: 'Mrs' },
  { value: 'miss', label: 'Miss' },
  { value: 'dr', label: 'Dr' },
  { value: 'other', label: 'Other' },
];

export const RESPONDENT_TYPE_OPTIONS = [
  { value: 'person', label: 'Person' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'bulk', label: 'Bulk Application' },
] as const;

export const APPLICANT_TYPE_OPTIONS = [
  { value: 'person', label: 'Person' },
  { value: 'org', label: 'Organisation' },
  { value: 'standard', label: 'Standard Applicant' },
];

// Used by applications-list-detail-bulk-update-fees as well
export const FEE_STATUS_OPTIONS = [
  { value: 'PAID', label: 'Paid' },
  { value: 'UNDERTAKEN', label: 'Undertaken' },
  { value: 'DUE', label: 'Due' },
  { value: 'REMITTED', label: 'Remitted' },
];

// Columns
export const CIVIL_FEE_COLUMNS: TableColumn[] = [
  { header: 'Fee Status', field: 'paymentStatus' },
  { header: 'Status Date', field: 'statusDateRaw' },
  { header: 'Payment Ref', field: 'paymentReference' },
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

export const APPLICANT_COLUMNS: TableColumn[] = [
  { header: 'Code', field: 'code', numeric: true },
  { header: 'Name', field: 'name' },
  { header: 'Address line 1', field: 'address' },
  { header: 'Use from', field: 'useFrom' },
  { header: 'Use to', field: 'useTo' },
];
