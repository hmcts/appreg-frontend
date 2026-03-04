import { buildEntryCreateDto } from '@entry-create-util/entry-create-mapper';
import { FeeStatus } from '@openapi';
import {
  ApplicationsListEntryFormValue,
  OrganisationFormValue,
  PersonFormValue,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';

function roundTrip<T extends object>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T;
}

function makeBaseFormValue(
  overrides: Partial<ApplicationsListEntryFormValue> = {},
): ApplicationsListEntryFormValue {
  const base: ApplicationsListEntryFormValue = {
    applicantType: 'org',
    applicant: null,
    standardApplicantCode: null,
    applicationCode: 'A001',
    respondent: null,
    numberOfRespondents: null,
    wordingFields: null,
    feeStatuses: null,
    hasOffsiteFee: null,
    lodgementDate: null,
    respondentEntryType: 'organisation',
    courtName: null,
    organisationName: null,
    feeStatus: null,
    feeStatusDate: null,
    paymentRef: null,
    accountReference: null,
    applicationDetails: null,
    resultCode: null,
    mags1Title: null,
    mags1FirstName: null,
    mags1Surname: null,
    mags2Title: null,
    mags2FirstName: null,
    mags2Surname: null,
    mags3Title: null,
    mags3FirstName: null,
    mags3Surname: null,
    officialTitle: null,
    officialFirstName: null,
    officialSurname: null,
    applicationNotes: {
      notes: null,
      caseReference: null,
      accountReference: null,
    },
  };

  return { ...base, ...overrides };
}

