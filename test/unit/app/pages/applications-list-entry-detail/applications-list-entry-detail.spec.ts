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
  UpdateApplicationListEntryRequestParams,
} from '../../../../../src/generated/openapi';

// ---------- Strong function types for our mocks (not the overloaded API types) ----------
type GetCodesFn = (
  params: GetApplicationCodesRequestParams,
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean },
) => Observable<ApplicationCodePage>;

type GetEntryFn = (
  params: { listId: string; entryId: string },
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean },
) => Observable<EntryGetDetailDto>;

type UpdateEntryFn = (
  params: UpdateApplicationListEntryRequestParams,
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean },
) => Observable<unknown>;

type GetCodeDetailFn = (
  params: { code: string; date: string },
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean },
) => Observable<ApplicationCodeGetDetailDto>;

// Minimal, valid page builder (matches your generator; no unknown props like `number`/`size`)
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
    // required fields in your model – provide defaults
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

  // ---- Jest mock variables (typed), assigned in beforeEach without generics on jest.fn() ----
  let mockGetApplicationCodes: jest.MockedFunction<GetCodesFn>;
  let mockGetApplicationCodeByCodeAndDate: jest.MockedFunction<GetCodeDetailFn>;
  let mockGetApplicationListEntry: jest.MockedFunction<GetEntryFn>;
  let mockUpdateApplicationListEntry: jest.MockedFunction<UpdateEntryFn>;

  // ActivatedRoute stub using convertToParamMap (no `any`)
  const routeStub: ActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({ entryId: 'EN-1', id: 'EN-1' }),
      queryParamMap: convertToParamMap({ entryId: 'EN-1', appListId: 'AL-1' }),
    },
  } as ActivatedRoute;

  beforeEach(async () => {
    jest.resetAllMocks();

    // assign mocks
    mockGetApplicationCodes = jest.fn();
    mockGetApplicationCodeByCodeAndDate = jest.fn();
    mockGetApplicationListEntry = jest.fn();
    mockUpdateApplicationListEntry = jest.fn();

    // Default startup behaviour
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

    // Provide to DI via a single safe cast to the generated service types
    const codesApiMock = {
      getApplicationCodes: mockGetApplicationCodes,
      getApplicationCodeByCodeAndDate: mockGetApplicationCodeByCodeAndDate,
    } as unknown as ApplicationCodesApi;

    const entriesApiMock = {
      getApplicationListEntry: mockGetApplicationListEntry,
      updateApplicationListEntry: mockUpdateApplicationListEntry,
    } as unknown as ApplicationListEntriesApi;

    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryDetail], // standalone component
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ApplicationCodesApi, useValue: codesApiMock },
        { provide: ApplicationListEntriesApi, useValue: entriesApiMock },
        { provide: ActivatedRoute, useValue: routeStub },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListEntryDetail);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit → loadCodesSection
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
      { transferCache: true },
    );
    expect(mockGetApplicationCodeByCodeAndDate).toHaveBeenCalledWith(
      { code: 'APP-100', date: '2025-11-01' },
      'body',
      false,
      { transferCache: true },
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
      { transferCache: true },
    );

    expect(component['codesRows']).toEqual([
      { code: 'APP-9', title: 'Something', bulk: 'Yes', fee: 'CO9.2' },
      { code: 'APP-10', title: 'Else', bulk: 'No', fee: '—' },
    ]);
  });

  it('onCodesSearch maps errors (401) to error summary and sets hasFatalError', () => {
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
    expect(component['errorHint']).toBe('You need to sign in');
    expect(component['errorSummary'][0].text).toContain('sign in');
  });

  it('onAddCode requires lodgementDate and shows an error if missing', () => {
    component['form'].patchValue({ lodgementDate: '' });

    component.onAddCode({ code: 'APP-1', title: '', bulk: 'No', fee: '—' });

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();
    expect(component['hasFatalError']).toBe(true);
    expect(component['errorSummary'][0].text).toMatch(
      /Lodgement date is missing/i,
    );
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
      { transferCache: false },
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
    fixture.detectChanges(); // render template (input exists in DOM)

    const input = document.querySelector<HTMLInputElement>('#application-code');
    expect(input).toBeTruthy();

    component.onErrorItemClick({
      text: 'Application code',
      href: '#application-code',
    });
    tick(); // flush the setTimeout(0) used in the handler

    expect(document.activeElement).toBe(input);

    // Optional: caret at end (value may be empty so 0)
    const len = (input!.value ?? '').length;
    // JSDOM exposes selectionStart/End for inputs
    expect(input!.selectionStart).toBe(len);
    expect(input!.selectionEnd).toBe(len);
  }));
});
