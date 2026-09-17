type ApplicationsControl =
  | 'respondentPostcode'
  | 'applicationTitle'
  | 'date'
  | 'court'
  | 'cja';
type ApplicationsErrorKeyMap = {
  date: 'dateInvalid';
  respondentPostcode: 'maxlength';
  applicationTitle: 'maxlength' | 'pattern';
  court: 'courtNotFound';
  cja: 'cjaNotFound';
};
export const APPLICATIONS_ERROR_MAP: {
  [C in ApplicationsControl]: Record<ApplicationsErrorKeyMap[C], string>;
} = {
  date: { dateInvalid: 'Enter a valid date' },
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
