import { FormBuilder } from '@angular/forms';

import {
  buildEntryUpdateDtoForFeeChange,
  buildEntryUpdateDtoFromForm,
  buildEntryUpdateDtoWithChange,
  buildOrganisationForm,
  buildPersonForm,
  buildPersonOrgSharedControls,
  buildStandardApplicationForm,
  getRespondentEntryType,
} from '@components/applications-list-entry-detail/util/entry-detail.form';
import type {
  EntryGetDetailDto,
  Organisation,
  Person,
  Respondent,
} from '@openapi';

describe('applications-list entry form builders', () => {
  const fb = new FormBuilder().nonNullable;

  describe('buildPersonOrgSharedControls', () => {
    it('addressLine1 is required', () => {
      const controls = buildPersonOrgSharedControls(fb);
      controls.addressLine1.setValue('');
      controls.addressLine1.updateValueAndValidity();

      expect(controls.addressLine1.errors).toHaveProperty('required');
    });

    it('addressLine1 rejects control characters (pattern)', () => {
      const controls = buildPersonOrgSharedControls(fb);
      controls.addressLine1.setValue('Line1\nLine2');
      controls.addressLine1.updateValueAndValidity();

      expect(controls.addressLine1.errors).toHaveProperty('pattern');
    });

    it('addressLine2 allows empty but rejects control characters when present', () => {
      const controls = buildPersonOrgSharedControls(fb);

      controls.addressLine2.setValue('');
      controls.addressLine2.updateValueAndValidity();
      expect(controls.addressLine2.errors).toBeNull();

      controls.addressLine2.setValue('A\tB');
      controls.addressLine2.updateValueAndValidity();
      expect(controls.addressLine2.errors).toHaveProperty('pattern');
    });

    it('emailAddress uses Angular email validator', () => {
      const controls = buildPersonOrgSharedControls(fb);

      controls.emailAddress.setValue('not-an-email');
      controls.emailAddress.updateValueAndValidity();
      expect(controls.emailAddress.errors).toHaveProperty('email');

      controls.emailAddress.setValue('test@example.com');
      controls.emailAddress.updateValueAndValidity();
      expect(controls.emailAddress.errors).toBeNull();
    });

    it('postcode/phone/mobile validators are optional (empty is valid)', () => {
      const controls = buildPersonOrgSharedControls(fb);

      controls.postcode.setValue(null);
      controls.postcode.updateValueAndValidity();
      expect(controls.postcode.errors).toBeNull();

      controls.phoneNumber.setValue(null);
      controls.phoneNumber.updateValueAndValidity();
      expect(controls.phoneNumber.errors).toBeNull();

      controls.mobileNumber.setValue(null);
      controls.mobileNumber.updateValueAndValidity();
      expect(controls.mobileNumber.errors).toBeNull();
    });

    it('max length is enforced (60) on address lines', () => {
      const controls = buildPersonOrgSharedControls(fb);
      controls.addressLine1.setValue('a'.repeat(61));
      controls.addressLine1.updateValueAndValidity();

      expect(controls.addressLine1.errors).toHaveProperty('maxlength');
    });
  });

  describe('buildPersonForm', () => {
    it('firstName is required and rejects control characters (pattern)', () => {
      const form = buildPersonForm(fb);

      form.controls.firstName.setValue('');
      form.controls.firstName.updateValueAndValidity();
      expect(form.controls.firstName.errors).toHaveProperty('required');

      form.controls.firstName.setValue('John\n');
      form.controls.firstName.updateValueAndValidity();
      expect(form.controls.firstName.errors).toHaveProperty('pattern');
    });

    it('middleNames is optional but rejects control characters', () => {
      const form = buildPersonForm(fb);

      form.controls.middleNames.setValue('');
      form.controls.middleNames.updateValueAndValidity();
      expect(form.controls.middleNames.errors).toBeNull();

      form.controls.middleNames.setValue('A\tB');
      form.controls.middleNames.updateValueAndValidity();
      expect(form.controls.middleNames.errors).toHaveProperty('pattern');
    });

    it('surname is required', () => {
      const form = buildPersonForm(fb);

      form.controls.surname.setValue(null);
      form.controls.surname.updateValueAndValidity();
      expect(form.controls.surname.errors).toHaveProperty('required');
    });
  });

  describe('buildOrganisationForm', () => {
    it('org name is required and rejects control characters', () => {
      const form = buildOrganisationForm(fb);

      form.controls.name.setValue('');
      form.controls.name.updateValueAndValidity();
      expect(form.controls.name.errors).toHaveProperty('required');

      form.controls.name.setValue('ACME\nLtd');
      form.controls.name.updateValueAndValidity();
      expect(form.controls.name.errors).toHaveProperty('pattern');
    });
  });

  describe('buildStandardApplicationForm', () => {
    it('applicationNotes.caseReference enforces alphanumeric only', () => {
      const form = buildStandardApplicationForm(fb);
      const notesGroup = form.controls.applicationNotes;

      notesGroup.controls.caseReference.setValue('ABC-123'); // hyphen not allowed
      notesGroup.controls.caseReference.updateValueAndValidity();
      expect(notesGroup.controls.caseReference.errors).toHaveProperty(
        'pattern',
      );

      notesGroup.controls.caseReference.setValue('ABC123');
      notesGroup.controls.caseReference.updateValueAndValidity();
      expect(notesGroup.controls.caseReference.errors).toBeNull();
    });

    it('official/mags names have maxlength and pattern', () => {
      const form = buildStandardApplicationForm(fb);

      form.controls.mags1FirstName.setValue('A'.repeat(61));
      form.controls.mags1FirstName.updateValueAndValidity();
      expect(form.controls.mags1FirstName.errors).toHaveProperty('maxlength');

      form.controls.mags1FirstName.setValue('A\tB');
      form.controls.mags1FirstName.updateValueAndValidity();
      expect(form.controls.mags1FirstName.errors).toHaveProperty('pattern');
    });

    it('requires surname when a magistrate or official first name is entered', () => {
      const form = buildStandardApplicationForm(fb);

      form.controls.mags1FirstName.setValue('John');
      form.updateValueAndValidity();
      expect(form.controls.mags1Surname.errors).toHaveProperty('required');

      form.controls.mags1FirstName.setValue(null);
      form.controls.mags1Surname.setErrors(null);

      form.controls.mags2FirstName.setValue('Jane');
      form.updateValueAndValidity();
      expect(form.controls.mags2Surname.errors).toHaveProperty('required');

      form.controls.mags2FirstName.setValue(null);
      form.controls.mags2Surname.setErrors(null);

      form.controls.mags3FirstName.setValue('Alex');
      form.updateValueAndValidity();
      expect(form.controls.mags3Surname.errors).toHaveProperty('required');

      form.controls.mags3FirstName.setValue(null);
      form.controls.mags3Surname.setErrors(null);

      form.controls.officialFirstName.setValue('Clara');
      form.updateValueAndValidity();
      expect(form.controls.officialSurname.errors).toHaveProperty('required');
    });
  });

  describe('getRespondentEntryType', () => {
    const mkPerson = (): Person => ({}) as Person;
    const mkOrg = (): Organisation => ({}) as Organisation;

    const mkRespondent = (r: Partial<Respondent>): Respondent =>
      r as Respondent;

    it('returns explicit type when it matches payload', () => {
      const r1 = mkRespondent({ person: mkPerson() });
      const r2 = mkRespondent({ organisation: mkOrg() });

      expect(getRespondentEntryType(r1)).toBe('person');
      expect(getRespondentEntryType(r2)).toBe('organisation');
    });

    it('if explicit type does not match payload, prefers the present payload', () => {
      const r1 = mkRespondent({ organisation: mkOrg() });
      const r2 = mkRespondent({ person: mkPerson() });

      expect(getRespondentEntryType(r1)).toBe('organisation');
      expect(getRespondentEntryType(r2)).toBe('person');
    });

    it('infers type from presence when type is missing', () => {
      const r1 = mkRespondent({ person: mkPerson() });
      const r2 = mkRespondent({ organisation: mkOrg() });

      expect(getRespondentEntryType(r1)).toBe('person');
      expect(getRespondentEntryType(r2)).toBe('organisation');
    });

    it('returns null if nothing present', () => {
      const r = mkRespondent({}); // neither person nor organisation
      expect(getRespondentEntryType(null)).toBeNull();
      expect(getRespondentEntryType(r)).toBeNull();
    });
  });

  describe('buildEntryUpdateDtoFromForm', () => {
    const personApplicant = {
      person: {
        name: {
          firstForename: 'Jane',
          surname: 'Doe',
        },
        contactDetails: {
          addressLine1: '1 Street',
        },
      },
    };

    const baseDetail: EntryGetDetailDto = {
      applicationCode: 'APP-100',
      standardApplicantCode: 'STD-OLD',
      applicant: personApplicant,
      respondent: undefined,
      numberOfRespondents: undefined,
      feeStatuses: undefined,
      hasOffsiteFee: undefined,
      caseReference: undefined,
      accountNumber: undefined,
      notes: undefined,
      lodgementDate: '2025-01-01',
    } as unknown as EntryGetDetailDto;

    const blankPerson = {
      title: null,
      firstName: '',
      middleNames: '',
      surname: null,
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      addressLine4: '',
      addressLine5: '',
      postcode: null,
      phoneNumber: null,
      mobileNumber: null,
      emailAddress: null,
    };

    const blankOrg = {
      name: '',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      addressLine4: '',
      addressLine5: '',
      postcode: null,
      phoneNumber: null,
      mobileNumber: null,
      emailAddress: null,
    };

    it('clears applicant when applicantType is standard', () => {
      const dto = buildEntryUpdateDtoFromForm(
        baseDetail,
        {
          applicantType: 'standard',
          standardApplicantCode: '  STD-123  ',
          applicationCode: 'APP-100',
          respondentEntryType: 'person',
          applicationNotes: {
            notes: null,
            caseReference: null,
            accountReference: null,
          },
        } as never,
        blankPerson as never,
        blankOrg as never,
        blankPerson as never,
        blankOrg as never,
      );

      expect(dto.standardApplicantCode).toBe('STD-123');
      expect('applicant' in dto).toBe(false);
    });

    it('clears stale standardApplicantCode when applicantType is person', () => {
      const dto = buildEntryUpdateDtoFromForm(
        baseDetail,
        {
          applicantType: 'person',
          standardApplicantCode: 'STD-OLD',
          applicationCode: 'APP-100',
          respondentEntryType: 'person',
          applicationNotes: {
            notes: null,
            caseReference: null,
            accountReference: null,
          },
        } as never,
        {
          ...blankPerson,
          firstName: 'John',
          surname: 'Smith',
          addressLine1: '1 Street',
        } as never,
        blankOrg as never,
        blankPerson as never,
        blankOrg as never,
      );

      expect(dto.applicant?.person?.name?.firstForename).toBe('John');
      expect('standardApplicantCode' in dto).toBe(false);
    });
  });

  describe('buildEntryUpdateDtoWithChange', () => {
    it('clears applicant when detail uses standardApplicantCode', () => {
      const dto = buildEntryUpdateDtoWithChange(
        {
          applicationCode: 'APP-100',
          standardApplicantCode: 'STD-123',
          applicant: {
            person: {
              name: { firstForename: 'Jane', surname: 'Doe' },
              contactDetails: { addressLine1: '1 Street' },
            },
          },
          lodgementDate: '2025-01-01',
        } as unknown as EntryGetDetailDto,
        'feeStatuses',
        [],
      );

      expect(dto.standardApplicantCode).toBe('STD-123');
      expect('applicant' in dto).toBe(false);
    });

    it('clears standardApplicantCode when detail uses applicant object', () => {
      const dto = buildEntryUpdateDtoWithChange(
        {
          applicationCode: 'APP-100',
          standardApplicantCode: 'STD-OLD',
          applicant: {
            person: {
              name: { firstForename: 'Jane', surname: 'Doe' },
              contactDetails: { addressLine1: '1 Street' },
            },
          },
          lodgementDate: '2025-01-01',
        } as unknown as EntryGetDetailDto,
        'standardApplicantCode',
        undefined as never,
      );

      expect(dto.applicant?.person?.name?.firstForename).toBe('Jane');
      expect('standardApplicantCode' in dto).toBe(false);
    });
  });

  describe('buildEntryUpdateDtoForFeeChange', () => {
    it('uses current applicationCode and lodgementDate from the form while preserving unrelated persisted fields', () => {
      const dto = buildEntryUpdateDtoForFeeChange(
        {
          applicationCode: 'APP-100',
          lodgementDate: '2025-01-01',
          notes: 'persisted note',
          applicant: {
            person: {
              name: { firstForename: 'Jane', surname: 'Doe' },
              contactDetails: { addressLine1: '1 Street' },
            },
          },
        } as unknown as EntryGetDetailDto,
        {
          applicationCode: 'APP-200',
          lodgementDate: '2025-02-02',
          applicationNotes: {
            notes: 'draft note',
            caseReference: null,
            accountReference: null,
          },
        } as never,
        'feeStatuses',
        [],
      );

      expect(dto.applicationCode).toBe('APP-200');
      expect(dto.lodgementDate).toBe('2025-02-02');
      expect(dto.notes).toBe('persisted note');
      expect(dto.applicant?.person?.name?.firstForename).toBe('Jane');
    });
  });
});
