type ApplicationsControl = 'respondentPostcode' | 'date' | 'court' | 'cja';
type ApplicationsErrorKeyMap = {
  date: 'dateInvalid';
  respondentPostcode: 'maxlength';
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
  court: {
    courtNotFound: 'Court location not found',
  },
  cja: {
    cjaNotFound: 'Criminal justice area not found',
  },
};
