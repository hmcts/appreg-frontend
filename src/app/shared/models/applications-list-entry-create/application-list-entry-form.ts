import { FormControl, FormGroup } from '@angular/forms';

import { ApplicationNotesForm } from '@components/notes-section/notes-section.component';
import {
  Applicant,
  FeeStatus,
  Respondent,
  TemplateSubstitution,
} from '@openapi';

export type ApplicantType = 'person' | 'org' | 'standard';
export type RespondentEntryType = 'person' | 'organisation' | 'bulk';

export type ApplicationListEntryForms = {
  form: ApplicationsListEntryForm;
  personForm: PersonForm;
  organisationForm: OrganisationForm;
  respondentPersonForm: PersonForm;
  respondentOrganisationForm: OrganisationForm;
};

export type ApplicationsListEntryForm = FormGroup<{
  applicationTitle?: FormControl<string | null>;
  applicantType: FormControl<ApplicantType>;
  applicant: FormControl<Applicant | null>;
  standardApplicantCode: FormControl<string | null>;
  applicationCode: FormControl<string | null>;
  respondent: FormControl<Respondent | null>;
  numberOfRespondents: FormControl<number | null>;
  wordingFields: FormControl<TemplateSubstitution[] | null>;
  feeStatuses: FormControl<FeeStatus[] | null>;
  hasOffsiteFee: FormControl<boolean | null>;
  applicationNotes: ApplicationNotesForm;
  lodgementDate: FormControl<string | null>;
  respondentEntryType: FormControl<RespondentEntryType | null>;
  courtName: FormControl<string | null>;
  organisationName: FormControl<string | null>;
  feeStatus: FormControl<string | null>;
  feeStatusDate: FormControl<string | null>;
  paymentRef: FormControl<string | null>;
  accountReference: FormControl<string | null>;
  applicationDetails: FormControl<string | null>;
  resultCode: FormControl<string | null>;
  mags1Title: FormControl<string | null>;
  mags1FirstName: FormControl<string | null>;
  mags1Surname: FormControl<string | null>;
  mags2Title: FormControl<string | null>;
  mags2FirstName: FormControl<string | null>;
  mags2Surname: FormControl<string | null>;
  mags3Title: FormControl<string | null>;
  mags3FirstName: FormControl<string | null>;
  mags3Surname: FormControl<string | null>;
  officialTitle: FormControl<string | null>;
  officialFirstName: FormControl<string | null>;
  officialSurname: FormControl<string | null>;
}>;

export type PersonOrgSharedControls = {
  addressLine1: FormControl<string>;
  addressLine2: FormControl<string>;
  addressLine3: FormControl<string>;
  addressLine4: FormControl<string>;
  addressLine5: FormControl<string>;
  postcode: FormControl<string | null>;
  phoneNumber: FormControl<string | null>;
  mobileNumber: FormControl<string | null>;
  emailAddress: FormControl<string | null>;
};

export type PersonForm = FormGroup<
  {
    title: FormControl<string | null>;
    firstName: FormControl<string>;
    middleNames: FormControl<string>;
    surname: FormControl<string | null>;
  } & PersonOrgSharedControls
>;

export type OrganisationForm = FormGroup<
  {
    name: FormControl<string>;
  } & PersonOrgSharedControls
>;

export type ApplicationsListEntryFormValue = ReturnType<
  ApplicationsListEntryForm['getRawValue']
>;

export type PersonFormValue = ReturnType<PersonForm['getRawValue']>;

export type OrganisationFormValue = ReturnType<OrganisationForm['getRawValue']>;
