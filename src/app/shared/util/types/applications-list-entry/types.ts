import { StandardApplicantGetSummaryDto } from '../../../../../generated/openapi';
import { ErrorSummaryItem } from '../shared-types';

export type ApplicantType = 'person' | 'organisation' | 'standardApplicant';

export type StandardApplicantRow = {
  code: StandardApplicantGetSummaryDto['code'];
  name: string;
  address: string;
  useFrom: string; // formatted date
  useTo: string; // formatted date
};

export interface HttpErrorSummary {
  hasFatalError: boolean;
  errorHint: string;
  errorSummary: ErrorSummaryItem[];
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[] | string>;
}

export type ContactFormRaw = {
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  addressLine5: string;
  postcode: string;
  phoneNumber: string;
  mobileNumber: string;
  emailAddress: string;
};

export type PersonFormRaw = ContactFormRaw & {
  title: string;
  firstName: string;
  middleNames: string;
  surname: string;
};

export type OrganisationFormRaw = ContactFormRaw & {
  name: string;
};

export type DateControlErrors = {
  dateInvalid?: boolean;
  dateErrorText?: string;
} | null;

export type TimeControlErrors = {
  durationErrorText?: string;
} | null;

export type DurationControlErrors = {
  durationErrorText?: string;
  hoursErrorText?: string;
  minutesErrorText?: string;
} | null;
