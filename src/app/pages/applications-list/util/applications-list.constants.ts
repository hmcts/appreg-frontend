import { TableColumn } from '@components/sortable-table/sortable-table.component';

export const APPLICATIONS_LIST_COLUMNS: TableColumn[] = [
  { header: 'Date', field: 'date' },
  { header: 'Time', field: 'time' },
  {
    header: 'Location',
    field: 'location',
  },
  { header: 'Description', field: 'description' },
  { header: 'Entries', field: 'entries', numeric: true },
  { header: 'Status', field: 'status' },
  { header: 'Actions', field: 'actions', sortable: false },
];

export const APPLICATION_LIST_SORT_MAP: Record<string, string> = {
  date: 'date',
  time: 'time',
  location: 'location',
  description: 'description',
  entries: 'entriesCount',
  status: 'status',
};

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
  cjaNotFound: 'Criminal Justice Area not found',
} as const;
