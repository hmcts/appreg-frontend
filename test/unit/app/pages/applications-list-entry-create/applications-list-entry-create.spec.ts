import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { ApplicationsListEntryCreate } from '../../../../../src/app/pages/applications-list-entry-create/applications-list-entry-create';
import { ApplicationListEntriesApi } from '../../../../../src/generated/openapi';

function roundTrip<T extends object>(o: T): T {
  return structuredClone(o);
}

describe('ApplicationsListEntryCreate (payload + helpers)', () => {
  let fixture: ComponentFixture<ApplicationsListEntryCreate>;
  let component: ApplicationsListEntryCreate;

  function build(): unknown {
    const obj = component as unknown as { buildEntryCreateDto: () => unknown };
    return obj.buildEntryCreateDto();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryCreate],
      providers: [
        provideRouter([]),
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
    expect(
      (payload as Record<'applicationCode', unknown>).applicationCode,
    ).toBe('A001');
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

    const applicant = (payload as Record<'applicant', unknown>)
      .applicant as Record<string, unknown>;
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
    component.organisationForm.reset();
    component.organisationForm.patchValue({
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

    component.personForm.patchValue({
      title: 'Mr',
      firstName: ' John ',
      middleNames: '',
      surname: ' Smith ',
      addressLine1: '  1 Road  ',
    });

    component.organisationForm.patchValue({
      name: ' Org ',
      addressLine1: ' Addr ',
    });

    const payload = roundTrip(build() as Record<string, unknown>);
    expect('applicant' in payload).toBe(true);
    expect('respondent' in payload).toBe(true);
  });

  it('payload: exposes feeStatuses when fee controls are set', () => {
    component.form.patchValue({
      applicationCode: 'F001',
      feeStatus: 'Paid',
      feeStatusDate: '2025-01-15',
      paymentRef: 'ABC123',
    });

    const payload = roundTrip(build() as Record<string, unknown>);
    const fs = (payload as Record<'feeStatuses', unknown>).feeStatuses as
      | Array<Record<string, unknown>>
      | undefined;
    expect(Array.isArray(fs)).toBe(true);
    expect(fs?.length).toBe(1);
    const first = fs?.[0] as Record<string, unknown>;
    expect(first['paymentStatus']).toBe('Paid');
    expect(first['statusDate']).toBe('2025-01-15');
    expect(first['paymentReference']).toBe('ABC123');
  });

  it('helpers: toOptionalTrimmed and compactStrings', () => {
    expect(component.toOptionalTrimmed('  x  ')).toBe('x');
    expect(component.toOptionalTrimmed('   ')).toBeUndefined();

    const compact = component.compactStrings([
      '  a',
      ' ',
      null,
      undefined,
      'b  ',
    ]);
    expect(compact).toEqual(['a', 'b']);
  });
});
