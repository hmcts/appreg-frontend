import { FormGroup, NonNullableFormBuilder } from '@angular/forms';

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
