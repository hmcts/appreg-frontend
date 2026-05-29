import { APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import { ReportId } from '@shared-types/reports/report.types';

export const REPORTS_FORM_ERROR_MESSAGES = {
  dateFrom: APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES.date,
  dateTo: {
    ...APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES.date,
    dateRange: 'Date to must be on or after Date from',
  },
  court: {
    courtNotFound:
      APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES.court.courtNotFound,
    courtOtherLocationConflict:
      'Enter either Court or Other Location, not both',
  },
  otherLocation: {
    locationRequired:
      APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES.location.locationRequired,
  },
  cja: {
    cjaNotFound: APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES.cja.cjaNotFound,
    cjaRequiresOtherLocation: 'Enter Other Location before entering CJA',
  },
  activity: {
    required: 'At least 1 activity is required',
  },
} as const;

export const REPORT_ERROR_HREFS: Record<ReportId, Record<string, string>> = {
  'activity-audit': {
    dateFrom: '#date-from',
    dateTo: '#date-to',
    activity: '#activity',
  },
  fees: {
    dateFrom: '#list-date-from',
    dateTo: '#list-date-to',
    court: '#court',
    cja: '#cja',
  },
  'list-maintenance': {
    dateFrom: '#list-date-from',
    dateTo: '#list-date-to',
    court: '#court',
    cja: '#cja',
  },
  'search-warrants': {
    dateFrom: '#list-date-from',
    dateTo: '#list-date-to',
    court: '#court',
    cja: '#cja',
  },
  workload: {
    dateFrom: '#list-date-from',
    dateTo: '#list-date-to',
    court: '#court',
    cja: '#cja',
  },
  duration: {
    dateFrom: '#list-date-from',
    dateTo: '#list-date-to',
    court: '#court',
    cja: '#cja',
  },
  'private-prosecutors-index': {
    dateFrom: '#list-date-from',
    dateTo: '#list-date-to',
    court: '#court',
    otherLocation: '#other-location',
    cja: '#cja',
  },
};
