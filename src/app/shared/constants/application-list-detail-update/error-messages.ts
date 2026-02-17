import { APPLICATIONS_LIST_FORM_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';

export const DETAIL_FIELD_MESSAGES = {
  date: {
    required: 'Enter day, month and year',
    dateInvalid: 'Enter a valid date',
    dateInFuture: 'Date must not be in the future',
  },
  time: {
    required: 'Enter hours and minutes',
    durationInvalid: 'Enter a valid duration between 00:00 and 23:59',
  },
  description: {
    required: 'Enter a description',
    maxlength: 'Description must be 200 characters or fewer',
  },
  status: {
    required: 'Select a status',
  },
  court: {
    courtOrLocCjaRequired:
      'Enter a court, or an other location and criminal justice area',
    courtRequired: 'Court is required',
    courtNotFound: APPLICATIONS_LIST_FORM_ERROR_MESSAGES.court.courtNotFound,
    maxlength: 'Court must be 50 characters or fewer',
  },
  location: {
    locationRequired: 'Other location is required',
    maxlength: 'Location must be 200 characters or fewer',
  },
  cja: {
    cjaRequired: 'Criminal justice area is required',
    cjaNotFound: APPLICATIONS_LIST_FORM_ERROR_MESSAGES.cja.cjaNotFound,
    maxlength: 'Criminal justice area must be 50 characters or fewer',
  },
  duration: {
    durationInvalid: 'Enter a valid duration: Hours 0-99, Mins 0-59',
    hoursErrorText: 'Enter hours between 0 and 99',
    minutesErrorText: 'Enter minutes between 0 and 59',
  },
} as const;

export const DETAIL_GROUP_MESSAGES = {
  courtLocCjaConflict:
    'You can not have Court and Other Location or CJA filled in',
} as const;

export const RESULT_ERROR_MESSAGES = {
  singleResulted: 'This application has already been resulted.',
  allResulted: 'These applications have already been resulted.',
};

export const CLOSE_MESSAGES = {
  closeInvalid:
    'You cannot close this list. See the error summary for details.',
  resultMissing: 'Each entry must have at least one result to close this list',
  officialsMissing:
    'Each entry must have at least one official to close this list',
  feeMissing:
    'Entries with required fees must have a fee status marked "PAID" to close this list',
  respondentMissing:
    'Entries that require a respondent must have a respondent recorded to close this list',
  durationMissing: 'A duration must be recorded to close this list.',
  durationNonPositive:
    'Please enter positive value for either hours or minutes to close this list',
} as const;
