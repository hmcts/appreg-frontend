import { APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
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
    maxlength: 'Address line 1 must be 35 characters or fewer',
    pattern: 'Address line 1 contains invalid characters',
  },
  addressLine2: {
    maxlength: 'Address line 2 must be 35 characters or fewer',
    pattern: 'Address line 2 contains invalid characters',
  },
  addressLine3: {
    maxlength: 'Town or city must be 35 characters or fewer',
    pattern: 'Town or city contains invalid characters',
  },
  addressLine4: {
    maxlength: 'County or region must be 35 characters or fewer',
    pattern: 'County or region contains invalid characters',
  },
  addressLine5: {
    maxlength: 'Post town must be 35 characters or fewer',
    pattern: 'Post town contains invalid characters',
  },
  postcode: {
    maxlength: 'Postcode must be 35 characters or fewer',
    postcode: 'Enter a valid UK postcode',
  },
  phoneNumber: {
    maxlength: 'Telephone number must be 60 characters or fewer',
    phone: 'Enter a valid UK telephone number',
  },
  mobileNumber: {
    maxlength: 'Mobile number must be 60 characters or fewer',
    mobile: 'Enter a valid UK mobile number',
  },
  emailAddress: {
    maxlength: 'Email address must be 253 characters or fewer',
    email: 'Enter an email address in the correct format',
  },
} as const;

export const NOTES_ERROR_MESSAGES: NotesErrorMap = {
  accountReference: {
    maxlength: 'Account reference must be 20 characters or fewer',
    pattern: 'Account reference must only contain letters and numbers',
  },
  caseReference: {
    maxlength: 'Case reference must be 15 characters or fewer',
    pattern: 'Case reference must only contain letters and numbers',
  },
  notes: {
    maxlength: 'Notes must be 4000 characters or fewer',
  },
} as const;

export const PERSON_FIELD_MESSAGES = {
  firstName: {
    required: 'Enter a first name',
    maxlength: 'First name must be 100 characters or fewer',
    pattern: 'First name contains invalid characters',
  },
  middleNames: {
    maxlength: 'Middle names must be 100 characters or fewer',
    pattern: 'Middle names contain invalid characters',
  },
  surname: {
    required: 'Enter a last name',
    maxlength: 'Last name must be 100 characters or fewer',
    pattern: 'Last name contains invalid characters',
  },
  dob: {
    ...APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES.date,
    dateInFuture: 'Date must not be in the future',
  },
  ...person_org_shared_messages,
} as const;

export const ORG_FIELD_MESSAGES = {
  name: {
    required: 'Enter organisation name',
    maxlength: 'Organisation name must be 100 characters or fewer',
    pattern: 'Organisation name contains invalid characters',
  },
  ...person_org_shared_messages,
} as const;

export const CIVIL_FEE_FIELD_MESSAGES: CivilFeeErrorMap = {
  feeStatus: { required: 'Select a fee status' },
  feeStatusDate: {
    required: 'Enter a valid status date',
  },
  paymentRef: {
    maxlength: 'Payment reference must be 15 characters or fewer',
    invalidStatus:
      'A payment reference cannot be supplied when fee status is DUE',
  },
} as const;

export const OFFICIAL_FIELD_MESSAGES = {
  mags1FirstName: {
    maxlength: 'First name must be 100 characters or fewer',
    pattern: 'First name contains invalid characters',
  },
  mags1Surname: {
    required: 'Magistrates 1 Last name is required',
    maxlength: 'Last name must be 100 characters or fewer',
    pattern: 'Last name contains invalid characters',
  },
  mags2FirstName: {
    maxlength: 'First name must be 100 characters or fewer',
    pattern: 'First name contains invalid characters',
  },
  mags2Surname: {
    required: 'Magistrates 2 Last name is required',
    maxlength: 'Last name must be 100 characters or fewer',
    pattern: 'Last name contains invalid characters',
  },
  mags3FirstName: {
    maxlength: 'First name must be 100 characters or fewer',
    pattern: 'First name contains invalid characters',
  },
  mags3Surname: {
    required: 'Magistrates 3 Last name is required',
    maxlength: 'Last name must be 100 characters or fewer',
    pattern: 'Last name contains invalid characters',
  },
  officialFirstName: {
    maxlength: 'First name must be 100 characters or fewer',
    pattern: 'First name contains invalid characters',
  },
  officialSurname: {
    required: "Official's Last name is required",
    maxlength: 'Last name must be 100 characters or fewer',
    pattern: 'Last name contains invalid characters',
  },
} as const;

export const NUMBER_OF_RESPONDENT_MESSAGES = {
  numberOfRespondents: {
    required: 'Enter number of respondents',
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
  lodgementDate: {
    required: 'Enter a valid lodgement date',
  },
  ...NOTES_ERROR_MESSAGES,
  ...PERSON_FIELD_MESSAGES,
  ...ORG_FIELD_MESSAGES,
  ...CIVIL_FEE_FIELD_MESSAGES,
  ...OFFICIAL_FIELD_MESSAGES,
  ...NUMBER_OF_RESPONDENT_MESSAGES,
} as const;

export const SEARCH_ERROR_MESSAGES = {
  sequenceNumber: {
    pattern: 'Sequence number must only contain numbers',
  },
  accountReference: {
    maxlength: 'Account number must be 20 characters or fewer',
  },
  applicantName: {
    maxlength: 'Applicant must be 300 characters or fewer',
  },
  respondentName: {
    maxlength: 'Respondent must be 300 characters or fewer',
  },
  respondentPostcode: {
    maxlength: 'Postcode must be 8 characters or fewer',
    postcode: PERSON_FIELD_MESSAGES.postcode.postcode,
  },
  applicationTitle: {
    maxlength: 'Title must be 500 characters or fewer',
  },
} as const;
