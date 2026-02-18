import { APPLICATIONS_LIST_FORM_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';

export const DETAIL_FIELD_MESSAGES = {
  date: {
    required: 'Enter day, month and year',
    dateInvalid: 'Enter a valid date',
    dateInFuture: 'Date must not be in the future',
  },
  time: {
    required: 'Enter valid hours and minutes',
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