function makeBlankPerson(): PersonFormValue {
  return {
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
}

function makeBlankOrganisation(): OrganisationFormValue {
  return {
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
}

describe('buildEntryCreateDto', () => {
  it('omits applicant/respondent when they are not meaningfully populated', () => {
    const formValue = makeBaseFormValue({
      applicantType: 'org',
      respondentEntryType: 'organisation',
    });

    const person = makeBlankPerson();
    const organisation = makeBlankOrganisation();
    const respondentPerson = makeBlankPerson();
    const respondentOrganisation = makeBlankOrganisation();

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect(payload['applicationCode']).toBe('A001');
    expect('applicant' in payload).toBe(false);
    expect('respondent' in payload).toBe(false);
  });

  it('includes applicant.organisation with trimmed name and prunes blank nested contact fields', () => {
    const formValue = makeBaseFormValue({
      applicantType: 'org',
      respondentEntryType: 'organisation',
      applicationCode: 'C123',
    });

    const person = makeBlankPerson();
    const organisation: OrganisationFormValue = {
      ...makeBlankOrganisation(),
      name: '  ACME LTD  ',
      addressLine1: '  10 Downing St  ',
      emailAddress: '   ',
    };

    const respondentPerson = makeBlankPerson();
    const respondentOrganisation = makeBlankOrganisation();

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect('applicant' in payload).toBe(true);

    const applicant = payload['applicant'] as Record<string, unknown>;
    expect('organisation' in applicant).toBe(true);

    const org = applicant['organisation'] as Record<string, unknown>;
    expect(org['name']).toBe('ACME LTD');

    const contact = org['contactDetails'] as Record<string, unknown>;
    expect(contact['addressLine1']).toBe('10 Downing St');
    expect('email' in contact).toBe(false);
  });

  it('omits respondent when only whitespace strings are provided', () => {
    const formValue = makeBaseFormValue({
      applicationCode: 'X001',
      respondentEntryType: 'organisation',
    });

    const person = makeBlankPerson();
    const organisation = makeBlankOrganisation();

    const respondentPerson = makeBlankPerson();
    const respondentOrganisation: OrganisationFormValue = {
      ...makeBlankOrganisation(),
      name: '   ',
      addressLine1: '   ',
    };

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect('respondent' in payload).toBe(false);
  });

  it('keeps both applicant and respondent when both are populated', () => {
    const formValue = makeBaseFormValue({
      applicantType: 'person',
      respondentEntryType: 'organisation',
      applicationCode: 'Z999',
    });

    // applicant person
    const person: PersonFormValue = {
      ...makeBlankPerson(),
      title: 'Mr',
      firstName: ' John ',
      surname: ' Smith ',
      addressLine1: '  1 Road  ',
    };

    const organisation = makeBlankOrganisation(); // applicant org unused here

    // respondent organisation (IMPORTANT: populate respondent org form, not applicant org form)
    const respondentPerson = makeBlankPerson();
    const respondentOrganisation: OrganisationFormValue = {
      ...makeBlankOrganisation(),
      name: ' Org ',
      addressLine1: ' Addr ',
    };

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect('applicant' in payload).toBe(true);
    expect('respondent' in payload).toBe(true);

    const applicant = payload['applicant'] as Record<string, unknown>;
    const resp = payload['respondent'] as Record<string, unknown>;

    expect(applicant['person']).toBeDefined();
    expect(resp['organisation']).toBeDefined();
  });

  it('builds feeStatuses when any fee field is provided', () => {
    const formValue = makeBaseFormValue({
      applicationCode: 'F001',
      feeStatus: 'Paid',
      feeStatusDate: '2025-01-15',
      paymentRef: 'ABC123',
    });

    const person = makeBlankPerson();
    const organisation = makeBlankOrganisation();
    const respondentPerson = makeBlankPerson();
    const respondentOrganisation = makeBlankOrganisation();

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    const fs = payload['feeStatuses'] as
      | Array<Record<string, unknown>>
      | undefined;
    expect(Array.isArray(fs)).toBe(true);
    expect(fs?.length).toBe(1);

    const first = fs?.[0] ?? {};
    expect(first['paymentStatus']).toBe('Paid');
    expect(first['statusDate']).toBe('2025-01-15');
    expect(first['paymentReference']).toBe('ABC123');
  });

  it('omits feeStatuses when all fee fields are empty', () => {
    const formValue = makeBaseFormValue({
      feeStatus: null,
      feeStatusDate: null,
      paymentRef: null,
    });

    const person = makeBlankPerson();
    const organisation = makeBlankOrganisation();
    const respondentPerson = makeBlankPerson();
    const respondentOrganisation = makeBlankOrganisation();

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect('feeStatuses' in payload).toBe(false);
  });

  it('builds wordingFields from courtName and organisationName when present', () => {
    const formValue = makeBaseFormValue({
      courtName: '  Court A ',
      organisationName: '  Org B ',
    });

    const person = makeBlankPerson();
    const organisation = makeBlankOrganisation();
    const respondentPerson = makeBlankPerson();
    const respondentOrganisation = makeBlankOrganisation();

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect(payload['wordingFields']).toEqual([
      { key: 'courtName', value: 'Court A' },
      { key: 'organisationName', value: 'Org B' },
    ]);
  });

  it('omits wordingFields when courtName and organisationName are empty/whitespace', () => {
    const formValue = makeBaseFormValue({
      courtName: '   ',
      organisationName: '',
    });

    const person = makeBlankPerson();
    const organisation = makeBlankOrganisation();
    const respondentPerson = makeBlankPerson();
    const respondentOrganisation = makeBlankOrganisation();

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect('wordingFields' in payload).toBe(false);
  });

  it('omits notes fields when all note values are empty', () => {
    const formValue = makeBaseFormValue({
      applicationNotes: {
        notes: null,
        caseReference: '',
        accountReference: '   ',
      },
    });

    const person = makeBlankPerson();
    const organisation = makeBlankOrganisation();
    const respondentPerson = makeBlankPerson();
    const respondentOrganisation = makeBlankOrganisation();

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect('notes' in payload).toBe(false);
    expect('caseReference' in payload).toBe(false);
    expect('accountNumber' in payload).toBe(false);
  });

  it('includes flattened notes fields when any note value is provided', () => {
    const formValue = makeBaseFormValue({
      applicationNotes: {
        notes: '  Some note ',
        caseReference: '   ',
        accountReference: null,
      },
    });

    const person = makeBlankPerson();
    const organisation = makeBlankOrganisation();
    const respondentPerson = makeBlankPerson();
    const respondentOrganisation = makeBlankOrganisation();

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect(payload['notes']).toBe('Some note');
    expect('caseReference' in payload).toBe(false);
    expect('accountNumber' in payload).toBe(false);
  });

  it('sets standardApplicantCode when applicantType is "standard" and omits applicant', () => {
    const formValue = makeBaseFormValue({
      applicantType: 'standard',
      standardApplicantCode: '  STD-123 ',
    });

    const person = makeBlankPerson();
    const organisation = makeBlankOrganisation();
    const respondentPerson = makeBlankPerson();
    const respondentOrganisation = makeBlankOrganisation();

    const dto = buildEntryCreateDto(
      formValue,
      person,
      organisation,
      respondentPerson,
      respondentOrganisation,
    );
    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    expect(payload['standardApplicantCode']).toBe('STD-123');
    expect('applicant' in payload).toBe(false);
  });

  it('returns existing feeStatuses when fee table already contains rows (does not rebuild from single fee fields)', () => {
    const existingFees: FeeStatus[] = [
      {
        paymentStatus: 'Paid',
        statusDate: '2025-02-01',
        paymentReference: 'KEEP-ME',
      } as unknown as FeeStatus,
      {
        paymentStatus: 'Due',
        statusDate: '2025-02-02',
        paymentReference: 'KEEP-ME-2',
      } as unknown as FeeStatus,
    ];

    const formValue = makeBaseFormValue({
      applicationCode: 'F002',
      feeStatuses: existingFees,
      // these should be ignored when feeStatuses already populated
      feeStatus: 'Remitted',
      feeStatusDate: '2030-01-01',
      paymentRef: 'SHOULD-NOT-APPEAR',
    });

    const dto = buildEntryCreateDto(
      formValue,
      makeBlankPerson(),
      makeBlankOrganisation(),
      makeBlankPerson(),
      makeBlankOrganisation(),
    );

    const payload = roundTrip(dto as unknown as Record<string, unknown>);

    const fs = payload['feeStatuses'] as
      | Array<Record<string, unknown>>
      | undefined;

    expect(Array.isArray(fs)).toBe(true);
    expect(fs?.length).toBe(2);

    expect(fs?.[0]).toEqual(
      expect.objectContaining({
        paymentStatus: 'Paid',
        statusDate: '2025-02-01',
        paymentReference: 'KEEP-ME',
      }),
    );

    expect(fs?.[1]).toEqual(
      expect.objectContaining({
        paymentStatus: 'Due',
        statusDate: '2025-02-02',
        paymentReference: 'KEEP-ME-2',
      }),
    );

    // prove it did not rebuild from single fee fields
    expect(fs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          paymentStatus: 'Remitted',
          statusDate: '2030-01-01',
          paymentReference: 'SHOULD-NOT-APPEAR',
        }),
      ]),
    );
  });
});
