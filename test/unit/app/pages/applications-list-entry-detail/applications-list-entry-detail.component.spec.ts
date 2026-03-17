// applications-list-entry-detail.spec.ts

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { Observable, of } from 'rxjs';

import { ApplicationsListEntryDetail } from '@components/applications-list-entry-detail/applications-list-entry-detail.component';
import { buildOfficialsFromFormValue, officialsToFormPatch } from '@components/applications-list-entry-detail/util/entry-detail.form';
import {
  ApplicationCodeGetDetailDto,
  ApplicationCodePage,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  FeeStatus,
  GetApplicationCodesRequestParams,
  OfficialType,
  PaymentStatus,
  UpdateApplicationListEntryRequestParams,
} from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import { ApplicationsListEntryFormValue } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import type { AddFeeDetailsPayload } from '@shared-types/civil-fee/civil-fee';
import * as civilFeeUtils from '@util/civil-fee-utils';

type GetCodesFn = (
  params: GetApplicationCodesRequestParams,
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<ApplicationCodePage>;

type GetEntryFn = (
  params: { listId: string; entryId: string },
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<EntryGetDetailDto>;

type UpdateEntryFn = (
  params: UpdateApplicationListEntryRequestParams,
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<unknown>;

type GetCodeDetailFn = (
  params: { code: string; date: string },
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<ApplicationCodeGetDetailDto>;

type PaymentRefApplier = {
  applyPaymentRefReturn: (updatedRowId: string, newRef: string) => void;
};

describe('ApplicationsListEntryDetail', () => {
  let fixture: ComponentFixture<ApplicationsListEntryDetail>;
  let component: ApplicationsListEntryDetail;

  let mockGetApplicationCodes: jest.MockedFunction<GetCodesFn>;
  let mockGetApplicationCodeByCodeAndDate: jest.MockedFunction<GetCodeDetailFn>;
  let mockGetApplicationListEntry: jest.MockedFunction<GetEntryFn>;
  let mockUpdateApplicationListEntry: jest.MockedFunction<UpdateEntryFn>;

  const routeStub: ActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({
        listId: 'AL-1',
        entryId: 'EN-1',
        id: 'AL-1',
      }),
      queryParamMap: convertToParamMap({ entryId: 'EN-1', appListId: 'AL-1' }),
    },
  } as ActivatedRoute;

  beforeEach(async () => {
    jest.resetAllMocks();

    (
      routeStub.snapshot as unknown as {
        paramMap: ReturnType<typeof convertToParamMap>;
      }
    ).paramMap = convertToParamMap({
      listId: 'AL-1',
      entryId: 'EN-1',
      id: 'AL-1',
    });
    (
      routeStub.snapshot as unknown as {
        queryParamMap: ReturnType<typeof convertToParamMap>;
      }
    ).queryParamMap = convertToParamMap({
      entryId: 'EN-1',
      appListId: 'AL-1',
    });

    mockGetApplicationCodes = jest.fn();
    mockGetApplicationCodeByCodeAndDate = jest.fn();
    mockGetApplicationListEntry = jest.fn();
    mockUpdateApplicationListEntry = jest.fn();

    mockGetApplicationListEntry.mockReturnValue(
      of({
        lodgementDate: '2025-11-01',
        applicationCode: 'APP-100',
        standardApplicantCode: null,
      } as unknown as EntryGetDetailDto),
    );

    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-100',
        title: 'Loaded title',
        wording: { template: '' },
        bulkRespondentAllowed: false,
        isFeeDue: false,
        requiresRespondent: false,
        feeReference: undefined,
        startDate: '2025-01-01',
        endDate: null,
      } as ApplicationCodeGetDetailDto),
    );

    mockUpdateApplicationListEntry.mockReturnValue(of({}));

    const codesApiMock = {
      getApplicationCodes: mockGetApplicationCodes,
      getApplicationCodeByCodeAndDate: mockGetApplicationCodeByCodeAndDate,
    } as unknown as ApplicationCodesApi;

    const entriesApiMock = {
      getApplicationListEntry: mockGetApplicationListEntry,
      updateApplicationListEntry: mockUpdateApplicationListEntry,
    } as unknown as ApplicationListEntriesApi;

    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryDetail],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ApplicationCodesApi, useValue: codesApiMock },
        { provide: ApplicationListEntriesApi, useValue: entriesApiMock },
        { provide: ActivatedRoute, useValue: routeStub },
        ApplicationListEntryFormService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListEntryDetail);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('hydrates codes section on init: patches lodgementDate, applicationCode, and resolves applicationTitle', () => {
    const raw = component['form'].getRawValue();

    expect(raw.lodgementDate).toBe('2025-11-01');
    expect(component['form'].controls.applicationCode.value).toBe('APP-100');
    expect(component['form'].controls.applicationTitle?.value).toBe(
      'Loaded title',
    );

    expect(mockGetApplicationListEntry).toHaveBeenCalledWith(
      { listId: 'AL-1', entryId: 'EN-1' },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );

    expect(mockGetApplicationCodeByCodeAndDate).toHaveBeenCalledWith(
      { code: 'APP-100', date: '2025-11-01' },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );
  });

  it('shows list-created success banner when listCreated=true query param is present', () => {
    (
      routeStub.snapshot as unknown as {
        queryParamMap: ReturnType<typeof convertToParamMap>;
      }
    ).queryParamMap = convertToParamMap({
      entryId: 'EN-1',
      appListId: 'AL-1',
      listCreated: 'true',
    });

    const freshFixture = TestBed.createComponent(ApplicationsListEntryDetail);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(freshComponent.successBanner?.heading).toBe(
      'Application list entry created',
    );
    expect(freshComponent.successBanner?.body).toBe(
      'The application list entry has been created successfully.',
    );
  });

  it('onCodeSelected calls codes API and patches form when date is provided', () => {
    component['form'].patchValue({ lodgementDate: '' });

    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-1',
        title: 'Title for APP-1',
        wording: { template: '...' },
        bulkRespondentAllowed: false,
        isFeeDue: false,
        requiresRespondent: false,
        feeReference: undefined,
        startDate: '2025-01-01',
        endDate: null,
      } as ApplicationCodeGetDetailDto),
    );

    mockGetApplicationCodeByCodeAndDate.mockClear();

    component.onCodeSelected({ code: 'APP-1', date: '2025-11-01' });

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();

    expect(mockGetApplicationCodeByCodeAndDate).toHaveBeenCalledTimes(1);
    expect(mockGetApplicationCodeByCodeAndDate).toHaveBeenCalledWith(
      { code: 'APP-1', date: '2025-11-01' },
      'body',
      false,
      { transferCache: true },
    );

    expect(component['form'].controls.applicationCode.value).toBe('APP-1');
    expect(component['form'].controls.lodgementDate.value).toBe('2025-11-01');

    expect(component['errorFound']).toBe(false);
  });

  it('onCodeSelected fetches code detail, sets appCodeDetail and resets sections when code changed', () => {
    const resetSectionsSpy = jest.spyOn(
      component['formSvc'],
      'resetSectionsOnApplicationCodeChange',
    );

    component.appCodeDetail = {
      applicationCode: 'OLD-CODE',
    } as ApplicationCodeGetDetailDto;

    component['form'].patchValue({
      respondent: {
        person: {
          name: { firstForename: 'Old', surname: 'Respondent' },
          contactDetails: { addressLine1: '1 Street' },
        },
      },
      numberOfRespondents: 2,
    });
    component['form'].patchValue({ lodgementDate: '2025-11-01' });

    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-7',
        title: 'After update title',
        wording: { template: '... {test} ...' },
        bulkRespondentAllowed: false,
        isFeeDue: false,
        requiresRespondent: false,
        feeReference: undefined,
        startDate: '2025-01-01',
        endDate: null,
      } as ApplicationCodeGetDetailDto),
    );

    component.onCodeSelected({ code: 'APP-7', date: '2025-11-01' });

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();

    expect(component['form'].controls.applicationCode.value).toBe('APP-7');

    expect(component.appCodeDetail?.applicationCode).toBe('APP-7');

    expect(resetSectionsSpy).toHaveBeenCalledWith(component.forms);
  });

  it('onUpdateApplicant uses form service buildUpdateDto and calls update API', () => {
    const formSvc = TestBed.inject(ApplicationListEntryFormService);

    const dto: EntryUpdateDto = {
      lodgementDate: '2025-11-01',
      applicationCode: 'APP-100',
      standardApplicantCode: 'SA-999',
      applicant: undefined,
    } as unknown as EntryUpdateDto;

    jest.spyOn(formSvc, 'buildUpdateDto').mockReturnValue(dto);

    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged('SA-999');
    component['form'].controls.standardApplicantCode.setValue('SA-999', {
      emitEvent: false,
    });

    component.onUpdateApplicant();

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);

    const [params, observe, reportProgress, options] =
      mockUpdateApplicationListEntry.mock.calls[0];

    expect(params).toEqual(
      expect.objectContaining({
        listId: 'AL-1',
        entryId: 'EN-1',
        entryUpdateDto: dto,
      }),
    );

    expect(observe).toBe('body');
    expect(reportProgress).toBe(false);
    expect(options).toEqual(expect.objectContaining({ transferCache: false }));

    expect(component['successBanner']?.heading).toBe('Applicant updated');
  });

  it('onUpdateApplicant (standard) blocks submit when no standard applicant selected (validator-driven)', () => {
    // Make it “standard” but keep selection empty
    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged(null);

    component.onUpdateApplicant();

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();
    expect(component['errorFound']).toBe(true);

    expect(
      component['summaryErrors'].some((e) =>
        /standard applicant/i.test(e.text),
      ),
    ).toBe(true);
  });

  it('onUpdateApplicant blocks submit when respondent organisation is invalid', () => {
    const formSvc = TestBed.inject(ApplicationListEntryFormService);
    jest.spyOn(formSvc, 'buildUpdateDto').mockReturnValue({} as EntryUpdateDto);

    component['form'].patchValue({ respondentEntryType: 'organisation' });
    const orgForm = component['forms'].respondentOrganisationForm;
    const base = orgForm.getRawValue();

    orgForm.reset(
      {
        ...base,
        name: '',
        addressLine1: '',
      },
      { emitEvent: false },
    );

    orgForm.markAllAsTouched();
    orgForm.updateValueAndValidity({ emitEvent: false });

    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged('SA-999');

    component.onUpdateApplicant();

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();
    expect(component['errorFound']).toBe(true);

    expect(
      component['summaryErrors'].some((e) => /organisation name/i.test(e.text)),
    ).toBe(true);
  });

  it('toEntryDetailPatch maps wordingFields to values and preserves other fields', () => {
    const entryUpdateDto = {
      applicationCode: 'APP-200',
      lodgementDate: '2026-01-01',
      wordingFields: [
        { key: 'courtName', value: 'Court A' },
        { key: 'organisationName', value: 'Org B' },
      ],
    } as unknown as EntryUpdateDto;

    const patch = (
      component as unknown as {
        toEntryDetailPatch: (dto: EntryUpdateDto) => Partial<EntryGetDetailDto>;
      }
    ).toEntryDetailPatch(entryUpdateDto);

    expect(patch).toEqual(
      expect.objectContaining({
        applicationCode: 'APP-200',
        lodgementDate: '2026-01-01',
        wordingFields: ['Court A', 'Org B'],
      }),
    );
  });

  it('mergeEntryDetailUpdate applies patch and lets response override', () => {
    component['entryDetail'] = {
      applicationCode: 'APP-100',
      lodgementDate: '2025-11-01',
      wordingFields: ['Old wording'],
      feeStatuses: [],
    } as unknown as EntryGetDetailDto;

    const entryUpdateDto = {
      applicationCode: 'APP-200',
      wordingFields: [{ key: 'courtName', value: 'Court A' }],
      feeStatuses: [],
    } as unknown as EntryUpdateDto;

    const res = {
      applicationCode: 'APP-300',
      respondent: { organisation: { name: 'Org X' } },
    } as Partial<EntryGetDetailDto>;

    (
      component as unknown as {
        mergeEntryDetailUpdate: (
          dto: EntryUpdateDto,
          res: Partial<EntryGetDetailDto> | null | undefined,
        ) => void;
      }
    ).mergeEntryDetailUpdate(entryUpdateDto, res);

    expect(component['entryDetail']?.applicationCode).toBe('APP-300');
    expect(component['entryDetail']?.wordingFields).toEqual(['Court A']);
    expect(component['entryDetail']?.respondent).toEqual(res.respondent);
  });

  it('mergeEntryDetailUpdate uses patch when response is empty', () => {
    component['entryDetail'] = {
      applicationCode: 'APP-100',
      wordingFields: ['Old wording'],
      feeStatuses: [],
    } as unknown as EntryGetDetailDto;

    const entryUpdateDto = {
      applicationCode: 'APP-200',
      wordingFields: [{ key: 'courtName', value: 'Court A' }],
      feeStatuses: [],
    } as unknown as EntryUpdateDto;

    (
      component as unknown as {
        mergeEntryDetailUpdate: (
          dto: EntryUpdateDto,
          res: Partial<EntryGetDetailDto> | null | undefined,
        ) => void;
      }
    ).mergeEntryDetailUpdate(entryUpdateDto, {});

    expect(component['entryDetail']?.applicationCode).toBe('APP-200');
    expect(component['entryDetail']?.wordingFields).toEqual(['Court A']);
  });

  it('onCodeSelected sets isFeeRequired from app-code response isFeeDue', () => {
    component['form'].patchValue({ lodgementDate: '2025-11-01' });

    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-1',
        title: 'Title for APP-1',
        wording: { template: '...' },
        bulkRespondentAllowed: false,
        isFeeDue: true,
        requiresRespondent: false,
        feeReference: undefined,
        startDate: '2025-01-01',
        endDate: null,
      } as ApplicationCodeGetDetailDto),
    );

    component.onCodeSelected({ code: 'APP-1', date: '2025-11-01' });

    expect(component.isFeeRequired).toBe(true);
  });

  it('onAddFeeDetails: when helper returns changed=false, does not call update API', () => {
    const spy = jest
      .spyOn(civilFeeUtils, 'updateFeeStatusesControl')
      .mockReturnValue({ next: [], changed: false });

    const payload: AddFeeDetailsPayload = {
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF1',
    };

    component.onAddFeeDetails(payload);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('onAddFeeDetails: when helper returns changed=true, persists feeStatuses via update API', () => {
    const next: FeeStatus[] = [
      {
        paymentStatus: 'Paid',
        statusDate: '2026-01-10',
        paymentReference: 'REF1',
      } as unknown as FeeStatus,
    ];

    const spy = jest
      .spyOn(civilFeeUtils, 'updateFeeStatusesControl')
      .mockReturnValue({ next, changed: true });

    const payload: AddFeeDetailsPayload = {
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF1',
    };

    component.onAddFeeDetails(payload);

    expect(spy).toHaveBeenCalledTimes(1);

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);
    const call = mockUpdateApplicationListEntry.mock.calls[0];
    const params = call[0];

    expect(params.listId).toBe('AL-1');
    expect(params.entryId).toBe('EN-1');
    expect(params.entryUpdateDto).toEqual(
      expect.objectContaining({
        feeStatuses: next,
      }),
    );

    spy.mockRestore();
  });

  it('applyPaymentRefReturn: when helper returns changed=false, does not call update API', () => {
    const spy = jest
      .spyOn(civilFeeUtils, 'updatePaymentReferenceInFeeStatusesControl')
      .mockReturnValue({ next: [], changed: false });

    const subject = component as unknown as PaymentRefApplier;

    subject.applyPaymentRefReturn('ROW-1', 'NEW');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('applyPaymentRefReturn: when helper returns changed=true, persists feeStatuses via update API', () => {
    const next: FeeStatus[] = [
      {
        paymentStatus: 'Paid',
        statusDate: '2026-01-10',
        paymentReference: 'NEW',
      } as unknown as FeeStatus,
    ];

    const spy = jest
      .spyOn(civilFeeUtils, 'updatePaymentReferenceInFeeStatusesControl')
      .mockReturnValue({ next, changed: true });

    const subject = component as unknown as PaymentRefApplier;
    subject.applyPaymentRefReturn('ROW-1', '  NEW  ');

    expect(spy).toHaveBeenCalledTimes(1);

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);
    const call = mockUpdateApplicationListEntry.mock.calls[0];
    const params = call[0];

    expect(params.listId).toBe('AL-1');
    expect(params.entryId).toBe('EN-1');
    expect(params.entryUpdateDto).toEqual(
      expect.objectContaining({
        feeStatuses: next,
      }),
    );

    spy.mockRestore();
  });

  it('onChildErrors stores resultWording child errors', () => {
    const errors = [{ text: 'Enter a Date in the result wording section' }];

    component.onChildErrors('resultWording', errors);

    expect(component['childErrors'].resultWording).toEqual(errors);
  });

  it('onSubmitResults calls results facade submitResultChanges', () => {
    const updateSpy = jest
      .spyOn(component.resultsFacade, 'submitResultChanges')
      .mockImplementation();

    component.onSubmitResults({
      pendingToCreate: [],
      existingToUpdate: [
        {
          resultId: 'R-1',
          resultCode: 'RC1',
          wordingFields: [{ key: 'Date', value: '2026-03-04' }],
        },
      ],
    });

    expect(updateSpy).toHaveBeenCalledWith(
      'AL-1',
      'EN-1',
      {
        pendingToCreate: [],
        existingToUpdate: [
          {
            resultId: 'R-1',
            resultCode: 'RC1',
            wordingFields: [{ key: 'Date', value: '2026-03-04' }],
          },
        ],
      },
      expect.any(Function),
      expect.any(Function),
    );
  });
});

