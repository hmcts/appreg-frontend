// applications-list-entry-detail.spec.ts

import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { ApplicationsListEntryDetail } from '../../../../../src/app/pages/applications-list-entry-detail/applications-list-entry-detail';
import {
  ApplicationCodeGetDetailDto,
  ApplicationCodeGetSummaryDto,
  ApplicationCodePage,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  GetApplicationCodesRequestParams,
  StandardApplicantsApi,
  UpdateApplicationListEntryRequestParams,
} from '../../../../../src/generated/openapi';

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

type GetStandardApplicantsFn = jest.Mock<
  unknown,
  [
    params: unknown,
    ('body' | undefined)?,
    (boolean | undefined)?,
    { transferCache?: boolean; context?: unknown }?,
  ]
>;

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
    wording: c.wording ?? '',
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
  let mockGetStandardApplicants: GetStandardApplicantsFn;

  const routeStub: ActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({ entryId: 'EN-1', id: 'EN-1' }),
      queryParamMap: convertToParamMap({ entryId: 'EN-1', appListId: 'AL-1' }),
    },
  } as ActivatedRoute;

  beforeEach(async () => {
    jest.resetAllMocks();
    mockGetApplicationCodes = jest.fn();
    mockGetApplicationCodeByCodeAndDate = jest.fn();
    mockGetApplicationListEntry = jest.fn();
    mockUpdateApplicationListEntry = jest.fn();
    mockGetStandardApplicants = jest.fn();

    mockGetApplicationListEntry.mockReturnValue(
      of({
        lodgementDate: '2025-11-01',
        applicationCode: 'APP-100',
      } as EntryGetDetailDto),
    );
    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-100',
        title: 'Loaded title',
        wording: '',
        bulkRespondentAllowed: false,
        isFeeDue: false,
        requiresRespondent: false,
        feeReference: undefined,
        startDate: '2025-01-01',
        endDate: null,
      } as ApplicationCodeGetDetailDto),
    );
    mockUpdateApplicationListEntry.mockReturnValue(of({}));
    const standardApplicantsApiMock = {
      getStandardApplicants: mockGetStandardApplicants,
    } as unknown as StandardApplicantsApi;
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
        { provide: StandardApplicantsApi, useValue: standardApplicantsApiMock },
        { provide: ActivatedRoute, useValue: routeStub },
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
    expect(component['form'].get('applicationCode')?.value).toBe('APP-100');
    expect(component['form'].get('applicationTitle')?.value).toBe(
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

  it('onCodesSearch builds request from form and maps table rows', () => {
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

  it('onCodesSearch maps errors (401) to error summary via error util', () => {
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

    expect(component['hasFatalError']).toBe(true);
    expect(component['errorHint']).toBe('Auth');
    expect(component['errorSummary'][0].text).toContain('Please sign in');
  });

  it('onAddCode uses loaded lodgementDate even if the control is blank', () => {
    component['form'].patchValue({ lodgementDate: '' });
    component.onAddCode({ code: 'APP-1', title: '', bulk: 'No', fee: '—' });
    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);
    const [params] = mockUpdateApplicationListEntry.mock.calls[0];
    expect(params.listId).toBe('AL-1');
    expect(params.entryId).toBe('EN-1');
    expect(params.entryUpdateDto.lodgementDate).toBe('2025-11-01');
    expect(component['hasFatalError']).toBe(false);
  });

  it('onAddCode updates entry and shows success banner; wording placeholder → link to wording section', () => {
    component['form'].patchValue({ lodgementDate: '2025-11-01' });
    mockUpdateApplicationListEntry.mockReturnValue(of({}));

    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-7',
        title: 'After update title',
        wording: '... {TEXT|Reference|123} ...',
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
      {
        listId: 'AL-1',
        entryId: 'EN-1',
        entryUpdateDto: <EntryUpdateDto>{
          lodgementDate: '2025-11-01',
          applicationCode: 'APP-7',
        },
      },
      'body',
      false,
      expect.objectContaining({ transferCache: false }),
    );

    expect(component['successBanner']?.heading).toBe('Application code added');
    expect(component['successBanner']?.link).toEqual({
      href: '#wording-section',
      text: 'Go to wording section',
    });
    expect(component['form'].get('applicationCode')?.value).toBe('APP-7');
    expect(component['form'].get('applicationTitle')?.value).toBe(
      'After update title',
    );
  });

  it('onErrorItemClick focuses target input and moves caret', fakeAsync(() => {
    fixture.detectChanges();

    const input = document.querySelector<HTMLInputElement>('#application-code');
    expect(input).toBeTruthy();

    component.onErrorItemClick({
      text: 'Application code',
      href: '#application-code',
    });
    tick();

    expect(document.activeElement).toBe(input);
    const len = (input!.value ?? '').length;
    expect(input!.selectionStart).toBe(len);
    expect(input!.selectionEnd).toBe(len);
  }));

  it('keeps selectedStandardApplicantCode in sync with saSelectedIds (single select table)', () => {
    const set = new Set<string>(['SA-123']);
    component['saSelectedIds'] = set;

    expect(component['selectedStandardApplicantCode']).toBe('SA-123');

    component['saSelectedIds'] = new Set<string>();
    expect(component['selectedStandardApplicantCode']).toBeNull();
  });

  it('onUpdateApplicant (standardApplicant) builds PUT using snapshot and clears applicant', () => {
    mockUpdateApplicationListEntry.mockReturnValue(of({}));
    component['form'].get('applicantEntryType')?.setValue('standardApplicant');

    component['selectedStandardApplicantCode'] = 'SA-999';

    component.onUpdateApplicant();

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);
    const [params, observe, reportProgress, options] =
      mockUpdateApplicationListEntry.mock.calls[0];

    expect(params.listId).toBe('AL-1');
    expect(params.entryId).toBe('EN-1');
    expect(observe).toBe('body');
    expect(reportProgress).toBe(false);
    expect(options).toEqual(expect.objectContaining({ transferCache: false }));

    expect(params.entryUpdateDto).toMatchObject({
      lodgementDate: '2025-11-01',
      applicationCode: 'APP-100',
      standardApplicantCode: 'SA-999',
      applicant: undefined,
    } as EntryUpdateDto);

    expect(component['successBanner']?.heading).toBe('Applicant updated');
  });

  it('onUpdateApplicant (standardApplicant) validates that a row is selected', () => {
    mockUpdateApplicationListEntry.mockReturnValue(of({}));

    component['form'].get('applicantEntryType')?.setValue('standardApplicant');
    component['selectedStandardApplicantCode'] = null;

    component.onUpdateApplicant();

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();
    expect(component['hasFatalError']).toBe(true);
    expect(component['errorHint']).toBe('There is a problem');
    expect(component['errorSummary'][0].text).toMatch(
      /Select a standard applicant/i,
    );
  });
});
