type ApplicationsControl =
  | 'applicantName'
  | 'respondentName'
  | 'respondentPostcode'
  | 'applicationTitle'
  | 'date'
  | 'dateFrom'
  | 'dateTo'
  | 'court'
  | 'cja';
type ApplicationsErrorKeyMap = {
  date: 'dateInvalid' | 'singleDateOrDateRange';
  dateFrom: 'dateInvalid';
  dateTo: 'dateInvalid' | 'dateRange';
  applicantName: 'maxlength';
  respondentName: 'maxlength';
  respondentPostcode: 'maxlength';
  applicationTitle: 'maxlength' | 'pattern';
  court: 'courtNotFound';
  cja: 'cjaNotFound';
};
export const APPLICATIONS_ERROR_MAP: {
  [C in ApplicationsControl]: Record<ApplicationsErrorKeyMap[C], string>;
} = {
  date: {
    dateInvalid: 'Enter a valid date',
    singleDateOrDateRange: 'Enter a list date or a date range, not both',
  },
  // Range summary items name their field so they stay distinct from each
  // other and from List date
  dateFrom: { dateInvalid: 'List date from must be a valid date' },
  dateTo: {
    dateInvalid: 'List date to must be a valid date',
    dateRange: 'List date to must be on or after List date from',
  },
  applicantName: {
    maxlength: 'Applicant name must be 300 characters or fewer',
  },
  respondentName: {
    maxlength: 'Respondent name must be 300 characters or fewer',
  },
  respondentPostcode: {
    maxlength: 'Postcode must be 8 characters or fewer',
  },
  applicationTitle: {
    maxlength: 'Application title must be 500 characters or fewer',
    pattern: 'Application title contains invalid characters',
  },
  court: {
    courtNotFound: 'Court location not found',
  },
  cja: {
    cjaNotFound: 'Criminal justice area not found',
  },
};
