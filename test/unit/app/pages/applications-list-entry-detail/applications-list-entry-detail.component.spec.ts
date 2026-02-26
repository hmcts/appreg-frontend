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
import {
  ApplicationCodeGetDetailDto,
  ApplicationCodePage,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  GetApplicationCodesRequestParams,
  UpdateApplicationListEntryRequestParams,
} from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';

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
        id: 'EN-1',
      }),
      queryParamMap: convertToParamMap({ entryId: 'EN-1', appListId: 'AL-1' }),
    },
  } as ActivatedRoute;

  beforeEach(async () => {
    jest.resetAllMocks();

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
});
