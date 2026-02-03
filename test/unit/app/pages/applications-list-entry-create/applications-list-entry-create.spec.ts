import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { ApplicationsListEntryCreate } from '@components/applications-list-entry-create/applications-list-entry-create.component';
import { buildEntryCreateDto } from '@components/applications-list-entry-create/util/entry-create-mapper';
import {
  compactStrings,
  toOptionalTrimmed,
} from '@components/applications-list-entry-create/util/helpers';
import { ApplicationListEntriesApi } from '@openapi';

function roundTrip<T extends object>(o: T): T {
  // NOTE: Sonar complains, but structuredClone() will fail for some environments,
  // so we keep JSON round-trip here.
  return JSON.parse(JSON.stringify(o));
}

describe('ApplicationsListEntryCreate (payload + helpers)', () => {
  let fixture: ComponentFixture<ApplicationsListEntryCreate>;
  let component: ApplicationsListEntryCreate;

  function build(): unknown {
    return buildEntryCreateDto(
      component.form.getRawValue(),
      component.personForm.getRawValue(),
      component.organisationForm.getRawValue(),
      component.forms.respondentPersonForm.getRawValue(),
      component.forms.respondentOrganisationForm.getRawValue(),
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryCreate],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ApplicationListEntriesApi,
          useValue: { createApplicationListEntry: jest.fn() },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'LIST-1' } } },
        },
      ],
    })
      .overrideTemplate(ApplicationsListEntryCreate, '')
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationsListEntryCreate);
    component = fixture.componentInstance;

    // If the component ever moves initialisation into ngOnInit, this keeps the spec stable.
    fixture.detectChanges();
  });

  it('payload: omits applicant/respondent when empty', () => {
    component.form.patchValue({
      applicationCode: 'A001',
      applicantType: 'org',
      respondentEntryType: 'organisation',
    });

    const dto = build();
    expect(dto && typeof dto === 'object').toBe(true);

    const payload = roundTrip(dto as Record<string, unknown>);
    expect(payload['applicationCode']).toBe('A001');
    expect('applicant' in payload).toBe(false);
    expect('respondent' in payload).toBe(false);
  });

  it('payload: includes applicant.organisation with trimmed name; prunes blank nested fields', () => {
    component.form.patchValue({
      applicationCode: 'C123',
      applicantType: 'org',
      respondentEntryType: 'organisation',
    });
    component.organisationForm.patchValue({
      name: '  ACME LTD  ',
      addressLine1: '  10 Downing St  ',
      emailAddress: '   ',
    });

    const payload = roundTrip(build() as Record<string, unknown>);
    expect('applicant' in payload).toBe(true);

    const applicant = payload['applicant'] as Record<string, unknown>;
    expect('organisation' in applicant).toBe(true);

    const org = applicant['organisation'] as Record<string, unknown>;
    expect(org['name']).toBe('ACME LTD');

    const contact = org['contactDetails'] as Record<string, unknown>;
    expect(contact['addressLine1']).toBe('10 Downing St');
    expect('email' in contact).toBe(false);
  });

  it('payload: omits respondent when only whitespace strings are provided', () => {
    component.form.patchValue({
      applicationCode: 'X001',
      respondentEntryType: 'organisation',
    });
    component.personForm.reset();
    component.forms.respondentOrganisationForm.reset();
    component.forms.respondentOrganisationForm.patchValue({
      name: '   ',
      addressLine1: '   ',
    });

    const payload = roundTrip(build() as Record<string, unknown>);
    expect('respondent' in payload).toBe(false);
  });

  it('payload: keeps both applicant and respondent when both are meaningfully populated', () => {
    component.form.patchValue({
      applicationCode: 'Z999',
      applicantType: 'person',
      respondentEntryType: 'organisation',
    });

    // applicant
    component.personForm.patchValue({
      title: 'Mr',
      firstName: ' John ',
      middleNames: '',
      surname: ' Smith ',
      addressLine1: '  1 Road  ',
    });

    // respondent (organisation)
    component.forms.respondentOrganisationForm.patchValue({
      name: ' Org ',
      addressLine1: ' Addr ',
    });

    const payload = roundTrip(build() as Record<string, unknown>);
    expect('applicant' in payload).toBe(true);
    expect('respondent' in payload).toBe(true);
  });

  it('payload: uses standardApplicantCode and omits applicant when applicantType is standard', () => {
    component.form.patchValue({
      applicationCode: 'S001',
      applicantType: 'standard',
      standardApplicantCode: '  SA-999  ',
    });

    const payload = roundTrip(build() as Record<string, unknown>);
    expect(payload['applicationCode']).toBe('S001');
    expect(payload['standardApplicantCode']).toBe('SA-999');
    expect('applicant' in payload).toBe(false);
  });

  it('payload: exposes feeStatuses when fee controls are set', () => {
    component.form.patchValue({
      applicationCode: 'F001',
      feeStatus: 'Paid',
      feeStatusDate: '2025-01-15',
      paymentRef: 'ABC123',
    });

    const payload = roundTrip(build() as Record<string, unknown>);
    const fs = payload['feeStatuses'] as
      | Array<Record<string, unknown>>
      | undefined;

    expect(Array.isArray(fs)).toBe(true);
    expect(fs?.length).toBe(1);
    expect(fs?.[0]?.['paymentStatus']).toBe('Paid');
    expect(fs?.[0]?.['statusDate']).toBe('2025-01-15');
    expect(fs?.[0]?.['paymentReference']).toBe('ABC123');
  });

  it('payload: omits notes / caseReference / accountNumber when applicationNotes are empty', () => {
    component.form.patchValue({
      applicationCode: 'N001',
      applicationNotes: {
        notes: null,
        caseReference: null,
        accountReference: null,
      },
    });

    const payload = roundTrip(build() as Record<string, unknown>);
    expect('notes' in payload).toBe(false);
    expect('caseReference' in payload).toBe(false);
    expect('accountNumber' in payload).toBe(false);
  });

  it('payload: includes flattened notes fields when any applicationNotes value is populated', () => {
    component.form.patchValue({
      applicationCode: 'N002',
      applicationNotes: {
        notes: '  some notes  ',
        caseReference: '  CR-123  ',
        accountReference: '  AC-999  ',
      },
    });

    const payload = roundTrip(build() as Record<string, unknown>);
    expect(payload['notes']).toBe('some notes');
    expect(payload['caseReference']).toBe('CR-123');
    expect(payload['accountNumber']).toBe('AC-999');
  });

  it('helpers: toOptionalTrimmed and compactStrings', () => {
    expect(toOptionalTrimmed('  x  ')).toBe('x');
    expect(toOptionalTrimmed('   ')).toBeUndefined();

    const compact = compactStrings(['  a', ' ', null, undefined, 'b  ']);
    expect(compact).toEqual(['a', 'b']);
  });
});
