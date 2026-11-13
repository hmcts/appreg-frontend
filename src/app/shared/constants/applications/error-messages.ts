type ApplicationsControl =
  | 'applicantName'
  | 'respondentName'
  | 'respondentPostcode'
  | 'applicationTitle'
  | 'date'
  | 'dateFrom'
  | 'dateTo'
  | 'applicationCodes'
  | 'resultCodes'
  | 'court'
  | 'courtCodes'
  | 'cja';
type ApplicationsErrorKeyMap = {
  date: 'dateInvalid' | 'singleDateOrDateRange';
  dateFrom: 'dateInvalid';
  dateTo: 'dateInvalid' | 'dateRange';
  applicantName: 'maxlength';
  respondentName: 'maxlength';
  respondentPostcode: 'maxlength';
  applicationTitle: 'maxlength' | 'pattern';
  applicationCodes: 'notAdded';
  resultCodes: 'notAdded';
  court: 'courtNotFound';
  courtCodes: 'notAdded';
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
  // Text typed into a code list but not picked from it (app-multi-suggestions)
  applicationCodes: {
    notAdded: 'Select an application code from the list, or clear the text',
  },
  resultCodes: {
    notAdded: 'Select a result code from the list, or clear the text',
  },
  court: {
    courtNotFound: 'Court location not found',
  },
  // Text typed into Other courts but not picked from it
  courtCodes: {
    notAdded: 'Select a court from the list, or clear the text',
  },
  cja: {
    cjaNotFound: 'Criminal justice area not found',
  },
};

// Plain-English search: the question staff type (checked before it is sent)
export const PLAIN_ENGLISH_QUESTION_ERROR_MESSAGES: Readonly<
  Record<'required' | 'maxlength', string>
> = {
  required: 'Enter a question',
  maxlength: 'Question must be 300 characters or fewer',
};

// Statuses from POST /application-list-entries/search-interpretations that
// stay on the page (ErrorMessageService). 0 is a network error with no
// response. A 401 goes to login.
export type PlainEnglishSearchErrorStatus =
  | 0
  | 400
  | 403
  | 404
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504;

// Shown for a status with no copy of its own
export const PLAIN_ENGLISH_SEARCH_UNAVAILABLE =
  'Plain-English search is unavailable. Use the filters below.';

// Shown for a 422, and when an interpretation sets no filter at all, so the
// search is not run (it would return every entry)
export const PLAIN_ENGLISH_SEARCH_NOT_UNDERSTOOD =
  'We could not work out any filters from your question.';

// Fixed copy for each status. The API's problem text is never shown, so no
// part of the question can be echoed back.
export const PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES: Readonly<
  Record<PlainEnglishSearchErrorStatus, string>
> = {
  0: PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
  400: PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
  403: PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
  404: PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
  422: PLAIN_ENGLISH_SEARCH_NOT_UNDERSTOOD,
  429: 'You have made too many requests. Try again in a minute.',
  500: PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
  502: PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
  503: PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
  504: PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
};

// A choice from a plain-English search that has not been answered
export const INTERPRETATION_CHOICE_ERROR_MESSAGE =
  'Select one of the options, or None of these';
