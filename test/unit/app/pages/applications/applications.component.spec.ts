import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import {
  LOCALE_ID,
  PLATFORM_ID,
  type WritableSignal,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';

import { Applications } from '@components/applications/applications.component';
import { type ApplicationsState } from '@components/applications/util/applications.state';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@constants/applications-list/applications-list.constants';
import { PdfService } from '@core/services/pdf.service';
import {
  ApplicationCodeGetSummaryDto,
  ApplicationListEntriesApi,
  ApplicationListGetPrintDto,
  ApplicationListStatus,
  ApplicationListsApi,
  BulkActionPreviewResponseDto,
  BulkActionType,
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
  EntryGetFilterDto,
  EntryGetSummaryDto,
  EntryPage,
  ResultCodeGetSummaryDto,
} from '@openapi';
import { AiCapabilitiesFacade } from '@services/ai-capabilities.facade';
import {
  ApplicationsSearchFormService,
  DEFAULT_APPLICATIONS_SEARCH_FORM,
} from '@services/applications/applications-search-form.service';
import { ApplicationsSearchStateService } from '@services/applications/applications-search-state.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { ApplicationRow } from '@shared-types/applications/applications.type';

interface HasLoadQuery {
  loadQuery(): EntryGetFilterDto;
}

function appStateSignal(
  component: Applications,
): WritableSignal<ApplicationsState> {
  return (
    component as unknown as {
      appState: { state: WritableSignal<ApplicationsState> };
    }
  ).appState.state;
}

function makeEntry(
  overrides?: Partial<EntryGetSummaryDto>,
): EntryGetSummaryDto {
  return {
    id: 'row-1',
    applicationTitle: 'Some title',
    isFeeRequired: true,
    isResulted: false,
    status: 'OPEN' as ApplicationListStatus,
    ...overrides,
  };
}

function makePrintDto(
  overrides?: Partial<ApplicationListGetPrintDto>,
): ApplicationListGetPrintDto {
  return {
    date: '2026-04-29',
    time: '10:00',
    entries: [],
    ...overrides,
  };
}

function makeSelectedRow(
  id: string,
  applicationListId: string,
): ApplicationRow {
  return {
    id,
    date: '',
    applicant: '',
    respondent: '',
    title: '',
    fee: '',
    resulted: '',
    status: '',
    applicationListId,
  };
}

const flushSignalEffects = async (
  fixture: ComponentFixture<Applications>,
): Promise<void> => {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
};

const RESTORED_APPLICANT_ORG = 'Persisted Applicant Organisation';
const RESTORED_ENTRY_ID = 'persisted-entry';
const RESTORED_LIST_ID = 'persisted-list';
const SYNTHETIC_APPLICANT_NAME = 'Synthetic Applicant Ltd';
const SYNTHETIC_RESPONDENT_NAME = 'Synthetic Respondent';
const LIST_DATE = '2026-05-21';
const RANGE_FROM = '2026-05-01';
const RANGE_TO = '2026-05-31';
const SEARCH_PROBLEM_TEXT = 'Synthetic search filter problem';
const APPLICATION_CODE_A = 'AP99001';
const APPLICATION_CODE_B = 'SW99002';
const RESULT_CODE_A = 'RC9901';
const RESULT_CODE_B = 'RC9902';

function makeApplicationCode(
  applicationCode: string,
  title: string,
): ApplicationCodeGetSummaryDto {
  return {
    applicationCode,
    title,
    wording: { template: 'Synthetic wording' },
    isFeeDue: false,
    requiresRespondent: false,
    bulkRespondentAllowed: false,
  };
}

describe('ApplicationsComponent', () => {
  let component: Applications;
  let fixture: ComponentFixture<Applications>;
  let searchFormService: ApplicationsSearchFormService;
  let searchStateService: ApplicationsSearchStateService;
  const applicationCodeTitles = signal<string[]>([]);
  const applicationCodes = signal<ApplicationCodeGetSummaryDto[]>([]);
  const resultCodes = signal<ResultCodeGetSummaryDto[]>([]);
  const courtLocations = new BehaviorSubject<CourtLocationGetSummaryDto[]>([]);
  const cjas = new BehaviorSubject<CriminalJusticeAreaGetDto[]>([]);
  const referenceDataLoadError = signal(false);
  const placeReferenceDataLoadError = signal(false);

  const referenceDataFacadeStub: Pick<
    ReferenceDataFacade,
    | 'cja$'
    | 'courtLocations$'
    | 'applicationCodeTitles'
    | 'applicationCodes'
    | 'resultCodes'
    | 'ensureResultCodes'
    | 'hasLoadError'
    | 'hasPlaceLoadError'
    | 'refresh'
  > = {
    cja$: cjas,
    courtLocations$: courtLocations,
    applicationCodeTitles,
    applicationCodes,
    resultCodes,
    ensureResultCodes: jest.fn(),
    hasLoadError: referenceDataLoadError,
    hasPlaceLoadError: placeReferenceDataLoadError,
    refresh: jest.fn(),
  };

  const getEntriesMock: jest.MockedFunction<
    ApplicationListEntriesApi['getEntries']
  > = jest.fn();
  const bulkActionPreviewMock: jest.MockedFunction<
    ApplicationListEntriesApi['bulkActionPreview']
  > = jest.fn();

  const appListEntriesApiStub: Pick<
    ApplicationListEntriesApi,
    'getEntries' | 'bulkActionPreview'
  > = {
    getEntries: getEntriesMock,
    bulkActionPreview: bulkActionPreviewMock,
  };

  const printApplicationListsMock = jest.fn();
  const appListsApiStub = {
    printApplicationLists: printApplicationListsMock,
  } as unknown as Pick<ApplicationListsApi, 'printApplicationLists'>;

  const pdfServiceStub: jest.Mocked<
    Pick<
      PdfService,
      | 'generatePagedApplicationListPdf'
      | 'generateContinuousApplicationListsPdf'
    >
  > = {
    generatePagedApplicationListPdf: jest.fn(),
    generateContinuousApplicationListsPdf: jest.fn(),
  };

  beforeEach(async () => {
    getEntriesMock.mockReset();
    bulkActionPreviewMock.mockReset();
    printApplicationListsMock.mockReset();
    pdfServiceStub.generatePagedApplicationListPdf.mockReset();
    pdfServiceStub.generateContinuousApplicationListsPdf.mockReset();
    applicationCodeTitles.set([]);
    applicationCodes.set([]);
    resultCodes.set([]);
    courtLocations.next([]);
    cjas.next([]);
    referenceDataLoadError.set(false);
    placeReferenceDataLoadError.set(false);
    jest.mocked(referenceDataFacadeStub.refresh).mockClear();
    jest.mocked(referenceDataFacadeStub.ensureResultCodes).mockClear();

    // default: empty page response
    getEntriesMock.mockReturnValue(
      of(
        new HttpResponse<EntryPage>({
          body: {
            content: [],
            totalPages: 0,
            totalElements: 0,
            number: 0,
          } as unknown as EntryPage,
        }),
      ),
    );
    bulkActionPreviewMock.mockReturnValue(
      of({
        action: BulkActionType.RESULT_SELECTED,
        limit: 100,
        selectedCount: 0,
        eligibleCount: 0,
        ineligibleCount: 0,
        entryIds: [],
        entries: [],
      } as BulkActionPreviewResponseDto) as unknown as ReturnType<
        ApplicationListEntriesApi['bulkActionPreview']
      >,
    );
    await TestBed.configureTestingModule({
      imports: [Applications],
      providers: [
        { provide: LOCALE_ID, useValue: 'en-GB' },
        { provide: ReferenceDataFacade, useValue: referenceDataFacadeStub },
        // Plain-English search is off: its tests are in
        // applications-plain-english-search.spec.ts
        {
          provide: AiCapabilitiesFacade,
          useValue: {
            searchInterpretationEnabled: signal(false),
            refresh: jest.fn(),
          },
        },
        { provide: ApplicationListEntriesApi, useValue: appListEntriesApiStub },
        { provide: ApplicationListsApi, useValue: appListsApiStub },
        { provide: PdfService, useValue: pdfServiceStub },
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },
            params: of({}),
            queryParams: of({}),
            queryParamMap: of(convertToParamMap({})),
            paramMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    searchFormService = TestBed.inject(ApplicationsSearchFormService);
    searchStateService = TestBed.inject(ApplicationsSearchStateService);
    searchFormService.reset();
    searchStateService.reset();

    fixture = TestBed.createComponent(Applications);
    component = fixture.componentInstance;
    bulkActionPreviewMock.mockImplementation((request) => {
      const entries = component.vm().selectedRows.map((row) =>
        makeEntry({
          id: row.id,
          listId: row.applicationListId,
          date: row.date,
          applicationTitle: row.title,
          status: row.status as ApplicationListStatus,
        }),
      );

      return of({
        action: request.bulkActionPreviewRequestDto.action,
        limit: 100,
        selectedCount: entries.length,
        eligibleCount: entries.length,
        ineligibleCount: 0,
        entryIds: entries.map((entry) => entry.id),
        entries,
      }) as unknown as ReturnType<
        ApplicationListEntriesApi['bulkActionPreview']
      >;
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows and clears an application-title-only reference error summary', () => {
    expect(placeReferenceDataLoadError()).toBe(false);
    referenceDataLoadError.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('There is a problem');
    expect(fixture.nativeElement.textContent).toContain(
      'Failed to load reference data',
    );

    referenceDataLoadError.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Failed to load reference data',
    );
  });

  it('refreshes an application-title error after rendering', async () => {
    fixture.destroy();
    referenceDataLoadError.set(true);
    fixture = TestBed.createComponent(Applications);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(referenceDataFacadeStub.refresh).toHaveBeenCalledTimes(1);
  });

  it('synchronises Advanced search after an error reveal and supports immediate collapse/reopen', () => {
    const details = fixture.nativeElement.querySelector(
      'details.govuk-details:last-of-type',
    ) as HTMLDetailsElement;
    const event = { target: details } as unknown as Event;
    details.open = true;
    component.onAdvancedToggle(event);
    expect(component.vm().isAdvancedSearch).toBe(true);
    expect(
      TestBed.inject(ApplicationsSearchFormService).state().isAdvancedSearch,
    ).toBe(true);
    component.toggleAdvancedSearch();
    expect(component.vm().isAdvancedSearch).toBe(false);
    component.toggleAdvancedSearch();
    expect(component.vm().isAdvancedSearch).toBe(true);
    details.open = false;
    component.onAdvancedToggle(event);
    expect(
      TestBed.inject(ApplicationsSearchFormService).state().isAdvancedSearch,
    ).toBe(false);
  });

  it('renders application title as a search criterion', () => {
    expect(fixture.nativeElement.textContent).toContain('Application title');
  });

  describe('application title suggestions', () => {
    it('filters titles case-insensitively, removes duplicates, and limits results to 20', () => {
      const titles = [
        'Private Prosecution',
        'Private Prosecution',
        ...Array.from(
          { length: 21 },
          (_, index) => `Private application ${index}`,
        ),
      ];
      applicationCodeTitles.set(titles);

      component.onApplicationTitleInputChange('  PRIVATE  ');

      expect(component.filteredApplicationTitles()).toHaveLength(20);
      expect(component.filteredApplicationTitles()[0]).toEqual({
        kind: 'app-code-title',
        label: 'Private Prosecution',
        value: 'Private Prosecution',
      });
      expect(
        component
          .filteredApplicationTitles()
          .filter(
            (suggestion) =>
              suggestion.label.toLowerCase() === 'private prosecution',
          ),
      ).toHaveLength(1);
    });

    it('returns no suggestions for an empty query', () => {
      applicationCodeTitles.set(['Private Prosecution']);

      expect(component.filteredApplicationTitles()).toEqual([]);
    });

    it('selects a rendered suggestion and submits the selected title with its original casing', () => {
      applicationCodeTitles.set([
        'Private Prosecution',
        'Private Applications Act',
      ]);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '#applicationTitle',
      ) as HTMLInputElement;
      input.focus();
      input.value = 'private prosecution';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();

      const options = fixture.nativeElement.querySelectorAll(
        '#applicationTitle-listbox [role="option"]',
      ) as NodeListOf<HTMLElement>;
      expect(options).toHaveLength(1);
      expect(options[0].textContent?.trim()).toBe('Private Prosecution');
      options[0].click();
      fixture.detectChanges();

      expect(input.value).toBe('Private Prosecution');
      expect(component.form.controls.applicationTitle.value).toBe(
        'Private Prosecution',
      );

      component.onSubmit({
        preventDefault: jest.fn(),
      } as unknown as SubmitEvent);

      expect(getEntriesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { applicationTitle: 'Private Prosecution' },
        }),
        undefined,
        undefined,
        expect.any(Object),
      );
    });

    it('keeps unmatched free text as the application title search filter', () => {
      applicationCodeTitles.set(['Private Prosecution']);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '#applicationTitle',
      ) as HTMLInputElement;
      input.value = 'Other title';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();

      expect(component.form.controls.applicationTitle.value).toBe(
        'Other title',
      );
      expect(component.filteredApplicationTitles()).toEqual([]);

      component.onSubmit({
        preventDefault: jest.fn(),
      } as unknown as SubmitEvent);

      expect(getEntriesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { applicationTitle: 'Other title' },
        }),
        undefined,
        undefined,
        expect.any(Object),
      );
    });

    it('restores the title into the input and clears it with the search', () => {
      searchFormService.patchState({ applicationTitle: 'Private Prosecution' });

      const restoredFixture = TestBed.createComponent(Applications);
      restoredFixture.detectChanges();

      expect(
        (
          restoredFixture.nativeElement.querySelector(
            '#applicationTitle',
          ) as HTMLInputElement
        ).value,
      ).toBe('Private Prosecution');

      restoredFixture.componentInstance.clearSearch();
      restoredFixture.detectChanges();

      expect(
        (
          restoredFixture.nativeElement.querySelector(
            '#applicationTitle',
          ) as HTMLInputElement
        ).value,
      ).toBe('');
    });
  });

  it('configures the results table for server-side sorting', () => {
    appStateSignal(component).update((s) => ({
      ...s,
      rows: [makeEntry({ id: 'row-1' })],
    }));
    fixture.detectChanges();

    const table = fixture.debugElement.query(
      By.directive(SortableTableComponent),
    ).componentInstance as SortableTableComponent;

    expect(table.clientOrServerSort()).toBe('server');
  });

  it('renders errorSummary when action-level errors are present', () => {
    appStateSignal(component).update((s) => ({
      ...s,
      errorSummary: [{ text: 'Select all failed' }],
      searchErrors: [{ id: 'search-error', text: 'Search failed' }],
    }));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Select all failed');
    expect(fixture.nativeElement.textContent).not.toContain('Search failed');
  });

  it('restores the previous successful search state and reruns the query when the page is recreated', () => {
    getEntriesMock.mockClear();
    getEntriesMock.mockReturnValue(
      of({
        content: [
          makeEntry({ id: RESTORED_ENTRY_ID, listId: RESTORED_LIST_ID }),
        ],
        totalPages: 3,
        totalElements: 21,
        number: 1,
      } as unknown as EntryPage) as unknown as ReturnType<
        ApplicationListEntriesApi['getEntries']
      >,
    );

    appStateSignal(component).update((s) => ({
      ...s,
      currentPage: 1,
      isAdvancedSearch: true,
      sortField: { key: 'title', direction: 'asc' },
    }));
    component.form.patchValue({ applicantOrg: RESTORED_APPLICANT_ORG });

    component.loadApplications();

    const freshFixture = TestBed.createComponent(Applications);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(getEntriesMock).toHaveBeenCalledTimes(2);
    expect(getEntriesMock.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        pageNumber: 1,
        sort: ['applicationTitle,asc'],
        filter: { applicantOrganisation: RESTORED_APPLICANT_ORG },
      }),
    );
    expect(freshComponent.form.controls.applicantOrg.value).toBe(
      RESTORED_APPLICANT_ORG,
    );
    expect(freshComponent.vm().rows.map((row) => row.id)).toEqual([
      RESTORED_ENTRY_ID,
    ]);
    expect(freshComponent.vm().currentPage).toBe(1);
    expect(freshComponent.vm().totalPages).toBe(3);
    expect(freshComponent.vm().totalEntries).toBe(21);
    expect(freshComponent.vm().sortField).toEqual({
      key: 'title',
      direction: 'asc',
    });
    expect(freshComponent.vm().isAdvancedSearch).toBe(true);
    expect(freshComponent.vm().getFilters).toEqual({
      applicantOrganisation: RESTORED_APPLICANT_ORG,
    });
  });

  it('uses freshly fetched rows for a restored search', () => {
    getEntriesMock.mockClear();
    getEntriesMock
      .mockReturnValueOnce(
        of({
          content: [
            makeEntry({
              id: RESTORED_ENTRY_ID,
              listId: RESTORED_LIST_ID,
              applicationTitle: 'Original title',
            }),
          ],
          totalPages: 3,
          totalElements: 21,
          number: 1,
        } as unknown as EntryPage) as unknown as ReturnType<
          ApplicationListEntriesApi['getEntries']
        >,
      )
      .mockReturnValueOnce(
        of({
          content: [
            makeEntry({
              id: RESTORED_ENTRY_ID,
              listId: RESTORED_LIST_ID,
              applicationTitle: 'Updated title',
            }),
          ],
          totalPages: 3,
          totalElements: 21,
          number: 1,
        } as unknown as EntryPage) as unknown as ReturnType<
          ApplicationListEntriesApi['getEntries']
        >,
      );

    appStateSignal(component).update((s) => ({
      ...s,
      currentPage: 1,
      isAdvancedSearch: true,
      sortField: { key: 'title', direction: 'asc' },
    }));
    component.form.patchValue({ applicantOrg: RESTORED_APPLICANT_ORG });
    component.loadApplications();

    const freshFixture = TestBed.createComponent(Applications);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(getEntriesMock).toHaveBeenCalledTimes(2);
    expect(getEntriesMock.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        pageNumber: 1,
        sort: ['applicationTitle,asc'],
        filter: { applicantOrganisation: RESTORED_APPLICANT_ORG },
      }),
    );
    expect(freshComponent.vm().rows.map((row) => row.applicationTitle)).toEqual(
      ['Updated title'],
    );
  });

  it('clears the stored search state when the search is cleared', () => {
    getEntriesMock.mockClear();
    getEntriesMock.mockReturnValueOnce(
      of({
        content: [
          makeEntry({ id: RESTORED_ENTRY_ID, listId: RESTORED_LIST_ID }),
        ],
        totalPages: 1,
        totalElements: 1,
        number: 0,
      } as unknown as EntryPage) as unknown as ReturnType<
        ApplicationListEntriesApi['getEntries']
      >,
    );

    component.form.patchValue({ applicantOrg: RESTORED_APPLICANT_ORG });
    component.loadApplications();

    component.clearSearch();

    const freshFixture = TestBed.createComponent(Applications);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(freshComponent.form.controls.applicantOrg.value).toBe('');
    expect(freshComponent.vm().rows).toEqual([]);
    expect(freshComponent.vm().isSearch).toBe(false);
    expect(freshComponent.vm().getFilters).toEqual({});
  });

  it('restores the advanced search state after it is toggled', () => {
    component.toggleAdvancedSearch();

    const freshFixture = TestBed.createComponent(Applications);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(freshComponent.vm().isAdvancedSearch).toBe(true);
  });

  describe('onSubmit validation', () => {
    const submitSearch = () => {
      const event = {
        preventDefault: jest.fn(),
        submitter: { value: 'search' } as HTMLButtonElement,
      } as unknown as SubmitEvent;

      component.onSubmit(event);
      fixture.detectChanges();

      return event;
    };

    it('does not disable the Search button when all filters are empty', () => {
      component.form.reset({
        date: null,
        applicantOrg: '',
        respondentOrg: '',
        applicantSurname: '',
        respondentSurname: '',
        applicationTitle: '',
        location: '',
        standardApplicantCode: '',
        respondentPostcode: '',
        accountReference: '',
        court: '',
        cja: '',
        status: null,
      });

      fixture.detectChanges();

      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('#search');

      expect(button).toBeTruthy();
      expect(button.disabled).toBe(false);
    });

    it('keeps Search disabled until the entries request succeeds', () => {
      const response = new Subject<HttpResponse<EntryPage>>();
      getEntriesMock.mockReturnValue(response);

      component.loadApplications();

      expect(component.vm().isLoading).toBe(true);

      response.next(
        new HttpResponse<EntryPage>({
          body: {
            content: [],
            totalPages: 0,
            totalElements: 0,
            pageNumber: 0,
            pageSize: 0,
            elementsOnPage: 0,
          },
        }),
      );

      expect(component.vm().isLoading).toBe(false);
    });

    it('re-enables Search when the entries request fails', () => {
      const response = new Subject<HttpResponse<EntryPage>>();
      getEntriesMock.mockReturnValue(response);

      component.loadApplications();
      expect(component.vm().isLoading).toBe(true);

      response.error(new Error('Search failed'));

      expect(component.vm().isLoading).toBe(false);
    });

    it('when submitted with no params: sets invalid search criteria error and does not call API', () => {
      getEntriesMock.mockClear();

      component.form.reset({
        date: null,
        applicantOrg: '',
        respondentOrg: '',
        applicantSurname: '',
        respondentSurname: '',
        applicationTitle: '',
        location: '',
        standardApplicantCode: '',
        respondentPostcode: '',
        accountReference: '',
        court: '',
        cja: '',
        status: null,
      });

      const preventDefault = jest.fn();

      const event = {
        preventDefault,
        submitter: { value: 'search' } as HTMLButtonElement,
      } as unknown as SubmitEvent;

      component.onSubmit(event);

      expect(preventDefault).toHaveBeenCalled();

      expect(getEntriesMock).not.toHaveBeenCalled();
      expect(component.vm().submitted).toBe(true);

      expect(component.vm().searchErrors).toEqual([
        expect.objectContaining({
          id: 'search-error',
          text: expect.stringContaining('Invalid search criteria'),
        }),
      ]);
    });

    it('does not show a court error for an empty search', () => {
      submitSearch();

      const courtInput: HTMLInputElement =
        fixture.nativeElement.querySelector('#court');

      expect(
        component.form.controls.court.hasError('courtOrLocCjaRequired'),
      ).toBe(true);
      expect(courtInput.classList).not.toContain('govuk-input--error');
    });

    it('when submitted with a param: calls loadApplications (and API) rather than invalid search criteria', () => {
      getEntriesMock.mockClear();

      appStateSignal(component).update((s) => ({
        ...s,
        currentPage: 3,
      }));

      component.form.patchValue({ applicantOrg: 'Some Org' });

      submitSearch();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      expect(component.vm().currentPage).toBe(0);
      expect(
        component.vm().searchErrors.some((e) => e.id === 'search-error'),
      ).toBe(false);
    });

    it('when submitted with application title only: searches using the application title filter', () => {
      getEntriesMock.mockClear();

      component.form.patchValue({ applicationTitle: 'Private prosecution' });

      submitSearch();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      const [params] = getEntriesMock.mock.calls[0];
      expect(params?.filter).toEqual({
        applicationTitle: 'Private prosecution',
      });
      expect(
        component.vm().searchErrors.some((e) => e.id === 'search-error'),
      ).toBe(false);
    });

    it.each([
      [
        'more than 500 characters',
        'A'.repeat(501),
        'Application title must be 500 characters or fewer',
      ],
      [
        'invalid characters',
        'Private prosecution #1',
        'Application title contains invalid characters',
      ],
    ])(
      'when submitted with application title containing %s: shows a validation error and does not call API',
      (_caseName, applicationTitle, errorText) => {
        getEntriesMock.mockClear();

        component.form.patchValue({ applicationTitle });

        submitSearch();

        expect(getEntriesMock).not.toHaveBeenCalled();
        expect(component.vm().searchErrors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'applicationTitle',
              href: '#applicationTitle',
              text: errorText,
            }),
          ]),
        );
        expect(
          component.vm().searchErrors.some((e) => e.id === 'search-error'),
        ).toBe(false);
      },
    );

    it('resets sort to the default when a new search is submitted', () => {
      getEntriesMock.mockClear();

      appStateSignal(component).update((s) => ({
        ...s,
        isLoading: false,
        sortField: { key: 'status', direction: 'asc' },
      }));

      component.form.patchValue({ applicantOrg: 'Some Org' });

      submitSearch();

      expect(component.vm().sortField).toEqual({
        key: 'date',
        direction: 'desc',
      });

      const [params] = getEntriesMock.mock.calls[0];
      expect(params?.sort).toEqual(['date,desc']);
    });

    it('prioritises field validation errors (e.g. postcode too long) over invalid search criteria', () => {
      getEntriesMock.mockClear();

      appStateSignal(component).update((s) => ({
        ...s,
        rows: [makeEntry({ id: 'existing-row' })],
      }));

      component.form.patchValue({ respondentPostcode: 'AB12 3CDE' });

      submitSearch();

      expect(getEntriesMock).not.toHaveBeenCalled();

      // Should be a field error, not invalid search criteria
      expect(
        component.vm().searchErrors.some((e) => e.id === 'search-error'),
      ).toBe(false);

      expect(component.vm().searchErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'respondentPostcode',
            href: '#respondentPostcode',
            text: 'Postcode must be 8 characters or fewer',
          }),
        ]),
      );
      expect(component.vm().rows.map((row) => row.id)).toEqual([
        'existing-row',
      ]);
    });

    it('clears selecting mode when an invalid submit interrupts a pending select-all', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        isSelectingAll: true,
      }));

      component.form.patchValue({ respondentPostcode: 'AB12 3CDE' });

      submitSearch();

      expect(component.vm().isSelectingAll).toBe(false);
    });

    it('maps a list date range into dateFrom and dateTo', () => {
      component.form.patchValue({
        dateFrom: RANGE_FROM,
        dateTo: RANGE_TO,
      });

      const filter = (component as unknown as HasLoadQuery).loadQuery();

      expect(filter).toEqual({ dateFrom: RANGE_FROM, dateTo: RANGE_TO });
      expect(filter).not.toHaveProperty('date');
    });

    it('sends only the given end of an open-ended date range', () => {
      component.form.patchValue({ dateFrom: RANGE_FROM });

      const filter = (component as unknown as HasLoadQuery).loadQuery();

      expect(filter).toEqual({ dateFrom: RANGE_FROM });
      expect(filter).not.toHaveProperty('dateTo');
    });

    it.each([
      ['empty', ''],
      ['whitespace-only', '   '],
      ['null', null],
    ])('leaves out %s date range values', (_caseName, value) => {
      component.form.patchValue({
        dateFrom: value,
        dateTo: value,
        applicantOrg: 'Synthetic Org',
      });

      const filter = (component as unknown as HasLoadQuery).loadQuery();

      expect(filter).toEqual({ applicantOrganisation: 'Synthetic Org' });
    });
  });

  describe('loadQuery', () => {
    it('maps and trims form values into EntryGetFilterDto', () => {
      component.form.patchValue({
        date: ' 2025-01-02 ',
        court: '  Some Court  ',
        location: '  Other site ',
        cja: ' CJA01 ',
        applicantOrg: '  Org Ltd ',
        applicantSurname: '  Smith ',
        respondentOrg: ' Resp Org ',
        respondentSurname: '  Jones ',
        applicationTitle: '  Private prosecution ',
        respondentPostcode: '  AB1 2CD ',
        standardApplicantCode: '  STD123 ',
        accountReference: '  ACC-999 ',
        status: 'open',
      });

      const filter = (component as unknown as HasLoadQuery).loadQuery();

      expect(filter).toEqual(
        expect.objectContaining({
          date: '2025-01-02',
          courtCode: 'Some Court',
          otherLocationDescription: 'Other site',
          cjaCode: 'CJA01',
          applicantOrganisation: 'Org Ltd',
          applicantSurname: 'Smith',
          respondentOrganisation: 'Resp Org',
          respondentSurname: 'Jones',
          applicationTitle: 'Private prosecution',
          respondentPostcode: 'AB1 2CD',
          standardApplicantCode: 'STD123',
          accountReference: 'ACC-999',
        }),
      );

      component.form.reset({ date: '   ' });
      const emptyFilter = (component as unknown as HasLoadQuery).loadQuery();
      expect(emptyFilter.date).toBeUndefined();
    });

    it('maps and trims applicant and respondent names', () => {
      component.form.patchValue({
        applicantName: `  ${SYNTHETIC_APPLICANT_NAME} `,
        respondentName: ` ${SYNTHETIC_RESPONDENT_NAME}  `,
      });

      const filter = (component as unknown as HasLoadQuery).loadQuery();

      expect(filter).toEqual({
        applicantName: SYNTHETIC_APPLICANT_NAME,
        respondentName: SYNTHETIC_RESPONDENT_NAME,
      });
    });

    it.each([
      ['empty', ''],
      ['whitespace-only', '   '],
      ['null', null],
    ])('leaves out %s applicant and respondent names', (_caseName, value) => {
      component.form.patchValue({
        applicantName: value,
        respondentName: value,
        applicantOrg: 'Synthetic Org',
      });

      const filter = (component as unknown as HasLoadQuery).loadQuery();

      expect(filter).toEqual({ applicantOrganisation: 'Synthetic Org' });
      expect(filter).not.toHaveProperty('applicantName');
      expect(filter).not.toHaveProperty('respondentName');
    });

    it('saves applicant and respondent names to the form service on submit', () => {
      component.form.patchValue({
        applicantName: SYNTHETIC_APPLICANT_NAME,
        respondentName: SYNTHETIC_RESPONDENT_NAME,
      });

      component.onSubmit({
        preventDefault: jest.fn(),
      } as unknown as SubmitEvent);

      expect(searchFormService.state()).toEqual(
        expect.objectContaining({
          applicantName: SYNTHETIC_APPLICANT_NAME,
          respondentName: SYNTHETIC_RESPONDENT_NAME,
        }),
      );
    });

    it('restores applicant and respondent names from the form service', () => {
      searchFormService.patchState({
        applicantName: SYNTHETIC_APPLICANT_NAME,
        respondentName: SYNTHETIC_RESPONDENT_NAME,
      });

      const restoredFixture = TestBed.createComponent(Applications);
      const restored = restoredFixture.componentInstance;
      restoredFixture.detectChanges();

      expect(restored.form.controls.applicantName.value).toBe(
        SYNTHETIC_APPLICANT_NAME,
      );
      expect(restored.form.controls.respondentName.value).toBe(
        SYNTHETIC_RESPONDENT_NAME,
      );
      expect(
        (
          restoredFixture.nativeElement.querySelector(
            '#applicantName',
          ) as HTMLInputElement
        ).value,
      ).toBe(SYNTHETIC_APPLICANT_NAME);
      expect(
        (
          restoredFixture.nativeElement.querySelector(
            '#respondentName',
          ) as HTMLInputElement
        ).value,
      ).toBe(SYNTHETIC_RESPONDENT_NAME);
      expect((restored as unknown as HasLoadQuery).loadQuery()).toEqual({
        applicantName: SYNTHETIC_APPLICANT_NAME,
        respondentName: SYNTHETIC_RESPONDENT_NAME,
      });
    });

    it('empties applicant and respondent names when the search is cleared', () => {
      component.form.patchValue({
        applicantName: SYNTHETIC_APPLICANT_NAME,
        respondentName: SYNTHETIC_RESPONDENT_NAME,
      });
      component.onSubmit({
        preventDefault: jest.fn(),
      } as unknown as SubmitEvent);
      fixture.detectChanges();

      component.clearSearch();
      fixture.detectChanges();

      expect(component.form.controls.applicantName.value).toBe('');
      expect(component.form.controls.respondentName.value).toBe('');
      expect(searchFormService.state().applicantName).toBe('');
      expect(searchFormService.state().respondentName).toBe('');
      expect(
        (
          fixture.nativeElement.querySelector(
            '#applicantName',
          ) as HTMLInputElement
        ).value,
      ).toBe('');
      expect(
        (
          fixture.nativeElement.querySelector(
            '#respondentName',
          ) as HTMLInputElement
        ).value,
      ).toBe('');
      expect((component as unknown as HasLoadQuery).loadQuery()).toEqual({});
    });
  });

  describe('applicant and respondent name fields', () => {
    it.each([
      ['applicantName', 'Applicant name'],
      ['respondentName', 'Respondent name'],
    ])(
      'renders %s with its label, hint and a 300 character limit',
      (id, label) => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector(`#${id}`) as HTMLInputElement;

        expect(root.querySelector(`label[for="${id}"]`)?.textContent).toContain(
          label,
        );
        expect(root.querySelector(`#${id}-hint`)?.textContent?.trim()).toBe(
          "Part of an organisation name, or a person's first and last name",
        );
        expect(input.getAttribute('aria-describedby')).toBe(`${id}-hint`);
        expect(input.getAttribute('maxlength')).toBe('300');
      },
    );

    it('searches by applicant name alone', () => {
      getEntriesMock.mockClear();
      component.form.patchValue({ applicantName: SYNTHETIC_APPLICANT_NAME });

      component.onSubmit({
        preventDefault: jest.fn(),
      } as unknown as SubmitEvent);

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      expect(getEntriesMock.mock.calls[0][0]?.filter).toEqual({
        applicantName: SYNTHETIC_APPLICANT_NAME,
      });
      expect(component.vm().searchErrors).toEqual([]);
    });

    it.each([
      [
        'applicantName',
        'Applicant name must be 300 characters or fewer',
      ] as const,
      [
        'respondentName',
        'Respondent name must be 300 characters or fewer',
      ] as const,
    ])(
      'blocks the search and links the summary to #%s when the name is longer than 300 characters',
      (controlName, errorText) => {
        getEntriesMock.mockClear();
        component.form.patchValue({ [controlName]: 'A'.repeat(301) });

        component.onSubmit({
          preventDefault: jest.fn(),
        } as unknown as SubmitEvent);
        fixture.detectChanges();

        expect(getEntriesMock).not.toHaveBeenCalled();
        expect(component.vm().searchErrors).toEqual([
          { id: controlName, href: `#${controlName}`, text: errorText },
        ]);
        expect(
          (fixture.nativeElement as HTMLElement)
            .querySelector(`#${controlName}-error`)
            ?.textContent?.trim(),
        ).toContain(errorText);
      },
    );

    it('accepts names of exactly 300 characters', () => {
      component.form.patchValue({
        applicantName: 'A'.repeat(300),
        respondentName: 'B'.repeat(300),
      });

      expect(component.form.controls.applicantName.valid).toBe(true);
      expect(component.form.controls.respondentName.valid).toBe(true);
    });
  });

  describe('loadApplications', () => {
    it('still loads applications when stale searchErrors are present', () => {
      getEntriesMock.mockClear();

      appStateSignal(component).update((s) => ({
        ...s,
        searchErrors: [{ id: 'x', text: 'err' }],
        isLoading: false,
      }));

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
    });

    it('does nothing when already loading', () => {
      getEntriesMock.mockClear();

      appStateSignal(component).update((s) => ({ ...s, isLoading: true }));

      component.loadApplications();

      expect(getEntriesMock).not.toHaveBeenCalled();
    });

    it('calls API with empty filter when all filters are empty', () => {
      getEntriesMock.mockClear();

      component.form.reset({
        date: null,
        applicantOrg: '',
        respondentOrg: '',
        applicantSurname: '',
        respondentSurname: '',
        applicationTitle: '',
        location: '',
        standardApplicantCode: '',
        respondentPostcode: '',
        accountReference: '',
        court: '',
        cja: '',
        status: null,
      });

      appStateSignal(component).update((s) => ({
        ...s,
        searchErrors: [],
        isLoading: false,
      }));

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      const [params, , , options] = getEntriesMock.mock.calls[0];

      expect(params?.pageNumber).toBe(component.vm().currentPage);
      expect(params?.pageSize).toBe(component.vm().pageSize);
      expect(params?.sort).toEqual(['date,desc']);
      expect(params?.filter).toEqual({});
      expect(options).toEqual(
        expect.objectContaining({
          transferCache: false,
        }),
      );
    });

    it('calls API with correct params and updates rows and pagination on success', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        currentPage: 2,
        pageSize: 25,
        isLoading: false,
      }));

      component.form.patchValue({ applicantOrg: 'Org Ltd' });

      getEntriesMock.mockClear();
      getEntriesMock.mockReturnValueOnce(
        of({
          content: [makeEntry({ id: 'row-1' })],
          totalPages: 5,
          totalElements: 11,
          number: 1,
        } as unknown as EntryPage) as unknown as ReturnType<
          ApplicationListEntriesApi['getEntries']
        >,
      );

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      const [params, , , options] = getEntriesMock.mock.calls[0];

      expect(params?.pageNumber).toBe(component.vm().currentPage);
      expect(params?.pageSize).toBe(component.vm().pageSize);
      expect(params?.sort).toEqual(['date,desc']);
      expect(params?.filter).toEqual(
        expect.objectContaining({
          applicantOrganisation: 'Org Ltd',
        }),
      );
      expect(options).toEqual(
        expect.objectContaining({
          transferCache: false,
        }),
      );

      expect(component.vm().rows.map((r) => r.id)).toEqual(['row-1']);
      expect(component.vm().totalPages).toBe(5);
      expect(component.vm().totalEntries).toBe(11);
      expect(component.vm().currentPage).toBe(2);
      expect(component.vm().isLoading).toBe(false);
    });

    it('handles API error by setting searchErrors and clearing loading state', () => {
      component.form.patchValue({ applicantOrg: 'Org Ltd' });

      getEntriesMock.mockClear();
      getEntriesMock.mockReturnValueOnce(throwError(() => new Error('boom')));

      appStateSignal(component).update((s) => ({
        ...s,
        searchErrors: [],
        isLoading: false,
        errorHint: '',
      }));

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      expect(component.vm().isLoading).toBe(false);
      expect(component.vm().errorHint).toBe('There is a problem');
      expect(component.vm().searchErrors).toHaveLength(1);
      expect(component.vm().searchErrors[0].text).toContain(
        'There was a problem retrieving the applications',
      );
    });

    it('shows the problem text in the error summary when the search returns 400', () => {
      component.form.patchValue({ dateFrom: RANGE_FROM, dateTo: RANGE_TO });
      getEntriesMock.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              statusText: 'Bad Request',
              url: '/application-list-entries',
              error: {
                type: 'ALE-58',
                title: 'Bad Request',
                status: 400,
                detail: SEARCH_PROBLEM_TEXT,
              },
            }),
        ),
      );

      component.loadApplications();
      fixture.detectChanges();

      expect(component.vm().isLoading).toBe(false);
      expect(component.vm().searchErrors).toEqual([
        { id: '', text: SEARCH_PROBLEM_TEXT },
      ]);

      const summary = fixture.nativeElement.querySelector(
        '[data-component="error-summary"]',
      ) as HTMLElement;
      expect(summary.textContent).toContain(SEARCH_PROBLEM_TEXT);
      expect(summary.textContent).not.toContain(
        'There was a problem retrieving the applications',
      );
      expect(fixture.nativeElement.textContent).not.toContain(
        'No results found.',
      );
    });

    it('keeps the generic error when a 400 has no problem details', () => {
      component.form.patchValue({ dateFrom: RANGE_FROM, dateTo: RANGE_TO });
      getEntriesMock.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              statusText: 'Bad Request',
              url: '/application-list-entries?filter=synthetic',
              error: '<html>Bad Request</html>',
            }),
        ),
      );

      component.loadApplications();
      fixture.detectChanges();

      expect(component.vm().searchErrors).toEqual([
        {
          id: '',
          text: 'There was a problem retrieving the applications. Try again.',
        },
      ]);
      expect(fixture.nativeElement.textContent).not.toContain(
        'Http failure response',
      );
    });

    it('keeps the generic error when the search returns 500', () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Org' });
      getEntriesMock.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              statusText: 'Internal Server Error',
              url: '/application-list-entries',
              error: {
                title: 'Internal Server Error',
                status: 500,
                detail: SEARCH_PROBLEM_TEXT,
              },
            }),
        ),
      );

      component.loadApplications();
      fixture.detectChanges();

      expect(component.vm().searchErrors).toEqual([
        {
          id: '',
          text: 'There was a problem retrieving the applications. Try again.',
        },
      ]);
      expect(fixture.nativeElement.textContent).not.toContain(
        SEARCH_PROBLEM_TEXT,
      );
    });
  });

  describe('list date range', () => {
    const submitSearch = () => {
      component.onSubmit({
        preventDefault: jest.fn(),
      } as unknown as SubmitEvent);
      fixture.detectChanges();
    };

    const root = () => fixture.nativeElement as HTMLElement;

    const isBefore = (first: Element | null, second: Element | null) =>
      !!first &&
      !!second &&
      !!(
        first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
      );

    it('renders List date from and List date to under Or search a date range, after List date', () => {
      const group = root().querySelector(
        '[role="group"][aria-labelledby="date-range-heading"]',
      );
      const heading = root().querySelector('#date-range-heading');
      const legends = Array.from(root().querySelectorAll('legend')).map(
        (legend) => legend.textContent?.trim(),
      );

      expect(heading?.textContent?.trim()).toBe('Or search a date range');
      expect(legends).toEqual(
        expect.arrayContaining(['List date from', 'List date to']),
      );
      expect(group?.querySelector('#date-from-day')).toBeTruthy();
      expect(group?.querySelector('#date-to-day')).toBeTruthy();
      expect(group?.querySelector('#date-day')).toBeNull();
      expect(isBefore(root().querySelector('#date-day'), heading)).toBe(true);
      expect(
        isBefore(
          root().querySelector('#date-from-day'),
          root().querySelector('#date-to-day'),
        ),
      ).toBe(true);
    });

    it('searches by a date range alone', () => {
      getEntriesMock.mockClear();
      component.form.patchValue({ dateFrom: RANGE_FROM, dateTo: RANGE_TO });

      submitSearch();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      expect(getEntriesMock.mock.calls[0][0]?.filter).toEqual({
        dateFrom: RANGE_FROM,
        dateTo: RANGE_TO,
      });
      expect(component.vm().searchErrors).toEqual([]);
    });

    it('blocks a reversed range and links the summary to #date-to-day', () => {
      getEntriesMock.mockClear();
      component.form.patchValue({ dateFrom: RANGE_TO, dateTo: RANGE_FROM });

      submitSearch();

      expect(getEntriesMock).not.toHaveBeenCalled();
      expect(component.vm().searchErrors).toEqual([
        {
          id: 'dateTo',
          href: '#date-to-day',
          text: 'List date to must be on or after List date from',
        },
      ]);
      expect(
        root().querySelector('#date-to-error')?.textContent?.trim(),
      ).toContain('List date to must be on or after List date from');
      expect(root().querySelector('#date-from-error')).toBeNull();
    });

    it('blocks a list date combined with a date range and shows the not-both message', () => {
      getEntriesMock.mockClear();
      component.form.patchValue({ date: LIST_DATE, dateFrom: RANGE_FROM });

      submitSearch();

      expect(getEntriesMock).not.toHaveBeenCalled();
      expect(component.vm().searchErrors).toEqual([
        {
          id: 'date',
          href: '#date',
          text: 'Enter a list date or a date range, not both',
        },
      ]);
      expect(root().querySelector('#date-error')?.textContent).toContain(
        'Enter a list date or a date range, not both',
      );
    });

    it('clears the not-both error once the list date is removed', () => {
      component.form.patchValue({ date: LIST_DATE, dateTo: RANGE_TO });
      expect(
        component.form.controls.date.hasError('singleDateOrDateRange'),
      ).toBe(true);

      component.form.controls.date.setValue(null);

      expect(component.form.controls.date.errors).toBeNull();
      expect(component.form.hasError('singleDateOrDateRange')).toBe(false);
    });

    it('links an incomplete List date from to #date-from-day', () => {
      getEntriesMock.mockClear();
      const day = root().querySelector('#date-from-day') as HTMLInputElement;
      day.value = '1';
      day.dispatchEvent(new Event('input', { bubbles: true }));

      submitSearch();

      expect(getEntriesMock).not.toHaveBeenCalled();
      expect(component.vm().searchErrors).toEqual([
        {
          id: 'dateFrom',
          href: '#date-from-day',
          text: 'List date from must be a valid date',
        },
      ]);
    });

    it('names each range field in the summary when both are incomplete', () => {
      getEntriesMock.mockClear();
      const typeDay = (id: string, value: string) => {
        const input = root().querySelector(`#${id}`) as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };
      typeDay('date-from-day', '1');
      typeDay('date-to-day', '2');

      submitSearch();

      const errors = component.vm().searchErrors;
      expect(getEntriesMock).not.toHaveBeenCalled();
      expect(errors).toEqual([
        {
          id: 'dateFrom',
          href: '#date-from-day',
          text: 'List date from must be a valid date',
        },
        {
          id: 'dateTo',
          href: '#date-to-day',
          text: 'List date to must be a valid date',
        },
      ]);
      expect(new Set(errors.map((error) => error.text)).size).toBe(2);
    });

    it('keeps date sorting enabled for a date range', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        getFilters: { dateFrom: RANGE_FROM, dateTo: RANGE_TO },
      }));

      expect(component.disabledSortColumns()).toEqual([]);
    });

    it('saves the date range to the form service on submit', () => {
      component.form.patchValue({ dateFrom: RANGE_FROM, dateTo: RANGE_TO });

      submitSearch();

      expect(searchFormService.state()).toEqual(
        expect.objectContaining({ dateFrom: RANGE_FROM, dateTo: RANGE_TO }),
      );
      expect(searchStateService.state().appliedFilters).toEqual({
        dateFrom: RANGE_FROM,
        dateTo: RANGE_TO,
      });
    });

    it('restores the date range from the form service', () => {
      searchFormService.patchState({ dateFrom: RANGE_FROM, dateTo: RANGE_TO });

      const restoredFixture = TestBed.createComponent(Applications);
      const restored = restoredFixture.componentInstance;
      restoredFixture.detectChanges();
      const restoredRoot = restoredFixture.nativeElement as HTMLElement;
      const valueOf = (id: string) =>
        (restoredRoot.querySelector(`#${id}`) as HTMLInputElement).value;

      expect(restored.form.controls.dateFrom.value).toBe(RANGE_FROM);
      expect(restored.form.controls.dateTo.value).toBe(RANGE_TO);
      expect(
        ['date-from-day', 'date-from-month', 'date-from-year'].map(valueOf),
      ).toEqual(['01', '05', '2026']);
      expect(
        ['date-to-day', 'date-to-month', 'date-to-year'].map(valueOf),
      ).toEqual(['31', '05', '2026']);
      expect((restored as unknown as HasLoadQuery).loadQuery()).toEqual({
        dateFrom: RANGE_FROM,
        dateTo: RANGE_TO,
      });
    });

    it('empties the date range when the search is cleared', () => {
      component.form.patchValue({ dateFrom: RANGE_FROM, dateTo: RANGE_TO });
      submitSearch();

      component.clearSearch();
      fixture.detectChanges();

      expect(component.form.controls.dateFrom.value).toBeNull();
      expect(component.form.controls.dateTo.value).toBeNull();
      expect(searchFormService.state().dateFrom).toBeNull();
      expect(searchFormService.state().dateTo).toBeNull();
      expect(
        (root().querySelector('#date-from-day') as HTMLInputElement).value,
      ).toBe('');
      expect(
        (root().querySelector('#date-to-day') as HTMLInputElement).value,
      ).toBe('');
      expect((component as unknown as HasLoadQuery).loadQuery()).toEqual({});
    });
  });

  describe('application codes and result codes', () => {
    const APPLICATION_CODE_A_LABEL = `${APPLICATION_CODE_A} - Synthetic application one`;
    const APPLICATION_CODE_B_LABEL = `${APPLICATION_CODE_B} - Synthetic search warrant two`;
    const RESULT_CODE_A_LABEL = `${RESULT_CODE_A} - Synthetic result one`;
    const RESULT_CODE_B_LABEL = `${RESULT_CODE_B} - Synthetic result two`;

    const root = () => fixture.nativeElement as HTMLElement;

    const loadQuery = () => (component as unknown as HasLoadQuery).loadQuery();

    const submitSearch = () => {
      component.onSubmit({
        preventDefault: jest.fn(),
      } as unknown as SubmitEvent);
      fixture.detectChanges();
    };

    const advancedSearch = (element: HTMLElement = root()) =>
      Array.from(element.querySelectorAll('details')).find((details) =>
        details
          .querySelector('summary')
          ?.textContent?.includes('Advanced search'),
      );

    const typeInto = (id: string, text: string) => {
      const input = root().querySelector(`input#${id}`) as HTMLInputElement;
      input.focus();
      input.value = text;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    const offeredLabels = () =>
      Array.from(root().querySelectorAll<HTMLElement>('[role="option"]')).map(
        (option) => option.textContent?.trim(),
      );

    const clickOption = (label: string) => {
      const option = Array.from(
        root().querySelectorAll<HTMLElement>('[role="option"]'),
      ).find((item) => item.textContent?.trim() === label);
      expect(option).toBeDefined();
      option?.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
      );
      option?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();
    };

    const selectedLabels = (id: string, element: HTMLElement = root()) =>
      Array.from(
        element.querySelectorAll<HTMLElement>(
          `#${id}-selected .govuk-summary-list__value`,
        ),
      ).map((row) => row.textContent?.trim());

    // The heading rendered just before a field's own selected list
    const selectedHeading = (id: string, element: HTMLElement = root()) =>
      element
        .querySelector(`#${id}-selected`)
        ?.previousElementSibling?.textContent?.trim();

    const summaryLinks = () =>
      Array.from(
        root().querySelectorAll<HTMLAnchorElement>(
          '.govuk-error-summary__list a',
        ),
      ).map((link) => ({
        href: link.getAttribute('href'),
        text: link.textContent?.trim(),
      }));

    const setOptions = () => {
      applicationCodes.set([
        makeApplicationCode(APPLICATION_CODE_A, 'Synthetic application one'),
        makeApplicationCode(APPLICATION_CODE_B, 'Synthetic search warrant two'),
      ]);
      resultCodes.set([
        { resultCode: RESULT_CODE_A, title: 'Synthetic result one' },
        { resultCode: RESULT_CODE_B, title: 'Synthetic result two' },
      ]);
      fixture.detectChanges();
    };

    it.each([
      [
        'applicationCodes',
        'Application codes',
        'Start typing a code or title. You can add more than one.',
      ],
      [
        'resultCodes',
        'Result codes',
        'Finds applications with any of these results recorded',
      ],
    ])(
      'renders %s under Advanced search with its label and hint',
      (id, label, hint) => {
        const advanced = advancedSearch();

        expect(advanced?.querySelector(`input#${id}`)).toBeTruthy();
        expect(
          advanced?.querySelector(`#${id}-label`)?.textContent?.trim(),
        ).toBe(label);
        expect(
          advanced?.querySelector(`#${id}-hint`)?.textContent?.trim(),
        ).toBe(hint);
      },
    );

    it('requests result codes when the page initialises', () => {
      expect(referenceDataFacadeStub.ensureResultCodes).toHaveBeenCalledTimes(
        1,
      );
    });

    it('offers application codes by code and title and adds the chosen code to the form', () => {
      setOptions();

      typeInto('applicationCodes', 'synthetic');

      expect(offeredLabels()).toEqual([
        APPLICATION_CODE_A_LABEL,
        APPLICATION_CODE_B_LABEL,
      ]);

      clickOption(APPLICATION_CODE_B_LABEL);

      expect(selectedHeading('applicationCodes')).toBe(
        'Selected application codes',
      );
      expect(component.form.controls.applicationCodes.value).toEqual([
        APPLICATION_CODE_B,
      ]);
      expect(selectedLabels('applicationCodes')).toEqual([
        APPLICATION_CODE_B_LABEL,
      ]);
    });

    it('offers result codes by code and title and adds the chosen code to the form', () => {
      setOptions();

      typeInto('resultCodes', 'result two');

      expect(offeredLabels()).toEqual([RESULT_CODE_B_LABEL]);

      clickOption(RESULT_CODE_B_LABEL);

      expect(selectedHeading('resultCodes')).toBe('Selected result codes');
      expect(component.form.controls.resultCodes.value).toEqual([
        RESULT_CODE_B,
      ]);
      expect(selectedLabels('resultCodes')).toEqual([RESULT_CODE_B_LABEL]);
    });

    describe.each([
      [
        'applicationCodes',
        APPLICATION_CODE_A,
        `${APPLICATION_CODE_A} - Synthetic application one`,
        'Select an application code from the list, or clear the text',
      ],
      [
        'resultCodes',
        RESULT_CODE_A,
        `${RESULT_CODE_A} - Synthetic result one`,
        'Select a result code from the list, or clear the text',
      ],
    ] as const)(
      '%s typed but not picked',
      (controlName, code, codeLabel, errorText) => {
        const expectBlocked = () => {
          expect(getEntriesMock).not.toHaveBeenCalled();
          expect(component.vm().searchErrors).toEqual([
            { id: controlName, href: `#${controlName}`, text: errorText },
          ]);
          expect(summaryLinks()).toEqual([
            { href: `#${controlName}`, text: errorText },
          ]);
          expect(
            root().querySelector(`#${controlName}-error`)?.textContent?.trim(),
          ).toBe(`Error: ${errorText}`);
          expect(
            root().querySelector(`input#${controlName}`)?.classList,
          ).toContain('govuk-input--error');
        };

        beforeEach(() => {
          setOptions();
          getEntriesMock.mockClear();
        });

        it('blocks a search by that field alone and shows the error inline and in the summary', () => {
          typeInto(controlName, code);

          submitSearch();

          expectBlocked();
          expect(component.form.controls[controlName].value).toEqual([]);
          expect(
            (root().querySelector(`input#${controlName}`) as HTMLInputElement)
              .value,
          ).toBe(code);
        });

        it('blocks a search with another filter and shows the error inline and in the summary', () => {
          component.form.patchValue({ applicantOrg: 'Synthetic Org' });
          typeInto(controlName, code);

          submitSearch();

          expectBlocked();
        });

        it('clears the error once the code is picked and then sends it', () => {
          typeInto(controlName, code);
          submitSearch();
          expectBlocked();

          clickOption(codeLabel);

          expect(component.form.controls[controlName].errors).toBeNull();
          expect(root().querySelector(`#${controlName}-error`)).toBeNull();

          submitSearch();

          expect(getEntriesMock).toHaveBeenCalledTimes(1);
          expect(getEntriesMock.mock.calls[0][0]?.filter).toEqual({
            [controlName]: [code],
          });
          expect(component.vm().searchErrors).toEqual([]);
          expect(summaryLinks()).toEqual([]);
        });

        it('clears the error and the typed text when the search is cleared', () => {
          typeInto(controlName, code);
          submitSearch();
          expectBlocked();

          component.clearSearch();
          fixture.detectChanges();

          expect(component.form.controls[controlName].errors).toBeNull();
          expect(
            (root().querySelector(`input#${controlName}`) as HTMLInputElement)
              .value,
          ).toBe('');
          expect(root().querySelector(`#${controlName}-error`)).toBeNull();
          expect(summaryLinks()).toEqual([]);
        });
      },
    );

    it.each([
      ['applicationCodes', 50],
      ['resultCodes', 20],
    ] as const)('stops adding %s at %i codes', (id, maxItems) => {
      const codes = Array.from(
        { length: maxItems },
        (_, index) => `XC${String(index).padStart(4, '0')}`,
      );

      component.form.controls[id].setValue(codes.slice(0, -1));
      fixture.detectChanges();
      expect(root().querySelector(`#${id}-hint`)?.textContent?.trim()).not.toBe(
        `You can add up to ${maxItems}`,
      );

      component.form.controls[id].setValue(codes);
      fixture.detectChanges();
      expect(root().querySelector(`#${id}-hint`)?.textContent?.trim()).toBe(
        `You can add up to ${maxItems}`,
      );
    });

    it('maps both lists into the filter as new arrays', () => {
      component.form.patchValue({
        applicationCodes: [APPLICATION_CODE_A, APPLICATION_CODE_B],
        resultCodes: [RESULT_CODE_A],
      });

      const filter = loadQuery();

      expect(filter).toEqual({
        applicationCodes: [APPLICATION_CODE_A, APPLICATION_CODE_B],
        resultCodes: [RESULT_CODE_A],
      });
      expect(filter.applicationCodes).not.toBe(
        component.form.controls.applicationCodes.value,
      );
      expect(filter.resultCodes).not.toBe(
        component.form.controls.resultCodes.value,
      );
    });

    it('leaves out empty lists', () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Org' });

      const filter = loadQuery();

      expect(filter).toEqual({ applicantOrganisation: 'Synthetic Org' });
      expect(filter).not.toHaveProperty('applicationCodes');
      expect(filter).not.toHaveProperty('resultCodes');
    });

    it('trims codes and leaves out blanks and repeats', () => {
      component.form.patchValue({
        applicationCodes: [
          ` ${APPLICATION_CODE_A} `,
          '',
          APPLICATION_CODE_A,
          '   ',
        ],
        resultCodes: ['  '],
      });

      expect(loadQuery()).toEqual({ applicationCodes: [APPLICATION_CODE_A] });
    });

    it.each([
      ['applicationCodes', [APPLICATION_CODE_A]],
      ['resultCodes', [RESULT_CODE_A]],
    ] as const)('searches by %s alone', (controlName, codes) => {
      getEntriesMock.mockClear();
      component.form.controls[controlName].setValue([...codes]);

      submitSearch();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      expect(getEntriesMock.mock.calls[0][0]?.filter).toEqual({
        [controlName]: codes,
      });
      expect(component.vm().searchErrors).toEqual([]);
    });

    it('saves both lists to the form service and the applied filters on submit', () => {
      component.form.patchValue({
        applicationCodes: [APPLICATION_CODE_A],
        resultCodes: [RESULT_CODE_A, RESULT_CODE_B],
      });

      submitSearch();

      expect(searchFormService.state()).toEqual(
        expect.objectContaining({
          applicationCodes: [APPLICATION_CODE_A],
          resultCodes: [RESULT_CODE_A, RESULT_CODE_B],
        }),
      );
      expect(searchStateService.state().appliedFilters).toEqual({
        applicationCodes: [APPLICATION_CODE_A],
        resultCodes: [RESULT_CODE_A, RESULT_CODE_B],
      });
    });

    it('restores both lists and reruns the search after navigation', () => {
      setOptions();
      getEntriesMock.mockClear();
      component.form.patchValue({
        applicationCodes: [APPLICATION_CODE_A, APPLICATION_CODE_B],
        resultCodes: [RESULT_CODE_B],
      });
      submitSearch();

      const restoredFixture = TestBed.createComponent(Applications);
      const restored = restoredFixture.componentInstance;
      restoredFixture.detectChanges();
      const restoredRoot = restoredFixture.nativeElement as HTMLElement;

      expect(restored.form.controls.applicationCodes.value).toEqual([
        APPLICATION_CODE_A,
        APPLICATION_CODE_B,
      ]);
      expect(restored.form.controls.resultCodes.value).toEqual([RESULT_CODE_B]);
      expect(getEntriesMock).toHaveBeenCalledTimes(2);
      expect(getEntriesMock.mock.calls[1][0]?.filter).toEqual({
        applicationCodes: [APPLICATION_CODE_A, APPLICATION_CODE_B],
        resultCodes: [RESULT_CODE_B],
      });
      expect(selectedLabels('applicationCodes', restoredRoot)).toEqual([
        APPLICATION_CODE_A_LABEL,
        APPLICATION_CODE_B_LABEL,
      ]);
      expect(selectedLabels('resultCodes', restoredRoot)).toEqual([
        RESULT_CODE_B_LABEL,
      ]);
      expect(selectedHeading('applicationCodes', restoredRoot)).toBe(
        'Selected application codes',
      );
      expect(selectedHeading('resultCodes', restoredRoot)).toBe(
        'Selected result codes',
      );
    });

    it('empties both lists when the search is cleared', () => {
      setOptions();
      component.form.patchValue({
        applicationCodes: [APPLICATION_CODE_A],
        resultCodes: [RESULT_CODE_A],
      });
      submitSearch();
      expect(selectedLabels('applicationCodes')).toEqual([
        APPLICATION_CODE_A_LABEL,
      ]);
      expect(selectedLabels('resultCodes')).toEqual([RESULT_CODE_A_LABEL]);

      component.clearSearch();
      fixture.detectChanges();

      expect(component.form.controls.applicationCodes.value).toEqual([]);
      expect(component.form.controls.resultCodes.value).toEqual([]);
      expect(searchFormService.state().applicationCodes).toEqual([]);
      expect(searchFormService.state().resultCodes).toEqual([]);
      expect(root().querySelector('#applicationCodes-selected')).toBeNull();
      expect(root().querySelector('#resultCodes-selected')).toBeNull();
      expect(loadQuery()).toEqual({});
    });

    it('does not give the form the shared default arrays when the search is cleared', () => {
      component.clearSearch();

      expect(component.form.controls.applicationCodes.value).not.toBe(
        DEFAULT_APPLICATIONS_SEARCH_FORM.applicationCodes,
      );
      expect(component.form.controls.resultCodes.value).not.toBe(
        DEFAULT_APPLICATIONS_SEARCH_FORM.resultCodes,
      );
    });

    it('keeps the saved search unchanged when the form lists are changed in place', () => {
      component.form.patchValue({
        applicationCodes: [APPLICATION_CODE_A],
        resultCodes: [RESULT_CODE_A],
      });
      submitSearch();

      component.form.controls.applicationCodes.value.push(APPLICATION_CODE_B);
      component.form.controls.resultCodes.value.push(RESULT_CODE_B);

      expect(searchFormService.state().applicationCodes).toEqual([
        APPLICATION_CODE_A,
      ]);
      expect(searchFormService.state().resultCodes).toEqual([RESULT_CODE_A]);
      expect(searchStateService.state().appliedFilters).toEqual({
        applicationCodes: [APPLICATION_CODE_A],
        resultCodes: [RESULT_CODE_A],
      });
      expect(component.vm().getFilters).toEqual({
        applicationCodes: [APPLICATION_CODE_A],
        resultCodes: [RESULT_CODE_A],
      });
    });

    it('sends both lists in the filter of a select-all-matching bulk preview', async () => {
      getEntriesMock.mockReturnValue(
        of({
          content: [
            makeEntry({ id: 'entry-1', listId: 'list-a' }),
            makeEntry({ id: 'entry-2', listId: 'list-b' }),
          ],
          totalPages: 2,
          totalElements: 12,
          number: 0,
        } as unknown as EntryPage) as unknown as ReturnType<
          ApplicationListEntriesApi['getEntries']
        >,
      );
      component.form.patchValue({
        applicationCodes: [APPLICATION_CODE_A, APPLICATION_CODE_B],
        resultCodes: [RESULT_CODE_A],
      });
      submitSearch();
      component.onHeaderSelectAllChange(true);
      bulkActionPreviewMock.mockClear();

      await (
        component as unknown as {
          getBulkPreviewData: (action: BulkActionType) => Promise<unknown>;
        }
      ).getBulkPreviewData(BulkActionType.PRINT_PAGE);

      expect(bulkActionPreviewMock).toHaveBeenCalledTimes(1);
      expect(bulkActionPreviewMock).toHaveBeenCalledWith({
        bulkActionPreviewRequestDto: {
          action: BulkActionType.PRINT_PAGE,
          selection: {
            selectionType: 'FILTER',
            filter: {
              applicationCodes: [APPLICATION_CODE_A, APPLICATION_CODE_B],
              resultCodes: [RESULT_CODE_A],
            },
          },
        },
      });
    });
  });

  describe('other courts', () => {
    const COURT_ONE = 'SYN001';
    const COURT_TWO = 'SYN002';
    const COURT_THREE = 'SYN003';
    const COURT_ONE_LABEL = `${COURT_ONE} - Synthetic Court One`;
    const COURT_TWO_LABEL = `${COURT_TWO} - Synthetic Court Two`;
    const COURT_THREE_LABEL = `${COURT_THREE} - Synthetic Court Three`;
    const ENDED_COURT = 'SYN900';
    const ENDED_COURT_LABEL = `${ENDED_COURT} - Synthetic Closed Court`;
    const OTHER_COURTS_HINT =
      'Start typing a court name or code. You can add more than one.';
    const OTHER_COURTS_ERROR =
      'Select a court from the list, or clear the text';

    const COURTS: CourtLocationGetSummaryDto[] = [
      { courtId: 1, locationCode: COURT_ONE, name: 'Synthetic Court One' },
      { courtId: 2, locationCode: COURT_TWO, name: 'Synthetic Court Two' },
      { courtId: 3, locationCode: COURT_THREE, name: 'Synthetic Court Three' },
    ];
    const CJA_AREA: CriminalJusticeAreaGetDto = {
      code: 'CJ99',
      description: 'Synthetic Area',
    };

    const root = () => fixture.nativeElement as HTMLElement;

    const loadQuery = () => (component as unknown as HasLoadQuery).loadQuery();

    const submitSearch = () => {
      component.onSubmit({
        preventDefault: jest.fn(),
      } as unknown as SubmitEvent);
      fixture.detectChanges();
    };

    const inputById = (id: string, element: HTMLElement = root()) =>
      element.querySelector(`input#${id}`) as HTMLInputElement;

    const typeInto = (id: string, text: string) => {
      const input = inputById(id);
      input.focus();
      input.value = text;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    const offeredLabels = () =>
      Array.from(root().querySelectorAll<HTMLElement>('[role="option"]')).map(
        (option) => option.textContent?.trim(),
      );

    const clickOption = (label: string) => {
      const option = Array.from(
        root().querySelectorAll<HTMLElement>('[role="option"]'),
      ).find((item) => item.textContent?.trim() === label);
      expect(option).toBeDefined();
      option?.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
      );
      option?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();
    };

    const selectedLabels = (element: HTMLElement = root()) =>
      Array.from(
        element.querySelectorAll<HTMLElement>(
          '#courtCodes-selected .govuk-summary-list__value',
        ),
      ).map((row) => row.textContent?.trim());

    const summaryLinks = () =>
      Array.from(
        root().querySelectorAll<HTMLAnchorElement>(
          '.govuk-error-summary__list a',
        ),
      ).map((link) => ({
        href: link.getAttribute('href'),
        text: link.textContent?.trim(),
      }));

    const setOtherCourts = (codes: string[]) => {
      component.form.controls.courtCodes.setValue(codes);
      fixture.detectChanges();
    };

    beforeEach(() => {
      courtLocations.next(COURTS);
      cjas.next([CJA_AREA]);
      fixture.detectChanges();
      getEntriesMock.mockClear();
    });

    it('renders Other courts straight after Court, outside Advanced search, with its label and hint', () => {
      const courtRow = inputById('court').closest('.govuk-grid-row');

      expect(
        courtRow?.nextElementSibling?.querySelector('input#courtCodes'),
      ).toBe(inputById('courtCodes'));
      expect(inputById('courtCodes').closest('details')).toBeNull();
      expect(
        root().querySelector('#courtCodes-label')?.textContent?.trim(),
      ).toBe('Other courts');
      expect(
        root().querySelector('#courtCodes-hint')?.textContent?.trim(),
      ).toBe(OTHER_COURTS_HINT);
    });

    it('offers the active courts the Court field uses and adds the chosen court', () => {
      typeInto('courtCodes', 'synthetic court');

      expect(offeredLabels()).toEqual([
        COURT_ONE_LABEL,
        COURT_TWO_LABEL,
        COURT_THREE_LABEL,
      ]);

      clickOption(COURT_TWO_LABEL);

      expect(component.form.controls.courtCodes.value).toEqual([COURT_TWO]);
      expect(selectedLabels()).toEqual([COURT_TWO_LABEL]);
      expect(
        root()
          .querySelector('#courtCodes-selected')
          ?.previousElementSibling?.textContent?.trim(),
      ).toBe('Selected other courts');
    });

    it('labels a court that is not an active court from courtChipLabels', () => {
      component.courtChipLabels.set({ [ENDED_COURT]: ENDED_COURT_LABEL });

      setOtherCourts([COURT_ONE, ENDED_COURT]);

      expect(selectedLabels()).toEqual([COURT_ONE_LABEL, ENDED_COURT_LABEL]);
    });

    it('stops adding at 19, so Court and Other courts together stay within the 20 the API allows', () => {
      const codes = Array.from(
        { length: 19 },
        (_, index) => `SYN${String(100 + index)}`,
      );

      setOtherCourts(codes.slice(0, -1));
      expect(
        root().querySelector('#courtCodes-hint')?.textContent?.trim(),
      ).toBe(OTHER_COURTS_HINT);

      setOtherCourts(codes);
      expect(
        root().querySelector('#courtCodes-hint')?.textContent?.trim(),
      ).toBe('You can add up to 19');

      component.form.patchValue({ court: COURT_ONE });
      expect(loadQuery().courtCodes).toHaveLength(20);
    });

    it.each([
      ['Court alone', { court: ` ${COURT_ONE} ` }, COURT_ONE],
      ['one other court alone', { courtCodes: [COURT_TWO] }, COURT_TWO],
      [
        'Court and the same court in Other courts',
        { court: COURT_ONE, courtCodes: [COURT_ONE.toLowerCase()] },
        COURT_ONE,
      ],
    ])('sends one court as courtCode for %s', (_, value, courtCode) => {
      component.form.patchValue(value);

      const filter = loadQuery();

      expect(filter).toEqual({ courtCode });
      expect(filter).not.toHaveProperty('courtCodes');
    });

    it.each([
      [
        'Court and other courts',
        { court: COURT_ONE, courtCodes: [COURT_TWO, COURT_THREE] },
        [COURT_ONE, COURT_TWO, COURT_THREE],
      ],
      [
        'other courts alone',
        { courtCodes: [COURT_TWO, COURT_THREE] },
        [COURT_TWO, COURT_THREE],
      ],
    ])(
      'sends several courts as courtCodes and never courtCode for %s',
      (_, value, courtCodes) => {
        component.form.patchValue(value);

        const filter = loadQuery();

        expect(filter).toEqual({ courtCodes });
        expect(filter).not.toHaveProperty('courtCode');
      },
    );

    it('removes repeats across Court and Other courts, ignoring case and blanks, and keeps the first spelling', () => {
      component.form.patchValue({
        court: ` ${COURT_ONE} `,
        courtCodes: [
          COURT_ONE.toLowerCase(),
          COURT_TWO,
          ` ${COURT_TWO.toLowerCase()} `,
          '  ',
          COURT_THREE,
        ],
      });

      expect(loadQuery()).toEqual({
        courtCodes: [COURT_ONE, COURT_TWO, COURT_THREE],
      });
    });

    it('sends Other courts as a new array', () => {
      setOtherCourts([COURT_ONE, COURT_TWO]);

      const filter = loadQuery();

      expect(filter.courtCodes).toEqual([COURT_ONE, COURT_TWO]);
      expect(filter.courtCodes).not.toBe(
        component.form.controls.courtCodes.value,
      );
    });

    it('leaves out Court and Other courts when both are empty', () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Org' });

      const filter = loadQuery();

      expect(filter).toEqual({ applicantOrganisation: 'Synthetic Org' });
      expect(filter).not.toHaveProperty('courtCode');
      expect(filter).not.toHaveProperty('courtCodes');
    });

    it('searches by Other courts alone', () => {
      setOtherCourts([COURT_ONE, COURT_TWO]);

      submitSearch();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      expect(getEntriesMock.mock.calls[0][0]?.filter).toEqual({
        courtCodes: [COURT_ONE, COURT_TWO],
      });
      expect(component.vm().searchErrors).toEqual([]);
    });

    it('disables Other location and CJA while Other courts holds a court', () => {
      typeInto('courtCodes', 'court one');
      clickOption(COURT_ONE_LABEL);

      expect(component.hasOtherCourts()).toBe(true);
      expect(inputById('cja').disabled).toBe(true);
      expect(inputById('location').disabled).toBe(true);
      expect(inputById('court').disabled).toBe(false);
      expect(inputById('courtCodes').disabled).toBe(false);

      // Removing the last court enables them again
      root()
        .querySelector<HTMLAnchorElement>('#courtCodes-selected a')
        ?.click();
      fixture.detectChanges();

      expect(component.form.controls.courtCodes.value).toEqual([]);
      expect(inputById('cja').disabled).toBe(false);
      expect(inputById('location').disabled).toBe(false);
    });

    it.each([
      ['an empty list', []],
      ['a list of blank codes', ['  ']],
    ])('counts %s in Other courts as no court', (_, codes) => {
      setOtherCourts(codes);

      expect(component.hasOtherCourts()).toBe(false);
      expect(inputById('cja').disabled).toBe(false);
      expect(inputById('location').disabled).toBe(false);
    });

    it.each([
      ['a CJA is chosen', () => component.selectCja(CJA_AREA)],
      [
        'an Other location is entered',
        () =>
          component.form.controls.location.setValue('Synthetic other location'),
      ],
    ])('disables Other courts and Court when %s', (_, fill) => {
      fill();
      fixture.detectChanges();

      expect(component.form.controls.courtCodes.disabled).toBe(true);
      expect(inputById('courtCodes').disabled).toBe(true);
      expect(inputById('court').disabled).toBe(true);
    });

    it('blocks a search when text typed into Other courts is not picked', () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Org' });
      typeInto('courtCodes', COURT_ONE);

      submitSearch();

      expect(getEntriesMock).not.toHaveBeenCalled();
      expect(summaryLinks()).toEqual([
        { href: '#courtCodes', text: OTHER_COURTS_ERROR },
      ]);
      expect(
        root().querySelector('#courtCodes-error')?.textContent?.trim(),
      ).toBe(`Error: ${OTHER_COURTS_ERROR}`);
    });

    it('drops the Other courts error once a CJA disables it, and searches by the CJA', () => {
      typeInto('courtCodes', COURT_ONE);
      submitSearch();
      expect(getEntriesMock).not.toHaveBeenCalled();

      component.selectCja(CJA_AREA);
      fixture.detectChanges();

      expect(component.form.controls.courtCodes.disabled).toBe(true);
      expect(component.form.controls.courtCodes.errors).toBeNull();

      submitSearch();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      expect(getEntriesMock.mock.calls[0][0]?.filter).toEqual({
        cjaCode: CJA_AREA.code,
      });
      expect(summaryLinks()).toEqual([]);
    });

    it('saves Other courts to the form service and the applied filters on submit', () => {
      setOtherCourts([COURT_ONE, COURT_TWO]);

      submitSearch();

      expect(searchFormService.state().courtCodes).toEqual([
        COURT_ONE,
        COURT_TWO,
      ]);
      expect(searchStateService.state().appliedFilters).toEqual({
        courtCodes: [COURT_ONE, COURT_TWO],
      });
    });

    it('restores Other courts after navigation, reruns the search and keeps CJA disabled', () => {
      setOtherCourts([COURT_TWO, COURT_THREE]);
      submitSearch();

      const restoredFixture = TestBed.createComponent(Applications);
      const restored = restoredFixture.componentInstance;
      restoredFixture.detectChanges();
      const restoredRoot = restoredFixture.nativeElement as HTMLElement;

      expect(restored.form.controls.courtCodes.value).toEqual([
        COURT_TWO,
        COURT_THREE,
      ]);
      expect(getEntriesMock).toHaveBeenCalledTimes(2);
      expect(getEntriesMock.mock.calls[1][0]?.filter).toEqual({
        courtCodes: [COURT_TWO, COURT_THREE],
      });
      expect(selectedLabels(restoredRoot)).toEqual([
        COURT_TWO_LABEL,
        COURT_THREE_LABEL,
      ]);
      expect(inputById('cja', restoredRoot).disabled).toBe(true);
      expect(inputById('location', restoredRoot).disabled).toBe(true);
    });

    it('sends a restored Court and Other courts together as courtCodes', () => {
      component.selectCourthouse(COURTS[0]);
      setOtherCourts([COURT_TWO]);
      submitSearch();

      const restoredFixture = TestBed.createComponent(Applications);
      restoredFixture.detectChanges();

      expect(restoredFixture.componentInstance.form.controls.court.value).toBe(
        COURT_ONE,
      );
      expect(getEntriesMock.mock.calls[1][0]?.filter).toEqual({
        courtCodes: [COURT_ONE, COURT_TWO],
      });
    });

    it('empties Other courts and its labels when the search is cleared', () => {
      component.courtChipLabels.set({ [ENDED_COURT]: ENDED_COURT_LABEL });
      setOtherCourts([COURT_ONE, ENDED_COURT]);
      submitSearch();
      expect(selectedLabels()).toEqual([COURT_ONE_LABEL, ENDED_COURT_LABEL]);

      component.clearSearch();
      fixture.detectChanges();

      expect(component.form.controls.courtCodes.value).toEqual([]);
      expect(component.form.controls.courtCodes.value).not.toBe(
        DEFAULT_APPLICATIONS_SEARCH_FORM.courtCodes,
      );
      expect(searchFormService.state().courtCodes).toEqual([]);
      expect(component.courtChipLabels()).toEqual({});
      expect(root().querySelector('#courtCodes-selected')).toBeNull();
      expect(inputById('cja').disabled).toBe(false);
      expect(loadQuery()).toEqual({});
    });

    it('keeps the saved search unchanged when Other courts is changed in place', () => {
      setOtherCourts([COURT_ONE, COURT_TWO]);
      submitSearch();

      component.form.controls.courtCodes.value.push(COURT_THREE);

      expect(searchFormService.state().courtCodes).toEqual([
        COURT_ONE,
        COURT_TWO,
      ]);
      expect(searchStateService.state().appliedFilters).toEqual({
        courtCodes: [COURT_ONE, COURT_TWO],
      });
      expect(component.vm().getFilters).toEqual({
        courtCodes: [COURT_ONE, COURT_TWO],
      });
    });
  });

  describe('pagination', () => {
    it('onPageChange updates currentPage and reloads applications', () => {
      const loadSpy = jest.spyOn(component, 'loadApplications');

      component.onPageChange(3);

      expect(component.vm().currentPage).toBe(3);
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it('onPageChange uses the last successful filters instead of the live form', () => {
      getEntriesMock.mockClear();

      appStateSignal(component).update((s) => ({
        ...s,
        getFilters: { applicantOrganisation: 'Saved Org' },
        isLoading: false,
      }));

      component.form.patchValue({ respondentPostcode: 'AB12 3CDE' });

      component.onPageChange(2);

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      const [params] = getEntriesMock.mock.calls[0];
      expect(params?.pageNumber).toBe(2);
      expect(params?.sort).toEqual(['date,desc']);
      expect(params?.filter).toEqual({
        applicantOrganisation: 'Saved Org',
      });
    });
  });

  describe('sorting', () => {
    it('onSortChange stores the UI sort key, resets to the first page, and reloads applications', () => {
      const loadSpy = jest.spyOn(component, 'loadApplications');

      appStateSignal(component).update((s) => ({
        ...s,
        currentPage: 3,
      }));

      component.onSortChange({ key: 'title', direction: 'asc' });

      expect(component.vm().sortField).toEqual({
        key: 'title',
        direction: 'asc',
      });
      expect(component.vm().currentPage).toBe(0);
      expect(loadSpy).toHaveBeenCalledWith(component.vm().getFilters);
    });

    it('disables status sorting when a status filter is selected', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        getFilters: { status: ApplicationListStatus.OPEN },
      }));

      expect(
        component.columns().find((column) => column.field === 'status'),
      ).toEqual(expect.objectContaining({ sortable: false }));
    });

    it('disables date sorting for exact date filters but keeps partial columns sortable', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        getFilters: {
          date: '2026-10-01',
          applicantName: 'smith',
          applicationTitle: 'order',
        },
      }));

      expect(component.disabledSortColumns()).toEqual(['date']);
      expect(
        component.columns().find((column) => column.field === 'date'),
      ).toEqual(expect.objectContaining({ sortable: false }));
      expect(
        component.columns().find((column) => column.field === 'applicant'),
      ).not.toEqual(expect.objectContaining({ sortable: false }));
      expect(
        component.columns().find((column) => column.field === 'title'),
      ).not.toEqual(expect.objectContaining({ sortable: false }));
    });

    it('renders the status header as non-sortable when a status filter has been applied', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        rows: [makeEntry({ id: 'row-1' })],
        getFilters: { status: ApplicationListStatus.OPEN },
      }));
      fixture.detectChanges();

      const statusHeader = fixture.debugElement
        .queryAll(By.css('th'))
        .find((header) => header.nativeElement.textContent.includes('Status'));

      expect(statusHeader).toBeTruthy();
      expect(statusHeader?.query(By.css('button'))).toBeNull();
      expect(statusHeader?.attributes['aria-sort']).toBeUndefined();
    });

    it('ignores status sort changes when a status filter has been applied', () => {
      const loadSpy = jest.spyOn(component, 'loadApplications');
      appStateSignal(component).update((s) => ({
        ...s,
        currentPage: 3,
        sortField: { key: 'date', direction: 'desc' },
        getFilters: { status: ApplicationListStatus.OPEN },
      }));

      component.onSortChange({ key: 'status', direction: 'asc' });

      expect(component.vm().sortField).toEqual({
        key: 'date',
        direction: 'desc',
      });
      expect(component.vm().currentPage).toBe(3);
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('ignores date sort changes when an exact date filter has been applied', () => {
      const loadSpy = jest.spyOn(component, 'loadApplications');
      appStateSignal(component).update((s) => ({
        ...s,
        currentPage: 3,
        sortField: { key: 'status', direction: 'asc' },
        getFilters: { date: '2026-10-01' },
      }));

      component.onSortChange({ key: 'date', direction: 'asc' });

      expect(component.vm().sortField).toEqual({
        key: 'status',
        direction: 'asc',
      });
      expect(component.vm().currentPage).toBe(3);
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('keeps status sorting disabled when the draft form status is cleared before submitting', () => {
      const loadSpy = jest.spyOn(component, 'loadApplications');
      appStateSignal(component).update((s) => ({
        ...s,
        currentPage: 3,
        sortField: { key: 'date', direction: 'desc' },
        getFilters: { status: ApplicationListStatus.OPEN },
      }));
      component.form.controls.status.setValue(null);

      expect(
        component.columns().find((column) => column.field === 'status'),
      ).toEqual(expect.objectContaining({ sortable: false }));

      component.onSortChange({ key: 'status', direction: 'asc' });

      expect(component.vm().sortField).toEqual({
        key: 'date',
        direction: 'desc',
      });
      expect(component.vm().currentPage).toBe(3);
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('keeps status sorting enabled when the draft form status is selected before submitting', () => {
      const loadSpy = jest.spyOn(component, 'loadApplications');
      appStateSignal(component).update((s) => ({
        ...s,
        currentPage: 3,
        getFilters: {},
      }));
      component.form.controls.status.setValue('open');

      expect(
        component.columns().find((column) => column.field === 'status'),
      ).not.toEqual(expect.objectContaining({ sortable: false }));

      component.onSortChange({ key: 'status', direction: 'asc' });

      expect(component.vm().sortField).toEqual({
        key: 'status',
        direction: 'asc',
      });
      expect(component.vm().currentPage).toBe(0);
      expect(loadSpy).toHaveBeenCalledWith(component.vm().getFilters);
    });

    it('maps UI column keys to API sort keys', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        isLoading: false,
        sortField: { key: 'applicant', direction: 'asc' },
      }));

      getEntriesMock.mockClear();

      component.loadApplications();

      const [params] = getEntriesMock.mock.calls[0];
      expect(params?.sort).toEqual(['applicantName,asc']);
    });
  });

  describe('row selection', () => {
    it('stores selected ids from the table', () => {
      const selectedIds = new Set(['entry-1', 'entry-2']);

      component.onSelectedIdsChange(selectedIds);

      expect(component.vm().selectedIds).toBe(selectedIds);
    });

    it('header select-all switches to filter selection without fetching IDs', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        rows: [
          makeEntry({ id: 'entry-1', listId: 'list-a' }),
          makeEntry({ id: 'entry-2', listId: 'list-b' }),
        ],
        totalEntries: 4,
        getFilters: { applicantOrganisation: 'Org Ltd' },
      }));

      component.onHeaderSelectAllChange(true);

      expect(bulkActionPreviewMock).not.toHaveBeenCalled();
      expect(component.vm().selectedIds).toEqual(
        new Set(['entry-1', 'entry-2']),
      );
      expect(component.vm().isFilterSelection).toBe(true);
      expect(component.vm().isSelectingAll).toBe(false);
      expect(component.vm().allMatchingSelected).toBe(true);
    });

    it('keeps manually unselected ids as exclusions for a filter selection', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        rows: [
          makeEntry({ id: 'entry-1' }),
          makeEntry({ id: 'entry-2' }),
          makeEntry({ id: 'entry-3' }),
        ],
        totalEntries: 3,
        selectedIds: new Set(['entry-1', 'entry-2', 'entry-3']),
        isFilterSelection: true,
        allMatchingSelected: true,
      }));

      component.onSelectedIdsChange(new Set(['entry-1', 'entry-3']));

      expect(component.vm().excludedEntryIds).toEqual(new Set(['entry-2']));

      bulkActionPreviewMock.mockReturnValueOnce(
        of({
          action: BulkActionType.RESULT_SELECTED,
          limit: 100,
          selectedCount: 2,
          eligibleCount: 2,
          ineligibleCount: 0,
          entryIds: ['entry-1', 'entry-3'],
          entries: [],
        } as BulkActionPreviewResponseDto) as unknown as ReturnType<
          ApplicationListEntriesApi['bulkActionPreview']
        >,
      );

      void (
        component as unknown as {
          getBulkPreviewData: (action: BulkActionType) => Promise<unknown>;
        }
      ).getBulkPreviewData(BulkActionType.RESULT_SELECTED);

      expect(bulkActionPreviewMock).toHaveBeenCalledWith({
        bulkActionPreviewRequestDto: expect.objectContaining({
          action: BulkActionType.RESULT_SELECTED,
          selection: expect.objectContaining({
            selectionType: 'FILTER',
            excludedEntryIds: ['entry-2'],
          }),
        }),
      });
    });

    it('keeps selected rows from other pages and replaces only current-page selections', () => {
      const previousPageRow = makeSelectedRow('entry-page-1', 'list-a');
      const deselectedCurrentPageRow = makeSelectedRow(
        'entry-page-3',
        'list-c',
      );
      const selectedCurrentPageRow = makeSelectedRow('entry-page-2', 'list-b');

      appStateSignal(component).update((s) => ({
        ...s,
        rows: [
          makeEntry({ id: 'entry-page-2', listId: 'list-b' }),
          makeEntry({ id: 'entry-page-3', listId: 'list-c' }),
        ],
        selectedRows: [previousPageRow, deselectedCurrentPageRow],
      }));

      component.onSelectedRowsChange([selectedCurrentPageRow]);

      expect(component.vm().selectedRows).toEqual([
        previousPageRow,
        selectedCurrentPageRow,
      ]);
    });

    it('clears selection when header select-all is unchecked', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedIds: new Set(['entry-1']),
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
        allMatchingSelected: true,
        isSelectingAll: true,
      }));

      component.onHeaderSelectAllChange(false);

      expect(component.vm().selectedIds.size).toBe(0);
      expect(component.vm().selectedRows).toEqual([]);
      expect(component.vm().allMatchingSelected).toBe(false);
      expect(component.vm().isSelectingAll).toBe(false);
    });
  });

  describe('onUpdateNotesClick', () => {
    it('navigates to update-notes with the row application context', async () => {
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const row: ApplicationRow = {
        ...makeSelectedRow('entry-1', 'list-1'),
        applicant: 'William Scott',
        date: '23 Apr 2025',
        fee: 'Yes',
        respondent: 'Ryan Quinn',
        resulted: 'No',
        title: 'Appeal by Case Stated (Civil)',
        status: ApplicationListStatus.CLOSED,
      };

      await component.onUpdateNotesClick(row);

      expect(navSpy).toHaveBeenCalledWith(
        ['/applications-list', 'list-1', 'update-notes', 'entry-1'],
        {
          state: {
            updateNotesApplication: {
              id: 'entry-1',
              applicant: 'William Scott',
              date: '23 Apr 2025',
              fee: 'Yes',
              respondent: 'Ryan Quinn',
              resulted: 'No',
              title: 'Appeal by Case Stated (Civil)',
            },
          },
        },
      );
      expect(component.vm().errorSummary).toEqual([]);
    });

    it('normalises the selected application list status before navigating', async () => {
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const row = {
        ...makeSelectedRow('entry-1', 'list-1'),
        status: 'closed',
      };

      bulkActionPreviewMock.mockReturnValueOnce(
        of({
          action: BulkActionType.UPDATE_NOTES,
          limit: 100,
          selectedCount: 1,
          eligibleCount: 1,
          ineligibleCount: 0,
          entryIds: ['entry-1'],
          entries: [makeEntry({ id: 'entry-1', listId: 'list-1' })],
        } as BulkActionPreviewResponseDto) as unknown as ReturnType<
          ApplicationListEntriesApi['bulkActionPreview']
        >,
      );

      await component.onUpdateNotesClick(row);

      expect(navSpy).toHaveBeenCalledWith(
        ['/applications-list', 'list-1', 'update-notes', 'entry-1'],
        expect.any(Object),
      );
    });

    it('shows a focused error when the selected application list entry status is not closed', async () => {
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const initialAttempt = component.submitAttempt();
      const row = {
        ...makeSelectedRow('entry-1', 'list-1'),
        status: ApplicationListStatus.OPEN,
      };

      await component.onUpdateNotesClick(row);

      expect(navSpy).not.toHaveBeenCalled();
      expect(component.vm().errorSummary).toEqual([
        {
          text: 'Application list entry cannot be updated in its current state. The parent application list is not closed.',
        },
      ]);
      expect(component.submitAttempt()).toBe(initialAttempt + 1);
    });

    it('shows a focused error when the row cannot identify the application list entry', async () => {
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const initialAttempt = component.submitAttempt();
      const row = {
        ...makeSelectedRow('', ''),
        status: ApplicationListStatus.CLOSED,
      };

      await component.onUpdateNotesClick(row);

      expect(navSpy).not.toHaveBeenCalled();
      expect(component.vm().errorSummary).toEqual([
        { text: 'Unable to update notes for selected application' },
      ]);
      expect(component.submitAttempt()).toBe(initialAttempt + 1);
    });

    it('only enables update notes for closed rows with entry and list identifiers', () => {
      expect(
        component.canUpdateNotes({
          ...makeSelectedRow('entry-1', 'list-1'),
          status: ApplicationListStatus.CLOSED,
        }),
      ).toBe(true);
      expect(
        component.canUpdateNotes({
          ...makeSelectedRow('entry-1', 'list-1'),
          status: ApplicationListStatus.OPEN,
        }),
      ).toBe(false);
      expect(
        component.canUpdateNotes({
          ...makeSelectedRow('', 'list-1'),
          status: ApplicationListStatus.CLOSED,
        }),
      ).toBe(false);
    });
  });

  describe('onPrintContinuousClick', () => {
    it('uses the preview response rows before printing', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedIds: new Set(['entry-1', 'entry-2']),
        selectedRows: [
          makeSelectedRow('entry-1', 'list-a'),
          makeSelectedRow('entry-2', 'list-b'),
        ],
        totalPages: 2,
        totalEntries: 2,
        pageSize: 10,
        getFilters: { applicantOrganisation: 'Org Ltd' },
      }));

      getEntriesMock.mockReturnValueOnce(
        of({
          content: [
            makeEntry({ id: 'entry-1', listId: 'list-a' }),
            makeEntry({ id: 'entry-2', listId: 'list-b' }),
          ],
          totalPages: 2,
          totalElements: 2,
          number: 0,
        } as unknown as EntryPage) as unknown as ReturnType<
          ApplicationListEntriesApi['getEntries']
        >,
      );

      printApplicationListsMock.mockReturnValue(
        of([
          makePrintDto({
            entries: [
              {
                id: 'entry-1',
                applicant: {},
                applicationCode: '',
                applicationTitle: '',
                applicationWording: '',
              },
            ],
          }),
          makePrintDto({
            entries: [
              {
                id: 'entry-2',
                applicant: {},
                applicationCode: '',
                applicationTitle: '',
                applicationWording: '',
              },
            ],
          }),
        ]),
      );

      await component.onPrintContinuousClick();
      await flushSignalEffects(fixture);

      expect(getEntriesMock).not.toHaveBeenCalled();
      expect(bulkActionPreviewMock).toHaveBeenCalledWith({
        bulkActionPreviewRequestDto: expect.objectContaining({
          action: BulkActionType.PRINT_CONTINUOUS,
          selection: expect.objectContaining({
            selectionType: 'IDS',
            entryIds: ['entry-1', 'entry-2'],
          }),
        }),
      });
      expect(printApplicationListsMock).toHaveBeenCalledWith(
        {
          bulkGetApplicationListEntriesRequestDto: {
            listIds: ['list-a', 'list-b'],
            entryIds: ['entry-1', 'entry-2'],
          },
        },
        undefined,
        undefined,
        { transferCache: false },
      );
    });

    it('fetches all selected list ids and generates one continuous PDF', async () => {
      const listADto = makePrintDto({
        courtName: 'Court A',
        entries: [
          {
            id: 'entry-a1',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
          {
            id: 'not-selected',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
          {
            id: 'entry-a2',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
        ],
      });
      const listBDto = makePrintDto({
        courtName: 'Court B',
        entries: [
          {
            id: 'entry-b1',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
          {
            id: 'entry-b2',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
        ],
      });

      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [
          makeSelectedRow('entry-a1', 'list-a'),
          makeSelectedRow('entry-a2', 'list-a'),
          makeSelectedRow('entry-b1', 'list-b'),
        ],
      }));

      printApplicationListsMock.mockReturnValue(of([listADto, listBDto]));

      await component.onPrintContinuousClick();
      await flushSignalEffects(fixture);

      expect(printApplicationListsMock).toHaveBeenCalledWith(
        {
          bulkGetApplicationListEntriesRequestDto: {
            listIds: ['list-a', 'list-b'],
            entryIds: ['entry-a1', 'entry-a2', 'entry-b1'],
          },
        },
        undefined,
        undefined,
        { transferCache: false },
      );
      expect(
        pdfServiceStub.generateContinuousApplicationListsPdf,
      ).toHaveBeenCalledWith([listADto, listBDto], false);
    });

    it('shows no entries message when the print API returns no entries', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
      }));
      printApplicationListsMock.mockReturnValue(
        of([
          makePrintDto({
            entries: [],
          }),
        ]),
      );

      await component.onPrintContinuousClick();
      await flushSignalEffects(fixture);

      expect(
        pdfServiceStub.generateContinuousApplicationListsPdf,
      ).not.toHaveBeenCalled();
      expect(component.vm().errorSummary).toEqual([
        { text: APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint },
      ]);
    });

    it('patches a print error when the print API fails', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
      }));
      printApplicationListsMock.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              statusText: 'Server Error',
              error: { detail: 'Print failed' },
            }),
        ),
      );

      await component.onPrintContinuousClick();
      await flushSignalEffects(fixture);

      expect(
        pdfServiceStub.generateContinuousApplicationListsPdf,
      ).not.toHaveBeenCalled();
      expect(component.vm().errorSummary).toEqual([{ text: 'Print failed' }]);
    });

    it('patches a print error when resolving selected rows fails', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedIds: new Set(['entry-1', 'entry-2']),
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
        totalPages: 2,
        totalEntries: 2,
        pageSize: 10,
        getFilters: { applicantOrganisation: 'Org Ltd' },
      }));

      bulkActionPreviewMock.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              statusText: 'Server Error',
              error: { detail: 'Resolve failed' },
            }),
        ),
      );

      await component.onPrintContinuousClick();
      await flushSignalEffects(fixture);

      expect(printApplicationListsMock).not.toHaveBeenCalled();
      expect(component.vm().errorSummary).toEqual([{ text: 'Resolve failed' }]);
    });

    it('patches a generic print error when PDF generation rejects', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
      }));
      printApplicationListsMock.mockReturnValue(
        of([
          makePrintDto({
            entries: [
              {
                id: 'entry-1',
                applicant: {},
                applicationCode: '',
                applicationTitle: '',
                applicationWording: '',
              },
            ],
          }),
        ]),
      );
      pdfServiceStub.generateContinuousApplicationListsPdf.mockImplementationOnce(
        () => {
          throw new Error('pdf failed');
        },
      );

      await component.onPrintContinuousClick();
      await flushSignalEffects(fixture);

      expect(
        pdfServiceStub.generateContinuousApplicationListsPdf,
      ).toHaveBeenCalledTimes(1);
      expect(component.vm().errorSummary).toEqual([
        { text: APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateGeneric },
      ]);
    });
  });

  describe('onPrintPageClick', () => {
    it('fetches all selected list ids and generates one page PDF', async () => {
      const listADto = makePrintDto({
        courtName: 'Court A',
        entries: [
          {
            id: 'entry-a1',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
          {
            id: 'not-selected',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
          {
            id: 'entry-a2',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
        ],
      });
      const listBDto = makePrintDto({
        courtName: 'Court B',
        entries: [
          {
            id: 'entry-b1',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
          {
            id: 'entry-b2',
            applicant: {},
            applicationCode: '',
            applicationTitle: '',
            applicationWording: '',
          },
        ],
      });

      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [
          makeSelectedRow('entry-a1', 'list-a'),
          makeSelectedRow('entry-a2', 'list-a'),
          makeSelectedRow('entry-b1', 'list-b'),
        ],
      }));

      printApplicationListsMock.mockReturnValue(of([listADto, listBDto]));

      await component.onPrintPageClick();
      await flushSignalEffects(fixture);

      expect(printApplicationListsMock).toHaveBeenCalledWith(
        {
          bulkGetApplicationListEntriesRequestDto: {
            listIds: ['list-a', 'list-b'],
            entryIds: ['entry-a1', 'entry-a2', 'entry-b1'],
          },
        },
        undefined,
        undefined,
        { transferCache: false },
      );
      expect(
        pdfServiceStub.generatePagedApplicationListPdf,
      ).toHaveBeenCalledWith([listADto, listBDto], {
        crestUrl: '/assets/govuk-crest.png',
      });
      expect(
        pdfServiceStub.generateContinuousApplicationListsPdf,
      ).not.toHaveBeenCalled();
    });

    it('shows no entries message when the print API returns no entries', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
      }));
      printApplicationListsMock.mockReturnValue(
        of([
          makePrintDto({
            entries: [],
          }),
        ]),
      );

      await component.onPrintPageClick();
      await flushSignalEffects(fixture);

      expect(
        pdfServiceStub.generatePagedApplicationListPdf,
      ).not.toHaveBeenCalled();
      expect(component.vm().errorSummary).toEqual([
        { text: APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint },
      ]);
    });

    it('patches a retry print error when page PDF generation rejects', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
      }));
      printApplicationListsMock.mockReturnValue(
        of([
          makePrintDto({
            entries: [
              {
                id: 'entry-1',
                applicant: {},
                applicationCode: '',
                applicationTitle: '',
                applicationWording: '',
              },
            ],
          }),
        ]),
      );
      pdfServiceStub.generatePagedApplicationListPdf.mockImplementationOnce(
        () => {
          throw new Error('pdf failed');
        },
      );

      await component.onPrintPageClick();
      await flushSignalEffects(fixture);

      expect(
        pdfServiceStub.generatePagedApplicationListPdf,
      ).toHaveBeenCalledTimes(1);
      expect(component.vm().errorSummary).toEqual([
        { text: APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateRetry },
      ]);
    });

    it('keeps loading true until page PDF generation completes', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
      }));
      printApplicationListsMock.mockReturnValue(
        of([
          makePrintDto({
            entries: [
              {
                id: 'entry-1',
                applicant: {},
                applicationCode: '',
                applicationTitle: '',
                applicationWording: '',
              },
            ],
          }),
        ]),
      );

      let resolvePdf: (() => void) | undefined;
      pdfServiceStub.generatePagedApplicationListPdf.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolvePdf = resolve;
        }),
      );

      await component.onPrintPageClick();
      fixture.detectChanges();
      await Promise.resolve();
      fixture.detectChanges();

      expect(component.vm().loading).toBe(true);

      resolvePdf?.();
      await flushSignalEffects(fixture);

      expect(component.vm().loading).toBe(false);
    });
  });

  describe('onResultSelectedClick', () => {
    it('refocuses the same preview error after Print page, but not on ordinary rerenders', async () => {
      bulkActionPreviewMock.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 413 })),
      );
      const initialAttempt = component.submitAttempt();
      await component.onPrintPageClick();
      await flushSignalEffects(fixture);
      const summary = fixture.nativeElement.querySelector(
        '.govuk-error-summary',
      ) as HTMLElement;
      const message = summary.textContent;
      const focusSpy = jest.spyOn(summary, 'focus');
      const scrollSpy = jest.spyOn(summary, 'scrollIntoView');
      const search = fixture.nativeElement.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;
      search.focus();

      await component.onResultSelectedClick();
      await flushSignalEffects(fixture);

      expect(component.submitAttempt()).toBe(initialAttempt + 2);
      expect(summary.textContent).toBe(message);
      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
      expect(document.activeElement).toBe(summary);

      focusSpy.mockClear();
      scrollSpy.mockClear();
      search.focus();
      await flushSignalEffects(fixture);
      expect(focusSpy).not.toHaveBeenCalled();
      expect(scrollSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(search);
    });

    it('signals a fresh error cycle on each ineligible result action', async () => {
      const initialAttempt = component.submitAttempt();
      await component.onResultSelectedClick();
      await component.onResultSelectedClick();
      expect(component.vm().errorSummary).toEqual([
        { text: 'You can only result open application(s)' },
      ]);
      expect(component.submitAttempt()).toBe(initialAttempt + 2);
    });

    const makeResultRow = (id: string): ApplicationRow => ({
      ...makeSelectedRow(id, `list-${id}`),
      date: '2026-06-12',
      applicant: `Applicant ${id}`,
      respondent: `Respondent ${id}`,
      title: `Title ${id}`,
      status: 'Open',
    });

    it('navigates to result-selected when fewer than 50 open applications are selected', async () => {
      const rows = Array.from({ length: 49 }, (_, index) =>
        makeResultRow(`entry-${index + 1}`),
      );
      const navigateSpy = jest
        .spyOn((component as unknown as { router: Router }).router, 'navigate')
        .mockResolvedValue(true);

      bulkActionPreviewMock.mockReturnValueOnce(
        of({
          action: BulkActionType.RESULT_SELECTED,
          limit: 100,
          selectedCount: rows.length,
          eligibleCount: rows.length,
          ineligibleCount: 0,
          entryIds: rows.map((row) => row.id),
          entries: rows.map((row) =>
            makeEntry({
              id: row.id,
              listId: row.applicationListId,
              date: row.date,
              applicationTitle: row.title,
              status: ApplicationListStatus.OPEN,
            }),
          ),
        } as BulkActionPreviewResponseDto) as unknown as ReturnType<
          ApplicationListEntriesApi['bulkActionPreview']
        >,
      );

      await component.onResultSelectedClick();

      expect(navigateSpy).toHaveBeenCalledWith(
        ['result-selected'],
        expect.objectContaining({
          relativeTo: TestBed.inject(ActivatedRoute),
          state: expect.objectContaining({
            entriesToResult: expect.arrayContaining(
              rows.map((row) => ({
                id: row.id,
                listId: row.applicationListId,
                date: row.date,
                applicant: '',
                respondent: '',
                title: row.title,
              })),
            ),
            ignoredSelected: false,
          }),
        }),
      );
    });

    it('excludes closed and already-resulted applications before navigating to result-selected', async () => {
      const navigateSpy = jest
        .spyOn((component as unknown as { router: Router }).router, 'navigate')
        .mockResolvedValue(true);

      bulkActionPreviewMock.mockReturnValueOnce(
        of({
          action: BulkActionType.RESULT_SELECTED,
          limit: 100,
          selectedCount: 3,
          eligibleCount: 3,
          ineligibleCount: 2,
          entryIds: ['open-entry', 'closed-entry', 'resulted-entry'],
          entries: [
            makeEntry({
              id: 'open-entry',
              listId: 'open-list',
              date: '2026-06-12',
              applicationTitle: 'Open application',
              status: ApplicationListStatus.OPEN,
            }),
            makeEntry({
              id: 'closed-entry',
              listId: 'closed-list',
              date: '2026-06-12',
              applicationTitle: 'Closed application',
              status: ' CLOSED ' as ApplicationListStatus,
            }),
            makeEntry({
              id: 'resulted-entry',
              listId: 'resulted-list',
              date: '2026-06-12',
              applicationTitle: 'Resulted application',
              isResulted: true,
              status: ApplicationListStatus.OPEN,
            }),
          ],
        } as BulkActionPreviewResponseDto) as unknown as ReturnType<
          ApplicationListEntriesApi['bulkActionPreview']
        >,
      );

      await component.onResultSelectedClick();

      expect(navigateSpy).toHaveBeenCalledWith(
        ['result-selected'],
        expect.objectContaining({
          state: {
            entriesToResult: [
              {
                id: 'open-entry',
                listId: 'open-list',
                date: '2026-06-12',
                applicant: '',
                respondent: '',
                title: 'Open application',
              },
            ],
            ignoredSelected: true,
          },
        }),
      );
    });

    it('shows an error and does not navigate when every selected application is closed or resulted', async () => {
      const initialAttempt = component.submitAttempt();
      const navigateSpy = jest
        .spyOn((component as unknown as { router: Router }).router, 'navigate')
        .mockResolvedValue(true);

      bulkActionPreviewMock.mockReturnValueOnce(
        of({
          action: BulkActionType.RESULT_SELECTED,
          limit: 100,
          selectedCount: 2,
          eligibleCount: 2,
          ineligibleCount: 0,
          entryIds: ['closed-entry', 'resulted-entry'],
          entries: [
            makeEntry({
              id: 'closed-entry',
              status: ApplicationListStatus.CLOSED,
            }),
            makeEntry({
              id: 'resulted-entry',
              isResulted: true,
              status: ApplicationListStatus.OPEN,
            }),
          ],
        } as BulkActionPreviewResponseDto) as unknown as ReturnType<
          ApplicationListEntriesApi['bulkActionPreview']
        >,
      );

      await component.onResultSelectedClick();

      expect(component.vm().errorSummary).toEqual([
        {
          text: 'You can only result open and unresulted application(s)',
        },
      ]);
      expect(component.submitAttempt()).toBe(initialAttempt + 1);
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('date rendering', () => {
    it('renders formatted date in the table instead of raw ISO text', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        rows: [makeEntry({ id: 'row-date', date: '2025-01-09' })],
      }));

      fixture.detectChanges();

      const firstDateCell = fixture.nativeElement.querySelector(
        'tbody tr th.govuk-table__header',
      ) as HTMLElement | null;

      expect(firstDateCell?.textContent?.trim()).toBe('9 Jan 2025');
      expect(firstDateCell?.textContent).not.toContain('2025-01-09');
      expect(
        firstDateCell?.classList.contains('app-sortable-table__cell--nowrap'),
      ).toBe(true);
    });
  });
});
