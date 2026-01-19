import { TableColumn } from '@components/sortable-table/sortable-table.component';

export const APPLICATIONS_LIST_COLUMNS: TableColumn[] = [
  { header: 'Date', field: 'date' },
  { header: 'Time', field: 'time' },
  {
    header: 'Location',
    field: 'location',
    sortValue: (row) => buildTrailingNumericSortKey(row['location']),
  },
  { header: 'Description', field: 'description' },
  { header: 'Entries', field: 'entries', numeric: true },
  { header: 'Status', field: 'status' },
  { header: 'Actions', field: 'actions', sortable: false },
];

export const APPLICATIONS_LIST_CHOOSE_STATUS = [
  { label: 'Choose', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
];

export const APPLICATIONS_LIST_ERROR_MESSAGES = {
  noEntriesToPrint: 'No entries available to print',
  pdfGenerateRetry: 'Unable to generate PDF. Please try again later',
  pdfGenerateGeneric: 'Unable to generate PDF.',
  listNotFound: 'Application List not found',
  invalidSearchCriteria:
    'Invalid Search Criteria. At least one field must be entered.',
} as const;

// TODO: remove when we migrate to server sorting
function buildTrailingNumericSortKey(value: unknown): string {
  if (value === null) {
    return '';
  }

  let s: string;

  if (typeof value === 'string') {
    s = value.trim().toLowerCase();
  } else if (typeof value === 'number') {
    s = String(value);
  } else if (typeof value === 'boolean') {
    s = value ? 'true' : 'false';
  } else {
    return '';
  }

  if (s === '') {
    return '';
  }

  let i = s.length - 1;
  while (i >= 0) {
    const code = s.codePointAt(i);
    if (code === undefined) {
      break;
    }

    if (code < 48 || code > 57) {
      break;
    }
    i--;
  }

  if (i === s.length - 1) {
    return s;
  }

  const prefix = s.slice(0, i + 1);
  const numStr = s.slice(i + 1);
  const padded = numStr.padStart(4, '0');

  return `${prefix}${padded}`;
}
