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
];

export const APPLICATIONS_LIST_COLUMNS_ACTION: TableColumn[] = [
  ...APPLICATIONS_LIST_COLUMNS,
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

export const APPLICATIONS_LIST_FORM_ERROR_MESSAGES = {
  date: {
    dateInvalid: 'Enter a valid date',
  },
  time: {
    durationInvalid: 'Enter a valid duration between 00:00 and 23:59',
  },
  cja: {
    cjaNotFound: 'Criminal justice area not found',
  },
  court: {
    courtNotFound: 'Court location not found',
  },
};

export const APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES = {
  date: {
    required: 'Enter day, month and year',
    dateInvalid: 'Enter a valid date',
  },
  time: {
    required: 'Enter hours and minutes',
    durationInvalid: 'Enter a valid duration between 00:00 and 23:59',
  },
  description: {
    required: 'Description is required',
    maxlength: 'Description must be 200 characters or fewer',
  },
  court: {
    courtOrLocCjaRequired:
      'Enter a court, or an other location and criminal justice area',
    courtRequired: 'Court is required',
    courtNotFound: 'Court location not found',
    maxlength: 'Court must be 50 characters or fewer',
  },
  location: {
    locationRequired: 'Enter an other location',
    maxlength: 'Location must be 200 characters or fewer',
  },
  cja: {
    cjaNotFound: 'Criminal justice area not found',
    cjaRequired: 'Criminal justice area is required',
    requiredIfOtherLocation: 'Criminal justice area is required',
    maxlength: 'Criminal justice area must be 50 characters or fewer',
  },
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
