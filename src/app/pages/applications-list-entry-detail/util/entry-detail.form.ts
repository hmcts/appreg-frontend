import { FormBuilder, FormGroup } from '@angular/forms';

export function buildEntryDetailForm(fb: FormBuilder): FormGroup {
  return fb.group({
    lodgementDate: [{ value: '', disabled: true }],
    applicationCode: [''],
    applicationTitle: [''],

    applicantEntryType: ['Organisation'],
    respondentEntryType: ['Organisation'],

    person: fb.group({
      title: [''],
      firstName: [''],
      middleNames: [''],
      surname: [''],
      addressLine1: [''],
      addressLine2: [''],
      addressLine3: [''],
      addressLine4: [''],
      addressLine5: [''],
      postcode: [''],
      phoneNumber: [''],
      mobileNumber: [''],
      emailAddress: [''],
    }),
    organisation: fb.group({
      name: [''],
      addressLine1: [''],
      addressLine2: [''],
      addressLine3: [''],
      addressLine4: [''],
      addressLine5: [''],
      postcode: [''],
      phoneNumber: [''],
      emailAddress: [''],
    }),

    // (keep the rest exactly as you had them)
    mags1Title: [''], mags1FirstName: [''], mags1Surname: [''],
    mags2Title: [''], mags2FirstName: [''], mags2Surname: [''],
    mags3Title: [''], mags3FirstName: [''], mags3Surname: [''],
    officialTitle: [''], officialFirstName: [''], officialSurname: [''],
  });
}
