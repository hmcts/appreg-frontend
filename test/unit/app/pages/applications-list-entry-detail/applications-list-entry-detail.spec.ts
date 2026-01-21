// applications-list-entry-detail.spec.ts

import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { ApplicationsListEntryDetail } from '@components/applications-list-entry-detail/applications-list-entry-detail';
import {
  ApplicationCodeGetDetailDto,
  ApplicationCodeGetSummaryDto,
  ApplicationCodePage,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  GetApplicationCodesRequestParams,
  UpdateApplicationListEntryRequestParams,
} from '@openapi';
import { ApplicationListEntryFormService } from '@services/application-list-entry-form.service';

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

function makePage(
  content: ReadonlyArray<Partial<ApplicationCodeGetSummaryDto>>,
  extras: Partial<
    Pick<
      ApplicationCodePage,
      | 'totalPages'
      | 'totalElements'
      | 'pageNumber'
      | 'pageSize'
      | 'elementsOnPage'
    >
  > = {},
): ApplicationCodePage {
  const normalized: ApplicationCodeGetSummaryDto[] = content.map((c) => ({
    applicationCode: c.applicationCode ?? '',
    title: c.title ?? '',
    bulkRespondentAllowed: Boolean(c.bulkRespondentAllowed),
    feeReference: c.feeReference,
    wording: c.wording ?? {},
    isFeeDue: c.isFeeDue ?? false,
    requiresRespondent: c.requiresRespondent ?? false,
  }));

  const pageSize = extras.pageSize ?? 10;
  const totalElements = extras.totalElements ?? normalized.length;
  const totalPages =
    extras.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize));
  const pageNumber = extras.pageNumber ?? 0;
  const elementsOnPage =
    extras.elementsOnPage ??
    Math.min(pageSize, Math.max(0, totalElements - pageNumber * pageSize));

  return {
    content: normalized,
    totalPages,
    totalElements,
    pageNumber,
    pageSize,
    elementsOnPage,
  };
}

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

  it('onCodesSearch builds request from form and maps rows', () => {
    component['form'].patchValue({
      applicationCode: 'APP-9',
      applicationTitle: 'Something',
    });

    mockGetApplicationCodes.mockReturnValue(
      of(
        makePage([
          {
            applicationCode: 'APP-9',
            title: 'Something',
            bulkRespondentAllowed: true,
            feeReference: 'CO9.2',
          },
          {
            applicationCode: 'APP-10',
            title: 'Else',
            bulkRespondentAllowed: false,
            feeReference: undefined,
          },
        ]),
      ),
    );

    component.onCodesSearch();

    expect(mockGetApplicationCodes).toHaveBeenCalledWith(
      { code: 'APP-9', title: 'Something', page: 0, size: 10 },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );

    expect(component['codesRows']).toEqual([
      { code: 'APP-9', title: 'Something', bulk: 'Yes', fee: 'CO9.2' },
      { code: 'APP-10', title: 'Else', bulk: 'No', fee: '—' },
    ]);
  });

  it('onCodesSearch maps HTTP error into error state', () => {
    mockGetApplicationCodes.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { title: 'Auth', detail: 'Please sign in' },
          }),
      ),
    );

    component.onCodesSearch();

    expect(component['errorFound']).toBe(true);
    expect(component['errorHint']).toBeTruthy();
    expect(component['summaryErrors'].length).toBeGreaterThan(0);
  });

  it('onAddCode uses loaded lodgementDate even if the control is blank', () => {
    component['form'].patchValue({ lodgementDate: '' });

    component.onAddCode({ code: 'APP-1', title: '', bulk: 'No', fee: '—' });

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);

    const [params] = mockUpdateApplicationListEntry.mock.calls[0];
    expect(params.listId).toBe('AL-1');
    expect(params.entryId).toBe('EN-1');
    expect(params.entryUpdateDto.lodgementDate).toBe('2025-11-01');
    expect(component['errorFound']).toBe(false);
  });

  it('onAddCode updates entry and patches title', () => {
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

    component.onAddCode({ code: 'APP-7', title: '', bulk: 'No', fee: '—' });

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        listId: 'AL-1',
        entryId: 'EN-1',
        entryUpdateDto: expect.objectContaining({
          lodgementDate: '2025-11-01',
          applicationCode: 'APP-7',
        }),
      }),
      'body',
      false,
      expect.objectContaining({ transferCache: false }),
    );

    expect(component['form'].controls.applicationCode.value).toBe('APP-7');
    expect(component['form'].controls.applicationTitle?.value).toBe(
      'After update title',
    );
    expect(component['successBanner']).toBeTruthy();
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