describe('officials mapping', () => {
  const createFormValue = (
    overrides: Partial<ApplicationsListEntryFormValue> = {},
  ): ApplicationsListEntryFormValue =>
    ({
      applicationTitle: null,
      applicantType: 'person',
      applicant: null,
      standardApplicantCode: null,
      applicationCode: null,
      respondentEntryType: 'person',
      respondent: null,
      numberOfRespondents: null,
      wordingFields: null,
      feeStatuses: null,
      hasOffsiteFee: null,
      feeStatus: null,
      feeStatusDate: null,
      paymentRef: null,
      applicationNotes: {
        notes: null,
        caseReference: null,
        accountReference: null,
      },
      lodgementDate: null,
      courtName: null,
      organisationName: null,
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
      ...overrides,
    }) as ApplicationsListEntryFormValue;

  describe('buildOfficialsFromFormValue', () => {
    it('returns empty object when no magistrate or official names are filled', () => {
      const result = buildOfficialsFromFormValue(createFormValue());

      expect(result).toEqual({});
    });

    it('builds magistrate officials when first name and surname are filled and trims values', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          mags1Title: ' mr ',
          mags1FirstName: ' John ',
          mags1Surname: ' Smith ',
          mags2Title: 'dr',
          mags2FirstName: ' Jane ',
          mags2Surname: ' Doe ',
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.MAGISTRATE,
            title: 'mr',
            forename: 'John',
            surname: 'Smith',
          },
          {
            type: OfficialType.MAGISTRATE,
            title: 'dr',
            forename: 'Jane',
            surname: 'Doe',
          },
        ],
      });
    });

    it('includes a magistrate when only first name is filled', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          mags1FirstName: 'OnlyFirst',
          mags1Surname: null,
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.MAGISTRATE,
            title: undefined,
            forename: 'OnlyFirst',
            surname: undefined,
          },
        ],
      });
    });

    it('includes a magistrate when only surname is filled', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          mags1FirstName: '   ',
          mags1Surname: 'OnlySurname',
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.MAGISTRATE,
            title: undefined,
            forename: undefined,
            surname: 'OnlySurname',
          },
        ],
      });
    });

    it('builds clerk official when official names are filled', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          officialTitle: ' ms ',
          officialFirstName: ' Alice ',
          officialSurname: ' Brown ',
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.CLERK,
            title: 'ms',
            forename: 'Alice',
            surname: 'Brown',
          },
        ],
      });
    });

    it('returns magistrates first and clerk last when both exist', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          mags1FirstName: 'Mag',
          mags1Surname: 'One',
          officialFirstName: 'Clerk',
          officialSurname: 'User',
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.MAGISTRATE,
            title: undefined,
            forename: 'Mag',
            surname: 'One',
          },
          {
            type: OfficialType.CLERK,
            title: undefined,
            forename: 'Clerk',
            surname: 'User',
          },
        ],
      });
    });
  });

  describe('officialsToFormPatch', () => {
    it('returns empty object when officials is undefined', () => {
      expect(officialsToFormPatch(undefined)).toEqual({});
    });

    it('returns empty object when officials is null', () => {
      expect(officialsToFormPatch(null)).toEqual({});
    });

    it('returns empty object when officials is empty', () => {
      expect(officialsToFormPatch([])).toEqual({});
    });

    it('maps magistrates into form slots in order', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.MAGISTRATE,
          title: 'Mr',
          forename: 'John',
          surname: 'Smith',
        },
        {
          type: OfficialType.MAGISTRATE,
          title: 'Mrs',
          forename: 'Jane',
          surname: 'Doe',
        },
      ]);

      expect(result).toEqual(
        expect.objectContaining({
          mags1Title: 'mr',
          mags1FirstName: 'John',
          mags1Surname: 'Smith',
          mags2Title: 'mrs',
          mags2FirstName: 'Jane',
          mags2Surname: 'Doe',
        }),
      );
    });

    it('maps clerk into official fields', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.CLERK,
          title: 'Dr',
          forename: 'Alex',
          surname: 'Taylor',
        },
      ]);

      expect(result).toEqual({
        officialTitle: 'dr',
        officialFirstName: 'Alex',
        officialSurname: 'Taylor',
      });
    });

    it('maps null clerk names back to empty string', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.CLERK,
          title: undefined,
          forename: undefined,
          surname: undefined,
        },
      ]);

      expect(result).toEqual({
        officialTitle: '',
        officialFirstName: null,
        officialSurname: null,
      });
    });

    it('only maps the first three magistrates', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.MAGISTRATE,
          title: 'Mr',
          forename: 'One',
          surname: 'A',
        },
        {
          type: OfficialType.MAGISTRATE,
          title: 'Mrs',
          forename: 'Two',
          surname: 'B',
        },
        {
          type: OfficialType.MAGISTRATE,
          title: 'Miss',
          forename: 'Three',
          surname: 'C',
        },
        {
          type: OfficialType.MAGISTRATE,
          title: 'Dr',
          forename: 'Four',
          surname: 'D',
        },
      ]);

      expect(result).toEqual(
        expect.objectContaining({
          mags1Title: 'mr',
          mags1FirstName: 'One',
          mags1Surname: 'A',
          mags2Title: 'mrs',
          mags2FirstName: 'Two',
          mags2Surname: 'B',
          mags3Title: 'miss',
          mags3FirstName: 'Three',
          mags3Surname: 'C',
        }),
      );

      expect(result).not.toEqual(
        expect.objectContaining({
          mags4Title: expect.anything(),
        }),
      );
    });

    it('maps both magistrates and clerk in one patch', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.MAGISTRATE,
          title: 'mr',
          forename: 'John',
          surname: 'Smith',
        },
        {
          type: OfficialType.CLERK,
          title: 'other',
          forename: 'Clara',
          surname: 'Jones',
        },
      ]);

      expect(result).toEqual({
        mags1Title: 'mr',
        mags1FirstName: 'John',
        mags1Surname: 'Smith',
        officialTitle: 'other',
        officialFirstName: 'Clara',
        officialSurname: 'Jones',
      });
    });
  });
});
