import { FormGroup, NonNullableFormBuilder } from '@angular/forms';

import {
  Applicant,
  ContactDetails,
  FullName,
  Organisation,
  Person,
} from '../../../../generated/openapi';
import {
  trimToString,
  trimToUndefined,
} from '../../../shared/util/string-helpers';
import {
  ContactFormRaw,
  OrganisationFormRaw,
  PersonFormRaw,
} from '../../../shared/util/types/applications-list-entry/types';

export function buildEntryDetailForm(fb: NonNullableFormBuilder): FormGroup {
  return fb.group({
    // Codes section
    lodgementDate: fb.control({ value: '', disabled: true }),
    applicationCode: fb.control(''),
    applicationTitle: fb.control(''),

    // Entry type selectors (lowercase to match @switch cases in template)
    applicantEntryType: fb.control<
      'person' | 'organisation' | 'standardApplicant'
    >('organisation'),
    respondentEntryType: fb.control<'person' | 'organisation'>('organisation'),

    // Wording section
    courtName: fb.control(''),
    organisationName: fb.control(''),

    // Civil fee section
    feeStatus: fb.control(''),
    feeStatusDate: fb.control(''),
    paymentRef: fb.control(''),

    // Notes section
    caseReference: fb.control(''),
    accountReference: fb.control(''),
    applicationDetails: fb.control(''),

    // Result wording section
    resultCode: fb.control(''),

    // Person sub-group
    person: fb.group({
      title: fb.control(''),
      firstName: fb.control(''),
      middleNames: fb.control(''),
      surname: fb.control(''),
      addressLine1: fb.control(''),
      addressLine2: fb.control(''),
      addressLine3: fb.control(''),
      addressLine4: fb.control(''),
      addressLine5: fb.control(''),
      postcode: fb.control(''),
      phoneNumber: fb.control(''),
      mobileNumber: fb.control(''),
      emailAddress: fb.control(''),
    }),

    // Organisation sub-group
    organisation: fb.group({
      name: fb.control(''),
      addressLine1: fb.control(''),
      addressLine2: fb.control(''),
      addressLine3: fb.control(''),
      addressLine4: fb.control(''),
      addressLine5: fb.control(''),
      postcode: fb.control(''),
      phoneNumber: fb.control(''),
      mobileNumber: fb.control(''),
      emailAddress: fb.control(''),
    }),

    // Officials section
    mags1Title: fb.control(''),
    mags1FirstName: fb.control(''),
    mags1Surname: fb.control(''),
    mags2Title: fb.control(''),
    mags2FirstName: fb.control(''),
    mags2Surname: fb.control(''),
    mags3Title: fb.control(''),
    mags3FirstName: fb.control(''),
    mags3Surname: fb.control(''),
    officialTitle: fb.control(''),
    officialFirstName: fb.control(''),
    officialSurname: fb.control(''),
  });
}

export function buildContactDetailsFromRaw(v: ContactFormRaw): ContactDetails {
  return {
    addressLine1: trimToString(v.addressLine1),
    addressLine2: trimToUndefined(v.addressLine2),
    addressLine3: trimToUndefined(v.addressLine3),
    addressLine4: trimToUndefined(v.addressLine4),
    addressLine5: trimToUndefined(v.addressLine5),
    postcode: trimToUndefined(v.postcode),
    phone: trimToUndefined(v.phoneNumber),
    mobile: trimToUndefined(v.mobileNumber),
    email: trimToUndefined(v.emailAddress),
  };
}

export function contactDetailsToFormPatch(cd: ContactDetails): ContactFormRaw {
  return {
    addressLine1: cd.addressLine1 ?? '',
    addressLine2: cd.addressLine2 ?? '',
    addressLine3: cd.addressLine3 ?? '',
    addressLine4: cd.addressLine4 ?? '',
    addressLine5: cd.addressLine5 ?? '',
    postcode: cd.postcode ?? '',
    phoneNumber: cd.phone ?? '',
    mobileNumber: cd.mobile ?? '',
    emailAddress: cd.email ?? '',
  };
}

export function buildPersonApplicantFromRaw(raw: PersonFormRaw): Applicant {
  const name: FullName = {
    title: trimToUndefined(raw.title),
    firstForename: trimToString(raw.firstName),
    secondForename: trimToUndefined(raw.middleNames),
    surname: trimToString(raw.surname),
  };

  const person: Person = {
    name,
    contactDetails: buildContactDetailsFromRaw(raw),
  };

  return { person };
}

export function buildOrganisationApplicantFromRaw(
  raw: OrganisationFormRaw,
): Applicant {
  const organisation: Organisation = {
    name: trimToString(raw.name),
    contactDetails: buildContactDetailsFromRaw(raw),
  };

  return { organisation };
}
