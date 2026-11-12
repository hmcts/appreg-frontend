import { SearchFilterField, SearchInterpretationNotice } from '@openapi';

export const ApplicationsColumns = [
  { header: 'Date', field: 'date', wrap: false },
  { header: 'Applicant', field: 'applicant' },
  { header: 'Respondent', field: 'respondent' },
  { header: 'Application title', field: 'title' },
  { header: 'Fee', field: 'fee' },
  { header: 'Resulted', field: 'resulted' },
  { header: 'Status', field: 'status', wrap: false },
  { header: 'Actions', field: 'actions', sortable: false },
];

// Most court codes the API accepts in one search (EntryGetFilterDto.courtCodes
// maxItems). Court and Other courts together are sent as one list of codes.
export const COURT_CODES_MAX_ITEMS = 20;

// Most courts Other courts can hold. Court takes one of the codes the API
// accepts, so Court and Other courts together can never send more than it
// allows.
export const OTHER_COURTS_MAX_ITEMS = COURT_CODES_MAX_ITEMS - 1;

// Most characters in a plain-English search question (the API's limit,
// SearchInterpretationRequestDto.question)
export const PLAIN_ENGLISH_QUESTION_MAX_LENGTH = 300;

// The name of each search filter field, shown next to the value the
// plain-English search set it to. Typed against SearchFilterField, so a field
// the API adds fails to compile here.
export const INTERPRETED_FILTER_FIELD_LABELS: Readonly<
  Record<SearchFilterField, string>
> = {
  [SearchFilterField.DATE]: 'List date',
  [SearchFilterField.DATE_FROM]: 'List date from',
  [SearchFilterField.DATE_TO]: 'List date to',
  [SearchFilterField.COURT_CODE]: 'Court',
  [SearchFilterField.COURT_CODES]: 'Courts',
  [SearchFilterField.CJA_CODE]: 'Criminal justice area',
  [SearchFilterField.APPLICATION_CODES]: 'Application codes',
  [SearchFilterField.APPLICATION_CODE_CATEGORY]: 'Application category',
  [SearchFilterField.RESULT_CODES]: 'Result codes',
  [SearchFilterField.STANDARD_APPLICANT_CODES]: 'Standard applicants',
  [SearchFilterField.APPLICANT_NAME]: 'Applicant name',
  [SearchFilterField.APPLICANT_ORGANISATION]: 'Applicant organisation',
  [SearchFilterField.APPLICANT_SURNAME]: 'Applicant surname',
  [SearchFilterField.RESPONDENT_NAME]: 'Respondent name',
  [SearchFilterField.RESPONDENT_ORGANISATION]: 'Respondent organisation',
  [SearchFilterField.RESPONDENT_SURNAME]: 'Respondent surname',
  [SearchFilterField.RESPONDENT_POSTCODE]: 'Respondent post code',
  [SearchFilterField.ACCOUNT_REFERENCE]: 'Account reference',
  [SearchFilterField.STATUS]: 'Status',
};

// Fixed copy for each plain-English search notice. Typed against
// SearchInterpretationNotice, so a notice the API adds fails to compile here.
// The search runs straight from the question, so the copy never asks staff
// to check something "before you search".
export const INTERPRETATION_NOTICE_TEXT: Readonly<
  Record<SearchInterpretationNotice, string>
> = {
  [SearchInterpretationNotice.WELSH_NOT_SUPPORTED]:
    'Plain-English search only understands questions in English.',
  [SearchInterpretationNotice.MINIMUM_FILTER_NOT_MET]:
    'The filters from your question are not narrow enough to search on their own. Add more filters and search again.',
  [SearchInterpretationNotice.UNKNOWN_CODE_DROPPED]:
    'A code in your question does not exist, so it was left out.',
  [SearchInterpretationNotice.FIELD_NOT_AVAILABLE]:
    'Your question asked for a filter that is not available yet, so it was left out.',
  [SearchInterpretationNotice.DATE_NOT_UNDERSTOOD]:
    'A date in your question could not be worked out. Check the dates and search again if they are wrong.',
  [SearchInterpretationNotice.DATE_IN_FUTURE]:
    'A date in your question is in the future. Check the dates and search again if they are wrong.',
  [SearchInterpretationNotice.NAME_TOO_SHORT]:
    'A name in your question was too short to search on, so it was left out.',
  [SearchInterpretationNotice.TOO_MANY_MATCHES]:
    'A name in your question matched too many values to offer as choices, so it was left out.',
  [SearchInterpretationNotice.VALUE_NOT_VALID]:
    'A value in your question is not a valid filter value, so it was left out.',
};

// Said in each choice of a plain-English search (the radio group's hint, so
// it is in the fieldset's aria-describedby). A pick reached with the arrow
// keys does not search until staff press Space or move out of the choice, so
// passing over an option never searches for it.
export const INTERPRETATION_CHOICE_SEARCH_HINT =
  'The search runs once every choice is answered. If you use the arrow keys, it runs when you press Space or move on.';

// Said in "Searched for" when staff changed a filter by hand before the search
// from their question ran. The summary leaves out what the question set for
// those filters rather than repeat what staff typed.
export const SEARCHED_FOR_CHANGED_BY_HAND_TEXT =
  'Some filters were changed by hand. The search form shows every filter that was searched.';
