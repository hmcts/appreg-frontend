import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import {
  EntryGetDetailDto,
  Organisation,
  PaymentStatus,
  Person,
} from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';

describe('ApplicationListEntryFormService', () => {
  let service: ApplicationListEntryFormService;

  const makeDetail = (
    overrides: Partial<EntryGetDetailDto> = {},
  ): EntryGetDetailDto => ({
    id: 'entry-1',
    listId: 'list-1',
    applicationCode: 'APP-100',
    numberOfRespondents: 1,
    lodgementDate: '2026-04-20',
    ...overrides,
  });

  const makePerson = (overrides: Partial<Person> = {}): Person => ({
    name: {
      title: 'Dr',
      firstName: 'Alex',
      middleName: 'Bee',
      lastName: 'Carter',
    },
    contactDetails: {
      addressLine1: '1 Person Street',
      postcode: 'AB12 3CD',
      email: 'alex@example.test',
    },
    ...overrides,
  });

  const makeOrganisation = (
    overrides: Partial<Organisation> = {},
  ): Organisation => ({
    name: 'Acme Ltd',
    contactDetails: {
      addressLine1: '1 Organisation Street',
      postcode: 'ZZ1 1ZZ',
      email: 'office@example.test',
    },
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [ApplicationListEntryFormService],
    });

    service = TestBed.inject(ApplicationListEntryFormService);
  });

  it('creates a respondent person form with dob control without adding dob to applicant person form', () => {
    const forms = service.createForms();

    expect('dob' in forms.personForm.controls).toBe(false);
    expect('dob' in forms.respondentPersonForm.controls).toBe(true);
    expect(forms.respondentPersonForm.getRawValue()).toMatchObject({
      dob: null,
    });
  });

  it('hydrates respondent person dob from dto and leaves the form clean', () => {
    const forms = service.createForms();

    forms.respondentPersonForm.markAsDirty();

    service.hydrateFromDto(
      {
        applicationCode: 'APP-100',
        lodgementDate: '2026-04-20',
        respondent: {
          person: {
            name: {
              firstName: 'Jane',
              lastName: 'Doe',
            },
            dateOfBirth: '1990-02-03',
            contactDetails: {
              addressLine1: '1 Street',
            },
          },
        },
      } as EntryGetDetailDto,
      forms,
    );

    expect(forms.form.controls.respondentEntryType.value).toBe('person');
    expect(forms.respondentPersonForm.getRawValue()).toMatchObject({
      firstName: 'Jane',
      surname: 'Doe',
      dob: '1990-02-03',
    });
    expect(forms.respondentPersonForm.dirty).toBe(false);
  });

  it('defaults respondent entry type to person when dto has no respondent', () => {
    const forms = service.createForms();

    forms.form.controls.respondentEntryType.setValue('organisation');

    service.hydrateFromDto(
      {
        applicationCode: 'APP-100',
        lodgementDate: '2026-04-20',
        respondent: null,
      } as unknown as EntryGetDetailDto,
      forms,
    );

    expect(forms.form.controls.respondentEntryType.value).toBe('person');
    expect(forms.respondentPersonForm.getRawValue()).toMatchObject({
      firstName: '',
      surname: null,
      dob: null,
      addressLine1: '',
    });
    expect(forms.respondentOrganisationForm.getRawValue()).toMatchObject({
      name: '',
      addressLine1: '',
    });
    expect(forms.respondentPersonForm.dirty).toBe(false);
    expect(forms.respondentOrganisationForm.dirty).toBe(false);
  });

  it('createCivilFeeForm reuses the fee controls from the main form', () => {
    const forms = service.createForms();
    const civilFeeForm = service.createCivilFeeForm(forms);

    civilFeeForm.controls.feeStatus.setValue(PaymentStatus.REMITTED);
    civilFeeForm.controls.feeStatusDate.setValue('2026-05-01');
    civilFeeForm.controls.paymentRef.setValue('REF-001');

    expect(forms.form.controls.feeStatus.value).toBe(PaymentStatus.REMITTED);
    expect(forms.form.controls.feeStatusDate.value).toBe('2026-05-01');
    expect(forms.form.controls.paymentRef.value).toBe('REF-001');
    expect(civilFeeForm.controls.feeStatuses).toBe(
      forms.form.controls.feeStatuses,
    );
  });

  it('hydrates a standard applicant code and resets applicant subforms', () => {
    const forms = service.createForms();

    forms.personForm.patchValue({
      firstName: 'Old',
      surname: 'Person',
      addressLine1: 'Old Address',
    });
    forms.organisationForm.patchValue({
      name: 'Old Org',
      addressLine1: 'Old Org Address',
    });

    const result = service.hydrateFromDto(
      makeDetail({
        standardApplicantCode: ' STD-123 ',
      }),
      forms,
    );

    expect(result).toEqual({
      applicantType: 'standard',
      selectedStandardApplicantCode: 'STD-123',
    });
    expect(forms.form.controls.applicantType.value).toBe('standard');
    expect(forms.form.controls.standardApplicantCode.value).toBe('STD-123');
    expect(forms.personForm.getRawValue()).toMatchObject({
      firstName: '',
      surname: null,
      addressLine1: '',
    });
    expect(forms.organisationForm.getRawValue()).toMatchObject({
      name: '',
      addressLine1: '',
    });
    expect(forms.personForm.dirty).toBe(false);
    expect(forms.organisationForm.dirty).toBe(false);
  });

  it('hydrates applicant person details and clears standard applicant state', () => {
    const forms = service.createForms();

    forms.form.controls.standardApplicantCode.setValue('OLD-CODE');
    forms.personForm.markAsDirty();
    forms.organisationForm.markAsDirty();

    const result = service.hydrateFromDto(
      makeDetail({
        applicant: {
          person: makePerson(),
        },
      }),
      forms,
    );

    expect(result).toEqual({
      applicantType: 'person',
      selectedStandardApplicantCode: null,
    });
    expect(forms.form.controls.applicantType.value).toBe('person');
    expect(forms.form.controls.standardApplicantCode.value).toBeNull();
    expect(forms.personForm.getRawValue()).toMatchObject({
      title: 'dr',
      firstName: 'Alex',
      middleNames: 'Bee',
      surname: 'Carter',
      addressLine1: '1 Person Street',
      postcode: 'AB12 3CD',
      emailAddress: 'alex@example.test',
    });
    expect(forms.organisationForm.getRawValue()).toMatchObject({
      name: '',
      addressLine1: '',
    });
    expect(forms.personForm.dirty).toBe(false);
    expect(forms.organisationForm.dirty).toBe(false);
  });

  it('hydrates applicant organisation details and clears standard applicant state', () => {
    const forms = service.createForms();

    forms.form.controls.standardApplicantCode.setValue('OLD-CODE');
    forms.personForm.markAsDirty();
    forms.organisationForm.markAsDirty();

    const result = service.hydrateFromDto(
      makeDetail({
        applicant: {
          organisation: makeOrganisation({
            name: 'Applicant Org',
            contactDetails: {
              addressLine1: 'Applicant Org Address',
              phone: '020 7946 0999',
            },
          }),
        },
      }),
      forms,
    );

    expect(result).toEqual({
      applicantType: 'org',
      selectedStandardApplicantCode: null,
    });
    expect(forms.form.controls.applicantType.value).toBe('org');
    expect(forms.form.controls.standardApplicantCode.value).toBeNull();
    expect(forms.personForm.getRawValue()).toMatchObject({
      firstName: '',
      surname: null,
      addressLine1: '',
    });
    expect(forms.organisationForm.getRawValue()).toMatchObject({
      name: 'Applicant Org',
      addressLine1: 'Applicant Org Address',
      phoneNumber: '020 7946 0999',
    });
    expect(forms.personForm.dirty).toBe(false);
    expect(forms.organisationForm.dirty).toBe(false);
  });

  it('hydrates respondent organisation details and leaves the form clean', () => {
    const forms = service.createForms();

    forms.respondentOrganisationForm.markAsDirty();

    service.hydrateFromDto(
      makeDetail({
        respondent: {
          organisation: makeOrganisation({
            name: 'Respondent Org',
            contactDetails: {
              addressLine1: 'Respondent Org Address',
              mobile: '07700900900',
            },
          }),
        },
      }),
      forms,
    );

    expect(forms.form.controls.respondentEntryType.value).toBe('organisation');
    expect(forms.respondentOrganisationForm.getRawValue()).toMatchObject({
      name: 'Respondent Org',
      addressLine1: 'Respondent Org Address',
      mobileNumber: '07700900900',
    });
    expect(forms.respondentOrganisationForm.dirty).toBe(false);
  });

  it('buildUpdateDto syncs selected standard applicant code and uses current form values', () => {
    const forms = service.createForms();
    const detail = makeDetail({
      applicant: {
        person: makePerson({
          name: {
            firstForename: 'Old',
            surname: 'Applicant',
          },
        }),
      },
      respondent: {
        person: {
          name: {
            firstForename: 'Old',
            surname: 'Respondent',
          },
          contactDetails: {
            addressLine1: 'Old Respondent Address',
          },
        },
      },
    });

    forms.form.patchValue({
      applicantType: 'standard',
      applicationCode: 'APP-200',
      lodgementDate: '2026-04-21',
      numberOfRespondents: 2,
      respondentEntryType: 'organisation',
      applicationNotes: {
        caseReference: 'CASE123',
        accountReference: 'ACCT123',
        notes: 'Updated notes',
      },
    });
    forms.respondentOrganisationForm.patchValue({
      name: 'Updated Respondent Org',
      addressLine1: 'Updated Respondent Address',
    });

    const dto = service.buildUpdateDto(detail, forms, ' STD-99 ');

    expect(forms.form.controls.standardApplicantCode.value).toBe('STD-99');
    expect(dto).toEqual(
      expect.objectContaining({
        standardApplicantCode: 'STD-99',
        applicationCode: 'APP-200',
        numberOfRespondents: 2,
        caseReference: 'CASE123',
        accountNumber: 'ACCT123',
        notes: 'Updated notes',
        respondent: {
          organisation: expect.objectContaining({
            name: 'Updated Respondent Org',
            contactDetails: expect.objectContaining({
              addressLine1: 'Updated Respondent Address',
            }),
          }),
        },
      }),
    );
    expect(dto.applicant).toBeUndefined();
  });

  it('buildCreateDto syncs selected standard applicant code and builds from all form sections', () => {
    const forms = service.createForms();

    forms.form.patchValue({
      applicantType: 'person',
      applicationCode: 'APP-300',
      lodgementDate: '2026-04-22',
      numberOfRespondents: 3,
      respondentEntryType: 'person',
      feeStatus: PaymentStatus.PAID,
      feeStatusDate: '2026-04-23',
      paymentRef: 'PAY-123',
    });
    forms.personForm.patchValue({
      firstName: 'Applicant',
      surname: 'Person',
      addressLine1: 'Applicant Address',
    });
    forms.respondentPersonForm.patchValue({
      firstName: 'Respondent',
      surname: 'Person',
      dob: '1980-01-02',
      addressLine1: 'Respondent Address',
    });

    const dto = service.buildCreateDto(forms, ' STD-IGNORED ');

    expect(forms.form.controls.standardApplicantCode.value).toBe('STD-IGNORED');
    expect(dto).toEqual(
      expect.objectContaining({
        applicationCode: 'APP-300',
        numberOfRespondents: 3,
        lodgementDate: '2026-04-22',
        applicant: {
          person: expect.objectContaining({
            name: expect.objectContaining({
              firstName: 'Applicant',
              lastName: 'Person',
            }),
            contactDetails: expect.objectContaining({
              addressLine1: 'Applicant Address',
            }),
          }),
        },
        respondent: {
          person: expect.objectContaining({
            dateOfBirth: '1980-01-02',
            name: expect.objectContaining({
              firstName: 'Respondent',
              lastName: 'Person',
            }),
            contactDetails: expect.objectContaining({
              addressLine1: 'Respondent Address',
            }),
          }),
        },
        feeStatuses: [
          {
            paymentStatus: PaymentStatus.PAID,
            statusDate: '2026-04-23',
            paymentReference: 'PAY-123',
          },
        ],
      }),
    );
    expect(dto.standardApplicantCode).toBeUndefined();
  });

  it('onApplicantTypeChanged clears standard code and resets applicant forms for non-standard applicants', () => {
    const forms = service.createForms();

    forms.form.controls.standardApplicantCode.setValue('STD-1');
    forms.personForm.patchValue({
      firstName: 'Old',
      surname: 'Person',
      addressLine1: 'Old Address',
    });
    forms.organisationForm.patchValue({
      name: 'Old Org',
      addressLine1: 'Old Org Address',
    });
    forms.personForm.markAsDirty();
    forms.organisationForm.markAsDirty();

    service.onApplicantTypeChanged(forms, 'person');

    expect(forms.form.controls.standardApplicantCode.value).toBeNull();
    expect(forms.personForm.getRawValue()).toMatchObject({
      firstName: '',
      surname: null,
      addressLine1: '',
    });
    expect(forms.organisationForm.getRawValue()).toMatchObject({
      name: '',
      addressLine1: '',
    });
    expect(forms.personForm.dirty).toBe(false);
    expect(forms.organisationForm.dirty).toBe(false);
  });

  it('resetSectionsOnApplicationCodeChange clears wording and respondent sections', () => {
    const forms = service.createForms();

    forms.form.patchValue({
      wordingFields: [{ key: 'courtName', value: 'Court A' }],
      respondent: {
        organisation: makeOrganisation({ name: 'Respondent Org' }),
      },
      numberOfRespondents: 2,
    });
    forms.respondentPersonForm.patchValue({
      firstName: 'Respondent',
      surname: 'Person',
      addressLine1: 'Respondent Address',
    });
    forms.respondentOrganisationForm.patchValue({
      name: 'Respondent Org',
      addressLine1: 'Respondent Org Address',
    });
    forms.respondentPersonForm.markAsDirty();
    forms.respondentOrganisationForm.markAsDirty();

    service.resetSectionsOnApplicationCodeChange(forms);

    expect(forms.form.controls.wordingFields.value).toBeNull();
    expect(forms.form.controls.respondent.value).toBeNull();
    expect(forms.form.controls.numberOfRespondents.value).toBeNull();
    expect(forms.respondentPersonForm.getRawValue()).toMatchObject({
      firstName: '',
      surname: null,
      dob: null,
      addressLine1: '',
    });
    expect(forms.respondentOrganisationForm.getRawValue()).toMatchObject({
      name: '',
      addressLine1: '',
    });
    expect(forms.respondentPersonForm.dirty).toBe(false);
    expect(forms.respondentOrganisationForm.dirty).toBe(false);
  });

  it('syncApplicantTypeState enables standard applicant code only for standard applicants', () => {
    const forms = service.createForms();
    const codeControl = forms.form.controls.standardApplicantCode;

    service.syncApplicantTypeState(forms, 'person');
    expect(codeControl.disabled).toBe(true);

    service.syncApplicantTypeState(forms, 'standard');
    expect(codeControl.enabled).toBe(true);
  });
});
