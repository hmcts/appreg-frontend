import { ApplicationNotesForm } from '@components/notes-section/notes-section.component';

type NotesControlName = keyof ApplicationNotesForm['controls'];

type NotesErrorMap = Readonly<
  Record<NotesControlName, Readonly<Record<string, string>>>
>;

type CivilFeeControlName = 'feeStatus' | 'feeStatusDate' | 'paymentRef';

type CivilFeeErrorMap = Readonly<
  Record<CivilFeeControlName, Readonly<Record<string, string>>>
>;

const person_org_shared_messages = {
  addressLine1: {
    required: 'Enter address line 1',
    maxlength: 'Address line 1 must be less than or equal to 60 characters',
    pattern: 'Address line 1 contains invalid characters',
  },
  addressLine2: {
    maxlength: 'Address line 2 must be less than or equal to 60 characters',
    pattern: 'Address line 2 contains invalid characters',
  },
  addressLine3: {
    maxlength: 'Address line 3 must be less than or equal to 60 characters',
    pattern: 'Town or city contains invalid characters',
  },
  addressLine4: {
    maxlength: 'Address line 4 must be less than or equal to 60 characters',
    pattern: 'County or region contains invalid characters',
  },
  addressLine5: {
    maxlength: 'Address line 5 must be less than or equal to 60 characters',
    pattern: 'Post town contains invalid characters',
  },
  postcode: {
    maxlength: 'Postcode must be less than or equal to 60 characters',
    postcode: 'Enter a valid UK postcode',
  },
  phoneNumber: {
    maxlength: 'Telephone number must be less than or equal to 60 characters',
    phone: 'Enter a valid UK telephone number',
  },
  mobileNumber: {
    maxlength: 'Mobile number must be less than or equal to 60 characters',
    mobile: 'Enter a valid UK mobile number',
  },
  emailAddress: {
    maxlength: 'Email address must be less than or equal to 60 characters',
    email: 'Enter an email address in the correct format',
  },
} as const;

export const NOTES_ERROR_MESSAGES: NotesErrorMap = {
  accountReference: {
    maxlength: 'Account reference must be less than or equal to 20 characters',
    pattern: 'Account reference must only contain letters and numbers',
  },
  caseReference: {
    maxlength: 'Case reference must be less than or equal to 15 characters',
    pattern: 'Case reference must only contain letters and numbers',
  },
  notes: {
    maxlength: 'Notes must be less than or equal to 4000 characters',
  },
} as const;

export const PERSON_FIELD_MESSAGES = {
  firstName: {
    required: 'Enter a first name',
    maxlength: 'First name must be less than or equal to 60 characters',
    pattern: 'First name contains invalid characters',
  },
  middleNames: {
    maxlength: 'Middle names must be less than or equal to 60 characters',
    pattern: 'Middle names contain invalid characters',
  },
  surname: {
    required: 'Enter a last name',
    maxlength: 'Last name must be less than or equal to 60 characters',
    pattern: 'Last name contains invalid characters',
  },
  ...person_org_shared_messages,
} as const;

export const ORG_FIELD_MESSAGES = {
  name: {
    required: 'Enter organisation name',
    maxlength: 'Organisation name must be less than or equal to 60 characters',
    pattern: 'Organisation name contains invalid characters',
  },
  ...person_org_shared_messages,
} as const;

export const CIVIL_FEE_FIELD_MESSAGES: CivilFeeErrorMap = {
  feeStatus: { required: 'Select a fee status' },
  feeStatusDate: {
    required: 'Enter a status date',
  },
  paymentRef: {
    maxlength: 'Payment reference must be less than or equal to 15 characters',
    invalidStatus:
      'A payment reference cannot be supplied when fee status is DUE',
  },
} as const;

export const OFFICIAL_FIELD_MESSAGES = {
  mags1FirstName: {
    maxlength: 'First name must be less than or equal to 60 characters',
    pattern: 'First name contains invalid characters',
  },
  mags1Surname: {
    maxlength: 'Last name must be less than or equal to 60 characters',
    pattern: 'Last name contains invalid characters',
  },
  mags2FirstName: {
    maxlength: 'First name must be less than or equal to 60 characters',
    pattern: 'First name contains invalid characters',
  },
  mags2Surname: {
    maxlength: 'Last name must be less than or equal to 60 characters',
    pattern: 'Last name contains invalid characters',
  },
  mags3FirstName: {
    maxlength: 'First name must be less than or equal to 60 characters',
    pattern: 'First name contains invalid characters',
  },
  mags3Surname: {
    maxlength: 'Last name must be less than or equal to 60 characters',
    pattern: 'Last name contains invalid characters',
  },
  officialFirstName: {
    maxlength: 'First name must be less than or equal to 60 characters',
    pattern: 'First name contains invalid characters',
  },
  officialSurname: {
    maxlength: 'Last name must be less than or equal to 60 characters',
    pattern: 'Last name contains invalid characters',
  },
} as const;

export const NUMBER_OF_RESPONDENT_MESSAGES = {
  numberOfRespondents: {
    pattern:
      'Number of respondents must be a positive whole number between 1 - 9999',
    maxlength:
      'Number of respondents must be less than or equal to 4 characters',
  },
} as const;

export const ENTRY_ERROR_MESSAGES = {
  standardApplicantCode: {
    required: 'Select a standard applicant',
  },
  applicationCode: {
    required: 'Enter an application code',
  },
  ...NOTES_ERROR_MESSAGES,
  ...PERSON_FIELD_MESSAGES,
  ...ORG_FIELD_MESSAGES,
  ...CIVIL_FEE_FIELD_MESSAGES,
  ...OFFICIAL_FIELD_MESSAGES,
  ...NUMBER_OF_RESPONDENT_MESSAGES,
} as const;
