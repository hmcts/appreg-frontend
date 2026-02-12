type ApplicationsControl = 'respondentPostcode' | 'date' | 'court' | 'cja';
type ApplicationsErrorKeyMap = {
  date: 'dateInvalid';
  respondentPostcode: 'postcode';
  court: 'courtNotFound';
  cja: 'cjaNotFound';
};
export const APPLICATIONS_ERROR_MAP: {
  [C in ApplicationsControl]: Record<ApplicationsErrorKeyMap[C], string>;
} = {
  date: { dateInvalid: 'Enter a valid date' },
  respondentPostcode: { postcode: 'Enter a valid UK postcode' },
  court: {
    courtNotFound: 'Court Location not found',
  },
  cja: {
    cjaNotFound: 'Criminal Justice Area not found',
  },
};
