import { ReportId } from '@shared-types/reports/report.types';

const REPORT_DATE_ERROR_MESSAGES = {
  required: 'Enter day, month and year',
  dateInvalid: 'Enter a valid date',
} as const;

export const REPORTS_FORM_ERROR_MESSAGES = {
  dateFrom: REPORT_DATE_ERROR_MESSAGES,
  dateTo: REPORT_DATE_ERROR_MESSAGES,
  court: {
    courtNotFound: 'Court location not found',
  },
  cja: {
    cjaNotFound: 'Criminal justice area not found',
  },
} as const;

export const REPORT_ERROR_HREFS: Record<ReportId, Record<string, string>> = {
  'activity-audit': {
    dateFrom: '#date-from',
    dateTo: '#date-to',
  },
  fees: {
    dateFrom: '#fees-date-from',
    dateTo: '#fees-date-to',
    court: '#fees-court',
    cja: '#fees-cja',
  },
  'list-maintenance': {
    dateFrom: '#list-date-from',
    dateTo: '#list-date-to',
    court: '#list-court',
    cja: '#list-cja',
  },
  'search-warrants': {
    dateFrom: '#list-date-from',
    dateTo: '#list-date-to',
    court: '#court',
    cja: '#cja',
  },
  workload: {
    dateFrom: '#wl-date-from',
    dateTo: '#wl-date-to',
    court: '#wl-court',
    cja: '#wl-cja',
  },
  duration: {
    dateFrom: '#dur-date-from',
    dateTo: '#dur-date-to',
    court: '#dur-court',
    cja: '#dur-cja',
  },
  'private-prosecutors-index': {
    dateFrom: '#ppi-date-from',
    dateTo: '#ppi-date-to',
    court: '#ppi-court',
    cja: '#ppi-cja',
  },
};
