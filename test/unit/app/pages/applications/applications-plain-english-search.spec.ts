/**
 * Tests for plain-English search on /applications (the page wiring): the
 * panel shows only with the AI capability; a question runs the search
 * straight away with the mapped filters and the interpretationId, through
 * the Search button's own path; an interpretation that sets no filter, an AI
 * error or a validation error does not search (a question that set no
 * filter still lists what it asked for that the page could not use);
 * court-only choices that fit are all applied and searched, and other
 * choices are shown as radios that search after the last pick (a pick made
 * with the arrow keys waits until staff settle on it); the "Searched for"
 * summary above the results (its focus, what removes it and what keeps it,
 * filters changed by hand left out, never saved or restored); the live
 * status; a pick keeps the court rules and list limits against filters set by
 * hand; AI errors go in the page's one error summary; Clear search cancels
 * the search in flight; interpretationId is sent once (and again by a pick
 * search that replaces one still loading) and never saved; and Other courts
 * labels are restored.
 *
 * The generated clients, the AI capabilities facade, the panel, the summary
 * and the mapper are all real, so the requests checked here are the ones the
 * page sends. All questions, courts, codes and names are synthetic.
 */

import { HttpParams, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { LOCALE_ID, PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { Applications } from '@components/applications/applications.component';
import { PLAIN_ENGLISH_SEARCH_CHOICES_STATUS } from '@components/applications/plain-english-search/plain-english-search.component';
import { INTERPRETED_FILTER_CONTROLS } from '@components/applications/util/interpretation-mapper';
import {
  INTERPRETATION_NOTICE_TEXT,
  SEARCHED_FOR_CHANGED_BY_HAND_TEXT,
} from '@constants/applications/applications.constants';
import { INTERPRETATION_CHOICE_ERROR_MESSAGE } from '@constants/applications/error-messages';
import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@constants/applications-list/applications-list.constants';
import { PdfService } from '@core/services/pdf.service';
import {
  AiCapabilitiesDto,
  ApplicationCodeCategory,
  ApplicationCodeGetSummaryDto,
  ApplicationListEntriesApi,
  BASE_PATH,
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
  EntryGetFilterDto,
  EntryPage,
  InterpretationChoiceDto,
  InterpretationSource,
  ResultCodeGetSummaryDto,
  SearchFilterField,
  SearchInterpretationDto,
  SearchInterpretationNotice,
} from '@openapi';
import { AiCapabilitiesFacade } from '@services/ai-capabilities.facade';
import { ApplicationsSearchFormService } from '@services/applications/applications-search-form.service';
import { ApplicationsSearchStateService } from '@services/applications/applications-search-state.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';

const CAPABILITIES_PATH = '/ai/capabilities';
const INTERPRETATIONS_PATH = '/application-list-entries/search-interpretations';
const ENTRIES_PATH = '/application-list-entries';

const QUESTION = 'open applications at synthetic court one in March 2026';
const INTERPRETATION_ID = '00000000-0000-4000-8000-000000000101';
const OTHER_INTERPRETATION_ID = '00000000-0000-4000-8000-000000000102';

const UNAVAILABLE =
  'Plain-English search is unavailable. Use the filters below.';
const TOO_MANY_REQUESTS =
  'You have made too many requests. Try again in a minute.';
const NOT_UNDERSTOOD = 'We could not work out any filters from your question.';
const INVALID_SEARCH_CRITERIA =
  APPLICATIONS_LIST_ERROR_MESSAGES.invalidSearchCriteria;
const DATE_AND_RANGE = 'Enter a list date or a date range, not both';
const SEARCH_FAILED =
  'There was a problem retrieving the applications. Try again.';
const FINDING = 'Finding applications…';

const SEARCH_ON: AiCapabilitiesDto = {
  searchInterpretation: true,
  codeSuggestions: false,
};
const SEARCH_OFF: AiCapabilitiesDto = {
  searchInterpretation: false,
  codeSuggestions: false,
};

const COURT_ONE = 'SYN001';
const COURT_TWO = 'SYN002';
const ENDED_COURT = 'SYN900';
const COURTS: CourtLocationGetSummaryDto[] = [
  { courtId: 1, locationCode: COURT_ONE, name: 'Synthetic Court One' },
  { courtId: 2, locationCode: COURT_TWO, name: 'Synthetic Court Two' },
];
const CJA_AREA: CriminalJusticeAreaGetDto = {
  code: 'CJ99',
  description: 'Synthetic Area',
};
const APPLICATION_CODE_A = 'AP99001';
const APPLICATION_CODE_B = 'AP99002';

const EMPTY_PAGE = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  pageNumber: 0,
  pageSize: 10,
} as unknown as EntryPage;

const RESULTS_PAGE = {
  content: [{ id: 'entry-1', listId: 'list-1', status: 'OPEN' }],
  totalPages: 3,
  totalElements: 25,
  pageNumber: 0,
  pageSize: 10,
} as unknown as EntryPage;

function interpretation(
  overrides: Partial<SearchInterpretationDto> = {},
): SearchInterpretationDto {
  return {
    interpretationId: INTERPRETATION_ID,
    filter: {},
    appliedFilters: [],
    choicesNeeded: [],
    unusedParts: [],
    notices: [],
    ...overrides,
  };
}

// Court one in March 2026, open applications, with a synthetic applicant name
const FULL_INTERPRETATION = interpretation({
  filter: {
    dateFrom: '2026-03-01',
    dateTo: '2026-03-31',
    courtCode: COURT_ONE,
    applicantName: 'Synthetic Applicant',
    status: 'OPEN',
  },
  appliedFilters: [
    {
      field: SearchFilterField.DATE_FROM,
      label: '1 March 2026',
      source: InterpretationSource.DATE_RULE,
    },
    {
      field: SearchFilterField.DATE_TO,
      label: '31 March 2026',
      source: InterpretationSource.DATE_RULE,
    },
    {
      field: SearchFilterField.COURT_CODE,
      label: 'Synthetic Court One',
      source: InterpretationSource.SYNONYM,
    },
    {
      field: SearchFilterField.APPLICANT_NAME,
      label: 'Synthetic Applicant',
      source: InterpretationSource.NAME_SEARCH,
    },
    {
      field: SearchFilterField.STATUS,
      label: 'Open',
      source: InterpretationSource.MODEL,
    },
  ],
  unusedParts: ['with a blue folder'],
  notices: [SearchInterpretationNotice.DATE_IN_FUTURE],
});

// What the API's stub provider returns for a question it has no recording
// for: every filter field null
const ALL_NULL_FILTER = Object.fromEntries(
  Object.keys(INTERPRETED_FILTER_CONTROLS).map((field) => [field, null]),
) as EntryGetFilterDto;

const CODE_CHOICE: InterpretationChoiceDto = {
  field: SearchFilterField.APPLICATION_CODES,
  text: 'Which application did you mean?',
  options: [
    {
      field: SearchFilterField.APPLICATION_CODES,
      code: APPLICATION_CODE_A,
      label: `${APPLICATION_CODE_A} - Synthetic application one`,
    },
    {
      field: SearchFilterField.APPLICATION_CODES,
      code: APPLICATION_CODE_B,
      label: `${APPLICATION_CODE_B} - Synthetic application two`,
    },
  ],
};

const NAME_CHOICE: InterpretationChoiceDto = {
  field: SearchFilterField.APPLICANT_ORGANISATION,
  text: 'Which applicant did you mean?',
  options: [
    {
      field: SearchFilterField.APPLICANT_ORGANISATION,
      code: 'Synthetic Council',
      label: 'Synthetic Council',
    },
    {
      field: SearchFilterField.APPLICANT_ORGANISATION,
      code: 'Example Council',
      label: 'Example Council',
    },
  ],
};

const COURT_CHOICE: InterpretationChoiceDto = {
  field: SearchFilterField.COURT_CODE,
  text: 'Which court did you mean?',
  options: [
    {
      field: SearchFilterField.COURT_CODE,
      code: COURT_TWO,
      label: 'Synthetic Court Two',
    },
  ],
};

const TWO_COURTS_CHOICE: InterpretationChoiceDto = {
  field: SearchFilterField.COURT_CODE,
  text: 'Which court did you mean?',
  options: [
    {
      field: SearchFilterField.COURT_CODE,
      code: COURT_ONE,
      label: 'Synthetic Court One',
    },
    {
      field: SearchFilterField.COURT_CODE,
      code: COURT_TWO,
      label: 'Synthetic Court Two',
    },
  ],
};

const OTHER_COURT_CHOICE: InterpretationChoiceDto = {
  field: SearchFilterField.COURT_CODES,
  text: 'Which other court did you mean?',
  options: [
    {
      field: SearchFilterField.COURT_CODES,
      code: COURT_TWO,
      label: 'Synthetic Court Two',
    },
  ],
};

const ENDED_COURT_CHOICE: InterpretationChoiceDto = {
  field: SearchFilterField.COURT_CODES,
  text: 'Which other court did you mean?',
  options: [
    {
      field: SearchFilterField.COURT_CODES,
      code: ENDED_COURT,
      label: 'Synthetic Closed Court',
    },
  ],
};

const CJA_CHOICE: InterpretationChoiceDto = {
  field: SearchFilterField.CJA_CODE,
  text: 'Which area did you mean?',
  options: [
    {
      field: SearchFilterField.CJA_CODE,
      code: CJA_AREA.code,
      label: 'Synthetic Area',
    },
  ],
};

// A place that matched courts, active and end-dated, as the API offers them
const PLACE_CHOICE: InterpretationChoiceDto = {
  field: SearchFilterField.COURT_CODE,
  text: 'Which place did you mean?',
  options: [
    {
      field: SearchFilterField.COURT_CODE,
      code: COURT_ONE,
      label: 'Synthetic Court One',
    },
    {
      field: SearchFilterField.COURT_CODE,
      code: ENDED_COURT,
      label: 'Synthetic Closed Court',
    },
    {
      field: SearchFilterField.COURT_CODE,
      code: COURT_TWO,
      label: 'Synthetic Court Two',
    },
  ],
};

// Synthetic end-dated court codes: SYN500 and on
const endedCourts = (count: number, from = 500): string[] =>
  Array.from({ length: count }, (_, index) => `SYN${index + from}`);

// A place that matched `codes`, every one a court
const courtsChoice = (codes: string[]): InterpretationChoiceDto => ({
  field: SearchFilterField.COURT_CODE,
  text: 'Which place did you mean?',
  options: codes.map((code) => ({
    field: SearchFilterField.COURT_CODE,
    code,
    label: `Synthetic Court ${code}`,
  })),
});

// The typeahead labels of a court and the CJA chosen by hand
const COURT_ONE_LABEL = `${COURT_ONE} - Synthetic Court One`;
const COURT_TWO_LABEL = `${COURT_TWO} - Synthetic Court Two`;
const CJA_LABEL = `${CJA_AREA.code} - Synthetic Area`;

// An applicant name from the question, so the search has a filter, and the
// choices. A court choice needs another choice beside it to be shown as
// radios (court-only choices are applied at once).
const withChoices = (
  ...choices: InterpretationChoiceDto[]
): SearchInterpretationDto =>
  interpretation({
    filter: { applicantName: 'Synthetic Applicant' },
    choicesNeeded: choices,
  });

// A CJA from the question, with its label, and the choices
const cjaWithChoices = (
  ...choices: InterpretationChoiceDto[]
): SearchInterpretationDto =>
  interpretation({
    filter: { cjaCode: CJA_AREA.code },
    appliedFilters: [
      {
        field: SearchFilterField.CJA_CODE,
        label: 'Synthetic Area',
        source: InterpretationSource.SYNONYM,
      },
    ],
    choicesNeeded: choices,
  });

const isCapabilities = (r: { method: string; url: string }): boolean =>
  r.method === 'GET' && r.url === CAPABILITIES_PATH;
const isInterpretation = (r: { method: string; url: string }): boolean =>
  r.method === 'POST' && r.url === INTERPRETATIONS_PATH;
const isEntriesSearch = (r: { method: string; url: string }): boolean =>
  r.method === 'GET' && r.url === ENTRIES_PATH;

describe('Applications', () => {
  let fixture: ComponentFixture<Applications>;
  let component: Applications;
  let httpMock: HttpTestingController;
  let searchFormService: ApplicationsSearchFormService;
  let searchStateService: ApplicationsSearchStateService;

  const courtLocations = new BehaviorSubject<CourtLocationGetSummaryDto[]>(
    COURTS,
  );
  const cjas = new BehaviorSubject<CriminalJusticeAreaGetDto[]>([CJA_AREA]);

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
    applicationCodeTitles: signal<string[]>([]),
    applicationCodes: signal<ApplicationCodeGetSummaryDto[]>([]),
    resultCodes: signal<ResultCodeGetSummaryDto[]>([]),
    ensureResultCodes: jest.fn(),
    hasLoadError: signal(false),
    hasPlaceLoadError: signal(false),
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    courtLocations.next(COURTS);
    cjas.next([CJA_AREA]);

    await TestBed.configureTestingModule({
      imports: [Applications],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BASE_PATH, useValue: '' },
        { provide: LOCALE_ID, useValue: 'en-GB' },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ReferenceDataFacade, useValue: referenceDataFacadeStub },
        { provide: PdfService, useValue: {} },
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

    httpMock = TestBed.inject(HttpTestingController);
    searchFormService = TestBed.inject(ApplicationsSearchFormService);
    searchStateService = TestBed.inject(ApplicationsSearchStateService);
    searchFormService.reset();
    searchStateService.reset();
  });

  afterEach(() => {
    // No request the test did not expect, such as an AI call or a search
    httpMock.verify();
  });

  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const query = <T extends Element = HTMLElement>(selector: string): T | null =>
    root().querySelector<T>(selector);
  const texts = (selector: string): string[] =>
    Array.from(root().querySelectorAll(selector)).map(
      (element) => element.textContent?.trim() ?? '',
    );

  // Change detection, ngModel's asynchronous radio writes and focus
  const settle = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const createPage = async (
    capabilities: AiCapabilitiesDto | 'error' = SEARCH_ON,
  ): Promise<void> => {
    fixture = TestBed.createComponent(Applications);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.tick();

    const req = httpMock.expectOne(isCapabilities);
    if (capabilities === 'error') {
      req.flush(
        { detail: 'Synthetic failure' },
        { status: 500, statusText: 'Server Error' },
      );
    } else {
      req.flush(capabilities);
    }
    await settle();
  };

  const question = (): HTMLTextAreaElement =>
    query<HTMLTextAreaElement>('#plain-english-question')!;

  const pressFind = (): void => {
    query<HTMLButtonElement>('app-plain-english-search button')!.click();
    fixture.detectChanges();
  };

  const ask = (text: string = QUESTION): void => {
    const field = question();
    field.value = text;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    pressFind();
  };

  // Asks and answers the question. A search it starts is left to the test.
  const interpret = async (
    result: SearchInterpretationDto,
    text: string = QUESTION,
  ): Promise<TestRequest> => {
    ask(text);
    const req = httpMock.expectOne(isInterpretation);
    req.flush(result);
    await settle();
    return req;
  };

  const expectSearch = async (page = EMPTY_PAGE): Promise<TestRequest> => {
    const req = httpMock.expectOne(isEntriesSearch);
    req.flush(page);
    await settle();
    return req;
  };

  // Asks and answers the question, and answers the search it runs
  const interpretAndSearch = async (
    result: SearchInterpretationDto,
    page = RESULTS_PAGE,
    text: string = QUESTION,
  ): Promise<TestRequest> => {
    await interpret(result, text);
    return expectSearch(page);
  };

  const failInterpretation = async (status: number): Promise<void> => {
    ask();
    const req = httpMock.expectOne(isInterpretation);
    if (status === 0) {
      // No response at all, such as a network error
      req.error(new ProgressEvent('error'));
    } else {
      req.flush(
        { title: 'Synthetic problem title', detail: 'Synthetic detail' },
        { status, statusText: 'Synthetic status' },
      );
    }
    await settle();
  };

  const pressSearch = async (): Promise<void> => {
    query<HTMLButtonElement>('button#search')!.click();
    await settle();
  };

  const clearSearch = async (): Promise<void> => {
    query<HTMLButtonElement>('form .govuk-button--secondary')!.click();
    await settle();
  };

  const pick = async (choice: number, option: number): Promise<void> => {
    query<HTMLInputElement>(
      `#interpretation-choice-${choice}-${option}`,
    )!.click();
    await settle();
  };

  const summaryLinks = (): { href: string | null; text: string }[] =>
    Array.from(
      root().querySelectorAll<HTMLAnchorElement>(
        '.govuk-error-summary__list a',
      ),
    ).map((link) => ({
      href: link.getAttribute('href'),
      text: link.textContent?.trim() ?? '',
    }));

  const errorSummaryTexts = (): string[] =>
    texts('.govuk-error-summary__list li');

  const advancedSearch = (): HTMLDetailsElement =>
    Array.from(root().querySelectorAll('details')).find(
      (details) =>
        details.querySelector('summary')?.textContent?.trim() ===
        'Advanced search',
    )!;

  const selectedOtherCourts = (): string[] =>
    texts('#courtCodes-selected .govuk-summary-list__value');

  const notApplied = (): string[] =>
    texts('#interpreted-filters-not-applied li');

  // The display text of the Court and CJA typeaheads
  const courtText = (): string => query<HTMLInputElement>('input#court')!.value;
  const cjaText = (): string => query<HTMLInputElement>('input#cja')!.value;

  const inlineErrors = (): string => texts('.govuk-error-message').join(' ');

  // The summaries: "Searched for" above the results, and the one above the
  // form while a question still needs staff
  const searchedFor = (): HTMLElement | null => query('#searched-for');
  const pendingSummary = (): HTMLElement | null =>
    query('#interpreted-filters');

  // What the panel's live region says
  const statusText = (): string =>
    query('#plain-english-search-status')?.textContent?.trim() ?? '';

  // The error summary and the "no entries found" banner focus themselves in a
  // timeout after they render
  const afterFocusTimeouts = (): Promise<unknown> =>
    new Promise((resolve) => setTimeout(resolve, 0));

  const failSearch = async (status: number): Promise<void> => {
    httpMock.expectOne(isEntriesSearch).flush(
      {
        title: 'Synthetic problem title',
        detail: 'Synthetic search problem',
      },
      { status, statusText: 'Synthetic status' },
    );
    await settle();
  };

  // Checks a request never sends a court together with a CJA or Other
  // location
  const expectCourtsApart = (params: HttpParams): void => {
    const hasCourt = params.has('courtCode') || params.has('courtCodes');

    expect(hasCourt && params.has('cjaCode')).toBe(false);
    expect(hasCourt && params.has('otherLocationDescription')).toBe(false);
  };

  // The search the last pick ran. It fails, so the choices stay above the
  // form for the next pick (each pick searches again).
  const pickedSearchParams = async (): Promise<HttpParams> => {
    const req = httpMock.expectOne(isEntriesSearch);
    const { params } = req.request;
    req.flush(
      { detail: 'Synthetic failure' },
      { status: 500, statusText: 'Synthetic status' },
    );
    await settle();
    expectCourtsApart(params);
    return params;
  };

  const courtCodesParam = (params: HttpParams): string[] =>
    JSON.parse(params.get('courtCodes') ?? '[]') as string[];

  const choiceRadio = (choice: number, option: number): HTMLInputElement =>
    query<HTMLInputElement>(`#interpretation-choice-${choice}-${option}`)!;

  const keydown = (target: Element, key: string): void => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  };

  // What the browser does for an arrow key in a radio group: it moves focus to
  // the next option and selects it
  const arrowTo = async (
    choice: number,
    from: number,
    to: number,
  ): Promise<void> => {
    keydown(choiceRadio(choice, from), 'ArrowDown');
    const next = choiceRadio(choice, to);
    next.focus();
    next.checked = true;
    next.dispatchEvent(new Event('change', { bubbles: true }));
    await settle();
  };

  // The line "Searched for" shows when filters were changed by hand
  const changedByHandText = (): string[] =>
    texts('#interpreted-filters-changed-by-hand');

  describe('plain-English search capability', () => {
    it('asks for the AI capabilities each time the page initialises', async () => {
      await createPage(SEARCH_OFF);
      fixture.destroy();

      // The next visit asks again (createPage expects one request each time)
      await createPage(SEARCH_ON);

      expect(query('app-plain-english-search')).not.toBeNull();
    });

    it('renders nothing of the panel and makes no AI call without the capability', async () => {
      await createPage(SEARCH_OFF);

      expect(query('app-plain-english-search')).toBeNull();
      expect(query('#plain-english-question')).toBeNull();
      expect(query('app-interpreted-filters-summary')).toBeNull();
      expect(texts('label')).not.toContain('Search in plain English');
      httpMock.expectNone(isInterpretation);
    });

    it('hides the panel when the capabilities request fails', async () => {
      await createPage('error');

      expect(query('app-plain-english-search')).toBeNull();
      expect(query('.govuk-error-summary')).toBeNull();
    });

    it('drops the summary and stops its choices blocking Search when the capability turns off', async () => {
      await createPage();
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE],
        }),
      );

      TestBed.inject(AiCapabilitiesFacade).refresh();
      TestBed.tick();
      httpMock.expectOne(isCapabilities).flush(SEARCH_OFF);
      await settle();

      expect(query('app-plain-english-search')).toBeNull();
      expect(query('app-interpreted-filters-summary')).toBeNull();
      await pressSearch();
      const req = await expectSearch();
      expect(req.request.params.get('courtCode')).toBe(COURT_ONE);
    });

    it('drops the Searched for summary when the capability turns off', async () => {
      await createPage();
      await interpretAndSearch(FULL_INTERPRETATION);
      expect(searchedFor()).not.toBeNull();

      TestBed.inject(AiCapabilitiesFacade).refresh();
      TestBed.tick();
      httpMock.expectOne(isCapabilities).flush(SEARCH_OFF);
      await settle();

      expect(searchedFor()).toBeNull();
      // The results stay
      expect(query('app-sortable-table')).not.toBeNull();
    });

    it('shows the panel above the search form, outside it, when the capability is on', async () => {
      await createPage();

      const panel = query('app-plain-english-search')!;
      const form = query('form')!;

      expect(panel).not.toBeNull();
      expect(form.contains(panel)).toBe(false);
      expect(
        panel.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        query('label[for="plain-english-question"]')?.textContent,
      ).toContain('Search in plain English');
      expect(
        query('app-plain-english-search button')?.textContent?.trim(),
      ).toBe('Find applications');
      // No summary until there is a result
      expect(query('app-interpreted-filters-summary')).toBeNull();
    });
  });

  describe('a question that sets filters', () => {
    beforeEach(async () => {
      await createPage();
    });

    it('fills the controls and runs the search with the mapped filters and the interpretationId', async () => {
      await interpret(FULL_INTERPRETATION);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({
          dateFrom: '2026-03-01',
          dateTo: '2026-03-31',
          court: COURT_ONE,
          applicantName: 'Synthetic Applicant',
          status: 'open',
        }),
      );
      expect(courtText()).toBe('Synthetic Court One');
      expect(query<HTMLInputElement>('#applicantName')!.value).toBe(
        'Synthetic Applicant',
      );

      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(params.get('dateFrom')).toBe('2026-03-01');
      expect(params.get('dateTo')).toBe('2026-03-31');
      expect(params.get('courtCode')).toBe(COURT_ONE);
      expect(params.get('applicantName')).toBe('Synthetic Applicant');
      expect(params.get('status')).toBe('OPEN');
      expect(params.getAll('interpretationId')).toEqual([INTERPRETATION_ID]);
      expect(params.get('pageNumber')).toBe('0');
      // The form stays filled in, so staff can refine it and search again
      expect(component.form.controls.applicantName.value).toBe(
        'Synthetic Applicant',
      );
      expect(component.vm().rows).toHaveLength(1);
    });

    it('saves the search state as the Search button does', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      expect(searchStateService.state()).toEqual(
        expect.objectContaining({
          hasSearched: true,
          appliedFilters: expect.objectContaining({
            courtCode: COURT_ONE,
            applicantName: 'Synthetic Applicant',
          }) as unknown,
        }),
      );
      expect(searchFormService.state().applicantName).toBe(
        'Synthetic Applicant',
      );
    });

    it('shows the Searched for summary directly above the results, after the form', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      const summary = searchedFor()!;
      const host = summary.closest('app-interpreted-filters-summary')!;

      expect(summary).not.toBeNull();
      expect(query('#searched-for-heading')?.textContent?.trim()).toBe(
        'Searched for',
      );
      expect(
        query('form')!.compareDocumentPosition(host) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(host.nextElementSibling?.tagName).toBe('APP-SORTABLE-TABLE');
      // Nothing about the question is left above the form
      expect(pendingSummary()).toBeNull();
      expect(texts('#interpreted-filters-applied dd')).toEqual([
        '1 March 2026',
        '31 March 2026',
        'Synthetic Court One',
        'Synthetic Applicant',
        'Open',
      ]);
      expect(texts('#interpreted-filters-unused li')).toEqual([
        'with a blue folder',
      ]);
      expect(texts('#interpreted-filters-notices li')).toHaveLength(1);
    });

    it('lists what the page has no control for as not applied in Searched for', async () => {
      await interpretAndSearch(
        interpretation({
          filter: {
            applicantName: 'Synthetic Applicant',
            applicationCodeCategory: ApplicationCodeCategory.SEARCH_WARRANTS,
            standardApplicantCodes: ['SA0001'],
          },
          appliedFilters: [
            {
              field: SearchFilterField.APPLICATION_CODE_CATEGORY,
              label: 'Synthetic warrants',
              source: InterpretationSource.CATEGORY_RULE,
            },
          ],
        }),
      );

      expect(searchedFor()).not.toBeNull();
      expect(notApplied()).toEqual(['Synthetic warrants', 'SA0001']);
    });

    it('moves focus to the Searched for heading when the search finishes', async () => {
      await interpret(FULL_INTERPRETATION);

      expect(searchedFor()).toBeNull();
      expect(document.activeElement?.id).not.toBe('searched-for-heading');

      await expectSearch(RESULTS_PAGE);
      await afterFocusTimeouts();

      expect(document.activeElement?.id).toBe('searched-for-heading');
      expect(query('#searched-for-heading')?.getAttribute('tabindex')).toBe(
        '-1',
      );
    });

    it('moves focus to Searched for, not the no entries banner, when nothing is found', async () => {
      await interpretAndSearch(FULL_INTERPRETATION, EMPTY_PAGE);
      await afterFocusTimeouts();

      expect(query('app-notification-banner')?.textContent).toContain(
        'No application list entries found',
      );
      expect(document.activeElement?.id).toBe('searched-for-heading');
      // Above the results, which say none were found
      expect(
        searchedFor()!.closest('app-interpreted-filters-summary')!
          .nextElementSibling?.textContent,
      ).toContain('No results found.');
    });

    it('moves focus to Searched for again when the same interpretation comes back', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);
      question().focus();
      expect(document.activeElement).toBe(question());

      // The same interpretationId: focus still moves
      await interpretAndSearch(FULL_INTERPRETATION);

      expect(document.activeElement?.id).toBe('searched-for-heading');
    });

    it('says Finding applications… until the search finishes, then how many were found', async () => {
      ask();
      expect(statusText()).toBe(FINDING);

      httpMock.expectOne(isInterpretation).flush(FULL_INTERPRETATION);
      await settle();
      // The question is answered and the search is loading
      expect(statusText()).toBe(FINDING);

      await expectSearch(RESULTS_PAGE);

      expect(statusText()).toBe('25 applications found.');
    });

    it('says no applications were found when the search finds none', async () => {
      await interpretAndSearch(FULL_INTERPRETATION, EMPTY_PAGE);

      expect(statusText()).toBe('No applications found.');
    });

    it('does nothing when the button is pressed again while the question or its search is running', async () => {
      ask();
      pressFind();
      const req = httpMock.expectOne(isInterpretation);
      req.flush(FULL_INTERPRETATION);
      await settle();

      // The search is loading
      pressFind();
      httpMock.expectNone(isInterpretation);
      await expectSearch(RESULTS_PAGE);

      // Finished, so the button works again
      ask('synthetic court two');
      httpMock.expectOne(isInterpretation).flush(FULL_INTERPRETATION);
      await settle();
      await expectSearch(RESULTS_PAGE);
    });

    it('replaces the values already in the form rather than merging with them', async () => {
      component.form.patchValue({
        applicantOrg: 'Earlier Organisation',
        respondentSurname: 'Earlier',
        applicationCodes: [APPLICATION_CODE_B],
      });
      component.selectCja(CJA_AREA);
      component.courtChipLabels.set({ SYN777: 'SYN777 - Synthetic Old Court' });
      fixture.detectChanges();

      await interpret(
        interpretation({
          filter: { applicantName: 'Synthetic Applicant' },
        }),
      );

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({
          applicantOrg: '',
          respondentSurname: '',
          applicationCodes: [],
          cja: '',
          applicantName: 'Synthetic Applicant',
        }),
      );
      expect(component.placeState().cjaSearch).toBe('');
      expect(component.courtChipLabels()).toEqual({});
      const { params } = (await expectSearch()).request;
      expect(params.keys().sort()).toEqual(
        [
          'applicantName',
          'interpretationId',
          'pageNumber',
          'pageSize',
          'sort',
        ].sort(),
      );
    });

    it('shows an interpreted application title in the Application title field', async () => {
      await interpretAndSearch(
        interpretation({ filter: { applicationTitle: 'Synthetic title' } }),
      );

      expect(component.form.controls.applicationTitle.value).toBe(
        'Synthetic title',
      );
      expect(component.applicationTitleSearch()).toBe('Synthetic title');
      expect(query<HTMLInputElement>('input#applicationTitle')!.value).toBe(
        'Synthetic title',
      );
    });

    it('puts an end-dated court into Other courts with the label from the API', async () => {
      const req = await interpretAndSearch(
        interpretation({
          filter: { courtCodes: [ENDED_COURT, COURT_TWO] },
          appliedFilters: [
            {
              field: SearchFilterField.COURT_CODES,
              label: 'Synthetic Closed Court, Synthetic Court Two',
              source: InterpretationSource.SYNONYM,
            },
          ],
        }),
      );

      expect(component.form.controls.courtCodes.value).toEqual([
        ENDED_COURT,
        COURT_TWO,
      ]);
      expect(component.courtChipLabels()).toEqual({
        [ENDED_COURT]: 'Synthetic Closed Court',
        [COURT_TWO]: 'Synthetic Court Two',
      });
      // An active court keeps the typeahead's own label
      expect(selectedOtherCourts()).toEqual([
        'Synthetic Closed Court',
        COURT_TWO_LABEL,
      ]);
      expect(courtCodesParam(req.request.params)).toEqual([
        ENDED_COURT,
        COURT_TWO,
      ]);
    });

    it('opens Advanced search when the interpretation sets one of its filters', async () => {
      expect(advancedSearch().open).toBe(false);

      await interpretAndSearch(
        interpretation({ filter: { applicationCodes: [APPLICATION_CODE_A] } }),
      );

      expect(component.vm().isAdvancedSearch).toBe(true);
      expect(advancedSearch().open).toBe(true);
      expect(searchFormService.state().isAdvancedSearch).toBe(true);
    });

    it('leaves Advanced search closed when the interpretation sets none of its filters', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      expect(component.vm().isAdvancedSearch).toBe(false);
      expect(advancedSearch().open).toBe(false);
    });

    it('clears the errors of an earlier Search blocked by validation, and focus goes to Searched for', async () => {
      await pressSearch();
      await afterFocusTimeouts();
      expect(errorSummaryTexts()).toEqual([INVALID_SEARCH_CRITERIA]);

      await interpretAndSearch(FULL_INTERPRETATION);
      await afterFocusTimeouts();

      expect(query('.govuk-error-summary')).toBeNull();
      expect(document.activeElement?.id).toBe('searched-for-heading');
    });

    it.each([
      [500, SEARCH_FAILED],
      [400, 'Synthetic search problem'],
    ])(
      'clears the error of an earlier Search that failed with %s',
      async (status, text) => {
        component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
        await pressSearch();
        await failSearch(status);
        expect(errorSummaryTexts()).toEqual([text]);

        await interpretAndSearch(FULL_INTERPRETATION);

        expect(query('.govuk-error-summary')).toBeNull();
        expect(searchedFor()).not.toBeNull();
      },
    );

    it('cancels a search still loading, whose filters it replaced, and runs its own', async () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      const running = httpMock.expectOne(isEntriesSearch);

      await interpret(FULL_INTERPRETATION);

      expect(running.cancelled).toBe(true);
      expect(running.request.params.has('interpretationId')).toBe(false);
      const req = await expectSearch(RESULTS_PAGE);
      expect(req.request.params.has('applicantOrganisation')).toBe(false);
      expect(req.request.params.get('courtCode')).toBe(COURT_ONE);
      expect(req.request.params.getAll('interpretationId')).toEqual([
        INTERPRETATION_ID,
      ]);
      expect(searchedFor()).not.toBeNull();
      expect(statusText()).toBe('25 applications found.');
    });

    it('clears a court error about text it replaced', async () => {
      component.setCourthouseSearch('Synthetic Unknown Court');
      component.onCourthouseInputChange();
      await pressSearch();
      expect(component.form.controls.court.errors).toEqual(
        expect.objectContaining({ courtNotFound: true }),
      );
      expect(inlineErrors()).toContain('Court location not found');

      await interpretAndSearch(
        interpretation({ filter: { applicantName: 'Synthetic Applicant' } }),
      );

      expect(component.form.controls.court.errors?.['courtNotFound']).toBe(
        undefined,
      );
      expect(inlineErrors()).not.toContain('Court location not found');
    });

    it('clears a CJA error about text it replaced, while results are on screen', async () => {
      // Results keep the page's search state, so inline errors would show
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      await expectSearch(RESULTS_PAGE);
      component.form.patchValue({ applicantOrg: '' });
      component.setCjaSearch('Synthetic Unknown Area');
      component.onCjaInputChange();
      await pressSearch();
      httpMock.expectNone(isEntriesSearch);
      expect(inlineErrors()).toContain('Criminal justice area not found');

      const req = await interpretAndSearch(
        interpretation({ filter: { courtCode: COURT_ONE } }),
      );

      expect(component.vm().submitted).toBe(true);
      expect(component.form.controls.cja.errors?.['cjaNotFound']).toBe(
        undefined,
      );
      expect(inlineErrors()).not.toContain('Criminal justice area not found');
      expect(req.request.params.get('courtCode')).toBe(COURT_ONE);
    });
  });

  describe('a question that sets no filter', () => {
    beforeEach(async () => {
      await createPage();
    });

    it.each([
      [
        'every filter field null, as the stub provider returns',
        ALL_NULL_FILTER,
      ],
      ['an empty filter', {}],
    ])(
      'does not search for %s, and shows the 422 copy in the error summary',
      async (_name, filter: EntryGetFilterDto) => {
        component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });

        await interpret(interpretation({ filter }));
        await afterFocusTimeouts();

        httpMock.expectNone(isEntriesSearch);
        expect(root().querySelectorAll('.govuk-error-summary')).toHaveLength(1);
        expect(summaryLinks()).toEqual([
          { href: '#plain-english-question', text: NOT_UNDERSTOOD },
        ]);
        expect(texts('#plain-english-question-error')[0]).toContain(
          NOT_UNDERSTOOD,
        );
        expect(document.activeElement).toBe(query('.govuk-error-summary'));
        // The form is left as it was, and nothing is said about a search
        expect(component.form.controls.applicantOrg.value).toBe(
          'Synthetic Organisation',
        );
        expect(query('app-interpreted-filters-summary')).toBeNull();
        expect(component.vm().isSearch).toBe(false);
        expect(statusText()).toBe('');
      },
    );

    // Search warrants, and a standard applicant, have no control on the page
    const NO_CONTROL_INTERPRETATION = interpretation({
      filter: {
        applicationCodeCategory: ApplicationCodeCategory.SEARCH_WARRANTS,
        standardApplicantCodes: ['SA0001'],
      },
      appliedFilters: [
        {
          field: SearchFilterField.APPLICATION_CODE_CATEGORY,
          label: 'Search warrants',
          source: InterpretationSource.CATEGORY_RULE,
        },
      ],
      unusedParts: ['for the synthetic team'],
    });

    // The one error, the 422 copy, which keeps focus, and no search
    const expectNotUnderstood = (): void => {
      httpMock.expectNone(isEntriesSearch);
      expect(root().querySelectorAll('.govuk-error-summary')).toHaveLength(1);
      expect(summaryLinks()).toEqual([
        { href: '#plain-english-question', text: NOT_UNDERSTOOD },
      ]);
      expect(document.activeElement).toBe(query('.govuk-error-summary'));
      expect(component.vm().isSearch).toBe(false);
      // Said once, in the error summary: the live region says nothing
      expect(statusText()).toBe('');
    };

    it('does not search for only filters the page has no control for, and lists them as not applied above the form', async () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });

      await interpret(NO_CONTROL_INTERPRETATION);
      await afterFocusTimeouts();

      expectNotUnderstood();
      expect(query('#interpreted-filters-heading')?.textContent?.trim()).toBe(
        'Filters from your question',
      );
      expect(
        pendingSummary()!.compareDocumentPosition(query('form')!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(notApplied()).toEqual(['Search warrants', 'SA0001']);
      expect(texts('#interpreted-filters-unused li')).toEqual([
        'for the synthetic team',
      ]);
      expect(query('#interpreted-filters-none')?.textContent?.trim()).toBe(
        'No filters were set from your question.',
      );
      expect(query('input[type="radio"]')).toBeNull();
      expect(searchedFor()).toBeNull();
      // The form is left as it was
      expect(component.form.controls.applicantOrg.value).toBe(
        'Synthetic Organisation',
      );
    });

    it('shows that only English is understood alongside the 422 copy for a question not in English', async () => {
      await interpret(
        interpretation({
          notices: [SearchInterpretationNotice.WELSH_NOT_SUPPORTED],
        }),
      );
      await afterFocusTimeouts();

      expectNotUnderstood();
      expect(texts('#interpreted-filters-notices li')).toEqual([
        'Plain-English search only understands questions in English.',
      ]);
    });

    it('shows a name that was too short, and the unused part, alongside the 422 copy', async () => {
      await interpret(
        interpretation({
          unusedParts: ['by synthetic j'],
          notices: [SearchInterpretationNotice.NAME_TOO_SHORT],
        }),
      );
      await afterFocusTimeouts();

      expectNotUnderstood();
      expect(texts('#interpreted-filters-unused li')).toEqual([
        'by synthetic j',
      ]);
      expect(texts('#interpreted-filters-notices li')).toEqual([
        INTERPRETATION_NOTICE_TEXT[SearchInterpretationNotice.NAME_TOO_SHORT],
      ]);
    });

    it('does not block Search, which sends no interpretationId, removes the summary and saves none of it', async () => {
      await interpret(NO_CONTROL_INTERPRETATION);
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });

      await pressSearch();
      const req = await expectSearch(RESULTS_PAGE);

      expect(req.request.params.has('interpretationId')).toBe(false);
      expect(req.request.params.get('applicantOrganisation')).toBe(
        'Synthetic Organisation',
      );
      expect(query('app-interpreted-filters-summary')).toBeNull();
      expect(query('.govuk-error-summary')).toBeNull();
      const saved = JSON.stringify([
        searchStateService.state(),
        searchFormService.state(),
        searchFormService.courtChipLabels(),
      ]);
      expect(saved).not.toContain(INTERPRETATION_ID);
      expect(saved).not.toContain('Search warrants');
      expect(saved).not.toContain('SA0001');
      expect(saved).not.toContain('for the synthetic team');
    });

    it('lets staff ask again after a question that set no filter', async () => {
      await interpret(NO_CONTROL_INTERPRETATION);

      await interpretAndSearch(FULL_INTERPRETATION);

      expect(query('.govuk-error-summary')).toBeNull();
      expect(pendingSummary()).toBeNull();
      expect(searchedFor()).not.toBeNull();
    });
  });

  describe('court-only choices', () => {
    beforeEach(async () => {
      await createPage();
    });

    it('applies every court of the choice and searches at once, listing them in Searched for', async () => {
      await interpret(
        interpretation({
          filter: { status: 'OPEN' },
          choicesNeeded: [PLACE_CHOICE],
        }),
      );

      // No radios: every court is applied
      expect(query('input[type="radio"]')).toBeNull();
      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(courtText()).toBe('Synthetic Court One');
      expect(component.form.controls.courtCodes.value).toEqual([
        ENDED_COURT,
        COURT_TWO,
      ]);
      expect(selectedOtherCourts()).toEqual([
        'Synthetic Closed Court',
        COURT_TWO_LABEL,
      ]);

      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(courtCodesParam(params)).toEqual([
        COURT_ONE,
        ENDED_COURT,
        COURT_TWO,
      ]);
      expect(params.has('courtCode')).toBe(false);
      expect(params.get('status')).toBe('OPEN');
      expect(params.getAll('interpretationId')).toEqual([INTERPRETATION_ID]);
      expect(texts('#searched-for')[0]).toContain(
        'Your question matched more than one court, so all of them were searched:',
      );
      expect(texts('#interpreted-filters-matched-courts li')).toEqual([
        'Synthetic Court One',
        'Synthetic Closed Court',
        'Synthetic Court Two',
      ]);
      expect(changedByHandText()).toEqual([]);
      expect(document.activeElement?.id).toBe('searched-for-heading');
    });

    it('applies the ten courts a place can match and searches them all', async () => {
      const codes = endedCourts(10);

      await interpret(interpretation({ choicesNeeded: [courtsChoice(codes)] }));
      const { params } = (await expectSearch()).request;

      expect(courtCodesParam(params)).toEqual(codes);
      expect(texts('#interpreted-filters-matched-courts li')).toHaveLength(10);
    });

    it('applies the courts when Court and Other courts then hold exactly 20', async () => {
      const inQuestion = endedCourts(10);
      const matched = endedCourts(9, 600);

      await interpret(
        interpretation({
          filter: { courtCodes: inQuestion },
          choicesNeeded: [courtsChoice([COURT_ONE, ...matched])],
        }),
      );
      const { params } = (await expectSearch()).request;

      expect(courtCodesParam(params)).toHaveLength(20);
    });

    it('shows the court choice as radios and does not search when the courts would be more than 20', async () => {
      await interpret(
        interpretation({
          filter: { courtCodes: endedCourts(12) },
          choicesNeeded: [courtsChoice(endedCourts(10, 600))],
        }),
      );

      httpMock.expectNone(isEntriesSearch);
      expect(query('#interpretation-choice-1-1')).not.toBeNull();
      expect(statusText()).toBe(PLAIN_ENGLISH_SEARCH_CHOICES_STATUS);

      await pick(1, 1);
      const { params } = (await expectSearch()).request;

      expect(courtCodesParam(params)).toEqual([
        ...endedCourts(12),
        endedCourts(1, 600)[0],
      ]);
    });

    it('shows a place that matched a court and an area as radios', async () => {
      await interpret(
        interpretation({
          choicesNeeded: [
            {
              field: SearchFilterField.COURT_CODE,
              text: 'Which place did you mean?',
              options: [...COURT_CHOICE.options, ...CJA_CHOICE.options],
            },
          ],
        }),
      );

      httpMock.expectNone(isEntriesSearch);
      expect(
        texts('#interpreted-filters .govuk-radios__label').slice(0, 2),
      ).toEqual(['Synthetic Court Two', 'Synthetic Area']);
    });

    it('shows every choice as radios when one of them is not about courts, and searches when both are answered', async () => {
      await interpret(withChoices(PLACE_CHOICE, CODE_CHOICE));

      httpMock.expectNone(isEntriesSearch);
      expect(query('#interpretation-choice-1-1')).not.toBeNull();
      expect(query('#interpretation-choice-2-1')).not.toBeNull();

      await pick(1, 2);
      httpMock.expectNone(isEntriesSearch);
      await pick(2, 1);
      const { params } = (await expectSearch()).request;

      expect(params.get('courtCode')).toBe(ENDED_COURT);
      expect(JSON.parse(params.get('applicationCodes') ?? '[]')).toEqual([
        APPLICATION_CODE_A,
      ]);
    });
  });

  describe('choices', () => {
    beforeEach(async () => {
      await createPage();
    });

    it('shows the choices above the form, moves focus to them and does not search', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE],
        }),
      );

      httpMock.expectNone(isEntriesSearch);
      const summary = pendingSummary()!;
      expect(
        summary.compareDocumentPosition(query('form')!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(document.activeElement?.id).toBe('interpreted-filters-heading');
      expect(searchedFor()).toBeNull();
      expect(statusText()).toBe(PLAIN_ENGLISH_SEARCH_CHOICES_STATUS);
      // The form is filled in already
      expect(component.form.controls.court.value).toBe(COURT_ONE);
    });

    it('searches as soon as the last choice is answered, with the picks and the interpretationId', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE, NAME_CHOICE],
        }),
      );

      await pick(1, 1);
      httpMock.expectNone(isEntriesSearch);
      await pick(2, 1);
      expect(statusText()).toBe(FINDING);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(params.get('courtCode')).toBe(COURT_ONE);
      expect(JSON.parse(params.get('applicationCodes') ?? '[]')).toEqual([
        APPLICATION_CODE_A,
      ]);
      expect(params.get('applicantOrganisation')).toBe('Synthetic Council');
      expect(params.getAll('interpretationId')).toEqual([INTERPRETATION_ID]);

      // The choices become filters in Searched for, which takes focus
      expect(pendingSummary()).toBeNull();
      expect(query('input[type="radio"]')).toBeNull();
      expect(texts('#interpreted-filters-applied dd')).toEqual([
        `${APPLICATION_CODE_A} - Synthetic application one`,
        'Synthetic Council',
      ]);
      expect(changedByHandText()).toEqual([]);
      expect(document.activeElement?.id).toBe('searched-for-heading');
      expect(statusText()).toBe('25 applications found.');
    });

    it('searches after None of these, without that part of the question', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE],
        }),
      );

      // None of these is the last option of each choice
      await pick(1, 3);
      const { params } = (await expectSearch()).request;

      expect(params.get('courtCode')).toBe(COURT_ONE);
      expect(params.has('applicationCodes')).toBe(false);
      expect(searchedFor()).not.toBeNull();
      expect(texts('#searched-for')[0]).not.toContain('None of these');
    });

    it('does not search when the last pick leaves the form failing validation, and keeps the choices', async () => {
      await interpret(
        interpretation({
          filter: {
            date: '2026-03-02',
            dateFrom: '2026-03-01',
            dateTo: '2026-03-31',
          },
          choicesNeeded: [CODE_CHOICE],
        }),
      );

      await pick(1, 1);
      await afterFocusTimeouts();

      httpMock.expectNone(isEntriesSearch);
      expect(errorSummaryTexts()).toContain(DATE_AND_RANGE);
      expect(document.activeElement).toBe(query('.govuk-error-summary'));
      expect(pendingSummary()).not.toBeNull();
      expect(
        query<HTMLInputElement>('#interpretation-choice-1-1')!.checked,
      ).toBe(true);
      expect(searchedFor()).toBeNull();
      expect(statusText()).toBe('');
    });

    it('blocks Search while a choice is not answered and links the error summary to the first unanswered choice', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE, NAME_CHOICE],
        }),
      );

      await pressSearch();

      httpMock.expectNone(isEntriesSearch);
      // One summary error for the choices, and an error on each choice
      expect(summaryLinks()).toEqual([
        {
          href: '#interpretation-choice-1-1',
          text: INTERPRETATION_CHOICE_ERROR_MESSAGE,
        },
      ]);
      expect(texts('#interpretation-choice-1-error')).toEqual([
        `Error: ${INTERPRETATION_CHOICE_ERROR_MESSAGE}`,
      ]);
      expect(texts('#interpretation-choice-2-error')).toEqual([
        `Error: ${INTERPRETATION_CHOICE_ERROR_MESSAGE}`,
      ]);

      // Answering the first moves the link to the second
      await pick(1, 1);
      expect(query('#interpretation-choice-1-error')).toBeNull();
      await pressSearch();

      httpMock.expectNone(isEntriesSearch);
      expect(summaryLinks()).toEqual([
        {
          href: '#interpretation-choice-2-1',
          text: INTERPRETATION_CHOICE_ERROR_MESSAGE,
        },
      ]);
    });

    it('links the error summary to the first unanswered choice when a later one is answered', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE, NAME_CHOICE],
        }),
      );
      await pick(2, 1);

      await pressSearch();

      httpMock.expectNone(isEntriesSearch);
      expect(summaryLinks()).toEqual([
        {
          href: '#interpretation-choice-1-1',
          text: INTERPRETATION_CHOICE_ERROR_MESSAGE,
        },
      ]);
      expect(query('#interpretation-choice-2-error')).toBeNull();
    });

    it('lists the choice error before the search form errors', async () => {
      await interpret(interpretation({ choicesNeeded: [NAME_CHOICE] }));

      await pressSearch();

      httpMock.expectNone(isEntriesSearch);
      expect(errorSummaryTexts()).toEqual([
        INTERPRETATION_CHOICE_ERROR_MESSAGE,
        INVALID_SEARCH_CRITERIA,
      ]);
    });

    it('searches after the last pick once Search was blocked by the choices, and clears the choice errors', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      await pressSearch();
      expect(component.showChoiceErrors()).toBe(true);

      await pick(1, 2);
      await expectSearch();

      expect(query('.govuk-error-summary')).toBeNull();
      expect(component.showChoiceErrors()).toBe(false);
    });

    it('drops the "no entries found" message of an earlier search, whose filters it replaced', async () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      await expectSearch(EMPTY_PAGE);
      expect(query('app-notification-banner')).not.toBeNull();

      await interpret(withChoices(CODE_CHOICE));

      expect(query('.govuk-error-summary')).toBeNull();
      expect(query('app-notification-banner')).toBeNull();
      expect(root().textContent).not.toContain('No results found.');
    });

    it('still says no entries were found for a search that was running when the choices came', async () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      const running = httpMock.expectOne(isEntriesSearch);

      await interpret(withChoices(CODE_CHOICE));
      expect(component.vm().isSearch).toBe(true);
      running.flush(EMPTY_PAGE);
      await settle();

      expect(query('app-notification-banner')?.textContent).toContain(
        'No application list entries found',
      );
    });

    it('keeps the results on screen after a blocked Search', async () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      await expectSearch(RESULTS_PAGE);
      component.form.patchValue({ applicantOrg: '' });
      await pressSearch();
      httpMock.expectNone(isEntriesSearch);

      await interpret(withChoices(CODE_CHOICE));

      expect(component.vm().isSearch).toBe(true);
      expect(component.vm().rows).toHaveLength(1);
      expect(query('app-sortable-table')).not.toBeNull();
      expect(query('.govuk-error-summary')).toBeNull();
      expect(query('app-notification-banner')).toBeNull();
    });

    it('fills the control a pick sets, and empties it again when None of these is picked', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE, NAME_CHOICE],
        }),
      );

      await pick(1, 2);
      expect(component.form.controls.applicationCodes.value).toEqual([
        APPLICATION_CODE_B,
      ]);
      expect(component.vm().isAdvancedSearch).toBe(true);

      await pick(1, 1);
      expect(component.form.controls.applicationCodes.value).toEqual([
        APPLICATION_CODE_A,
      ]);

      await pick(1, 3);
      expect(component.form.controls.applicationCodes.value).toEqual([]);
      // The applicant is not answered yet
      httpMock.expectNone(isEntriesSearch);
    });

    it('takes a pick out when its answer is cleared', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE, NAME_CHOICE],
        }),
      );
      await pick(1, 1);
      expect(component.form.controls.applicationCodes.value).toEqual([
        APPLICATION_CODE_A,
      ]);

      component.onInterpretationAnswersChange([null, null]);
      await settle();

      expect(component.form.controls.applicationCodes.value).toEqual([]);
      expect(component.interpretationAnswers()).toEqual([null, null]);
      await pressSearch();
      httpMock.expectNone(isEntriesSearch);
      expect(summaryLinks()).toEqual([
        {
          href: '#interpretation-choice-1-1',
          text: INTERPRETATION_CHOICE_ERROR_MESSAGE,
        },
      ]);
    });

    it('ignores answers when there is no interpretation', () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });

      component.onInterpretationAnswersChange(['option-0']);

      expect(component.form.controls.applicantOrg.value).toBe(
        'Synthetic Organisation',
      );
      expect(component.interpretationAnswers()).toEqual([]);
      expect(component.interpretationChanges()).toBeNull();
    });

    it('keeps filters edited by hand when a choice is picked, and searches again when an answer changes', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE, dateFrom: '2026-03-01' },
          choicesNeeded: [CODE_CHOICE, NAME_CHOICE],
        }),
      );
      component.form.patchValue({
        dateFrom: '2026-02-01',
        respondentSurname: 'Synthetic',
        applicationCodes: ['AP99003'],
      });

      await pick(1, 1);
      await pick(2, 2);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({
          court: COURT_ONE,
          dateFrom: '2026-02-01',
          respondentSurname: 'Synthetic',
          applicationCodes: ['AP99003', APPLICATION_CODE_A],
          applicantOrg: 'Example Council',
        }),
      );
      const picked = await pickedSearchParams();
      expect(picked.get('dateFrom')).toBe('2026-02-01');

      // Changing the answer takes out only the code the first answer added
      await pick(1, 2);
      expect(component.form.controls.applicationCodes.value).toEqual([
        'AP99003',
        APPLICATION_CODE_B,
      ]);
      const changed = await pickedSearchParams();
      expect(JSON.parse(changed.get('applicationCodes') ?? '[]')).toEqual([
        'AP99003',
        APPLICATION_CODE_B,
      ]);
    });

    it('adds a court pick to Other courts when Court is set, labelled with its name', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [ENDED_COURT_CHOICE, NAME_CHOICE],
        }),
      );

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(component.form.controls.courtCodes.value).toEqual([ENDED_COURT]);
      expect(selectedOtherCourts()).toEqual(['Synthetic Closed Court']);

      await pick(1, 2);

      expect(component.form.controls.courtCodes.value).toEqual([]);
      expect(component.form.controls.court.value).toBe(COURT_ONE);
    });

    it('puts a court pick into Court with its name, and drops a CJA for it', async () => {
      await interpret(cjaWithChoices(COURT_CHOICE, NAME_CHOICE));
      expect(component.placeState().cjaSearch).toBe('Synthetic Area');

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_TWO);
      expect(component.form.controls.cja.value).toBe('');
      expect(component.placeState().courthouseSearch).toBe(
        'Synthetic Court Two',
      );
      expect(component.placeState().cjaSearch).toBe('');
      expect(courtText()).toBe('Synthetic Court Two');
    });

    it('leaves focus on the choice that was picked', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE, NAME_CHOICE],
        }),
      );
      query<HTMLInputElement>('#interpretation-choice-1-1')!.focus();

      await pick(1, 1);

      expect(document.activeElement).toBe(query('#interpretation-choice-1-1'));
      // The pick was applied
      expect(component.form.controls.applicationCodes.value).toEqual([
        APPLICATION_CODE_A,
      ]);
    });

    it('leaves no court or CJA error behind when a court pick replaces a CJA, or None of these brings it back', async () => {
      await pressSearch();
      await interpret(cjaWithChoices(COURT_CHOICE, NAME_CHOICE));
      // Blocked by the choice, so errors on the fields would show
      await pressSearch();
      expect(component.vm().submitted).toBe(true);

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_TWO);
      expect(component.form.controls.cja.errors?.['cjaNotFound']).toBe(
        undefined,
      );
      expect(inlineErrors()).not.toContain('Criminal justice area not found');
      expect(inlineErrors()).not.toContain('Court location not found');

      await pick(1, 2);

      expect(component.form.controls.cja.value).toBe(CJA_AREA.code);
      expect(component.form.controls.court.errors?.['courtNotFound']).toBe(
        undefined,
      );
      expect(inlineErrors()).not.toContain('Criminal justice area not found');
      expect(inlineErrors()).not.toContain('Court location not found');
    });
  });

  // An arrow key in a radio group selects the next option, so a keyboard or
  // screen reader user passes over options: the search waits until they
  // settle on one
  describe('choices answered with the keyboard', () => {
    beforeEach(async () => {
      await createPage();
      // A, B and None of these
      await interpret(withChoices(CODE_CHOICE));
      choiceRadio(1, 1).focus();
    });

    it('does not search for the options passed over with the arrow keys, and searches for the one left selected when focus moves on', async () => {
      await arrowTo(1, 1, 2);
      httpMock.expectNone(isEntriesSearch);
      expect(component.form.controls.applicationCodes.value).toEqual([
        APPLICATION_CODE_B,
      ]);

      await arrowTo(1, 2, 3);
      httpMock.expectNone(isEntriesSearch);
      // The choices stay in place, with focus on the option reached
      expect(pendingSummary()).not.toBeNull();
      expect(document.activeElement).toBe(choiceRadio(1, 3));
      expect(choiceRadio(1, 3).checked).toBe(true);
      expect(component.form.controls.applicationCodes.value).toEqual([]);

      // On to the search form
      query<HTMLInputElement>('#applicantName')!.focus();
      await settle();
      const req = httpMock.expectOne(isEntriesSearch);
      const { params } = req.request;
      req.flush(RESULTS_PAGE);
      await settle();

      expect(params.has('applicationCodes')).toBe(false);
      expect(params.get('applicantName')).toBe('Synthetic Applicant');
      expect(params.getAll('interpretationId')).toEqual([INTERPRETATION_ID]);
      expect(searchedFor()).not.toBeNull();
    });

    it('searches when Space is pressed on the option reached with the arrow keys', async () => {
      await arrowTo(1, 1, 2);
      httpMock.expectNone(isEntriesSearch);

      keydown(choiceRadio(1, 2), ' ');
      await settle();
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(JSON.parse(params.get('applicationCodes') ?? '[]')).toEqual([
        APPLICATION_CODE_B,
      ]);
      expect(params.getAll('interpretationId')).toEqual([INTERPRETATION_ID]);
    });

    it('searches at once for a click, even after the arrow keys were used', async () => {
      await arrowTo(1, 1, 2);
      httpMock.expectNone(isEntriesSearch);

      await pick(1, 1);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(JSON.parse(params.get('applicationCodes') ?? '[]')).toEqual([
        APPLICATION_CODE_A,
      ]);
    });

    it('does not search again when focus leaves a choice whose pick has searched', async () => {
      await pick(1, 1);
      await pickedSearchParams();

      query<HTMLInputElement>('#applicantName')!.focus();
      await settle();

      httpMock.expectNone(isEntriesSearch);
    });

    it('cancels the search from an earlier pick when the arrow keys move on, and searches with the interpretationId when staff settle', async () => {
      await pick(1, 1);
      const running = httpMock.expectOne(isEntriesSearch);
      expect(running.request.params.getAll('interpretationId')).toEqual([
        INTERPRETATION_ID,
      ]);

      await arrowTo(1, 1, 2);

      expect(running.cancelled).toBe(true);
      httpMock.expectNone(isEntriesSearch);
      expect(pendingSummary()).not.toBeNull();
      expect(document.activeElement).toBe(choiceRadio(1, 2));
      // Nothing about a search is left on the page
      expect(query('app-notification-banner')).toBeNull();
      expect(statusText()).toBe('');

      keydown(choiceRadio(1, 2), 'Enter');
      await settle();
      expect(statusText()).toBe(FINDING);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(JSON.parse(params.get('applicationCodes') ?? '[]')).toEqual([
        APPLICATION_CODE_B,
      ]);
      expect(params.getAll('interpretationId')).toEqual([INTERPRETATION_ID]);
      expect(texts('#interpreted-filters-applied dd')).toContain(
        `${APPLICATION_CODE_B} - Synthetic application two`,
      );
    });

    it('waits for every choice before searching when focus leaves the first', async () => {
      await interpret(withChoices(CODE_CHOICE, NAME_CHOICE));
      choiceRadio(1, 1).focus();
      await arrowTo(1, 1, 2);

      // On to the second choice
      choiceRadio(2, 1).focus();
      await settle();
      httpMock.expectNone(isEntriesSearch);

      await arrowTo(2, 1, 2);
      query<HTMLInputElement>('#applicantName')!.focus();
      await settle();
      const { params } = (await expectSearch()).request;

      expect(JSON.parse(params.get('applicationCodes') ?? '[]')).toEqual([
        APPLICATION_CODE_B,
      ]);
      expect(params.get('applicantOrganisation')).toBe('Example Council');
    });
  });

  // "Searched for" lists what the search used: a filter staff changed by
  // hand before it ran is left out, and the summary says so
  describe('Searched for after filters changed by hand', () => {
    beforeEach(async () => {
      await createPage();
    });

    const COURT_ONE_ROW = {
      field: SearchFilterField.COURT_CODE,
      label: 'Synthetic Court One',
      source: InterpretationSource.SYNONYM,
    };
    const CODE_A_LABEL = `${APPLICATION_CODE_A} - Synthetic application one`;
    const CODE_B_LABEL = `${APPLICATION_CODE_B} - Synthetic application two`;

    it('leaves out a court changed by hand before the last pick, and says filters were changed', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          appliedFilters: [COURT_ONE_ROW],
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      component.selectCourthouse(COURTS[1]);
      await settle();

      await pick(1, 1);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(params.get('courtCode')).toBe(COURT_TWO);
      expect(texts('#searched-for')[0]).not.toContain('Synthetic Court One');
      expect(texts('#interpreted-filters-applied dd')).toEqual([CODE_A_LABEL]);
      expect(changedByHandText()).toEqual([SEARCHED_FOR_CHANGED_BY_HAND_TEXT]);
      // Values typed by hand are never repeated in the summary
      expect(texts('#searched-for')[0]).not.toContain(COURT_TWO_LABEL);
    });

    it('lists every filter and says nothing about hand edits when nothing was changed', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          appliedFilters: [COURT_ONE_ROW],
          choicesNeeded: [CODE_CHOICE],
        }),
      );

      await pick(1, 1);
      await expectSearch(RESULTS_PAGE);

      expect(texts('#interpreted-filters-applied dd')).toEqual([
        'Synthetic Court One',
        CODE_A_LABEL,
      ]);
      expect(changedByHandText()).toEqual([]);
    });

    it('says nothing about hand edits when court picks made in another order fill Court and Other courts the other way round', async () => {
      await interpret(
        interpretation({
          filter: { applicantName: 'Synthetic Applicant' },
          choicesNeeded: [
            { ...COURT_CHOICE, options: [{ ...TWO_COURTS_CHOICE.options[0] }] },
            COURT_CHOICE,
            NAME_CHOICE,
          ],
        }),
      );

      await pick(3, 3);
      await pick(2, 1);
      await pick(1, 1);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(courtCodesParam(params)).toEqual([COURT_TWO, COURT_ONE]);
      expect(texts('#interpreted-filters-applied dd')).toEqual([
        'Synthetic Court One',
        'Synthetic Court Two',
      ]);
      expect(changedByHandText()).toEqual([]);
    });

    it('leaves out a filter from the question that was removed by hand before the last pick', async () => {
      await interpret(
        interpretation({
          filter: {
            courtCode: COURT_ONE,
            applicantName: 'Synthetic Applicant',
          },
          appliedFilters: [
            COURT_ONE_ROW,
            {
              field: SearchFilterField.APPLICANT_NAME,
              label: 'Synthetic Applicant',
              source: InterpretationSource.NAME_SEARCH,
            },
          ],
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      component.form.patchValue({ applicantName: '' });

      await pick(1, 1);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(params.has('applicantName')).toBe(false);
      expect(texts('#interpreted-filters-applied dd')).toEqual([
        'Synthetic Court One',
        CODE_A_LABEL,
      ]);
      expect(texts('#searched-for')[0]).not.toContain('Synthetic Applicant');
      expect(changedByHandText()).toEqual([SEARCHED_FOR_CHANGED_BY_HAND_TEXT]);
    });

    it('leaves out a value from the question that was changed by hand before the last pick', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE, dateFrom: '2026-03-01' },
          appliedFilters: [
            COURT_ONE_ROW,
            {
              field: SearchFilterField.DATE_FROM,
              label: '1 March 2026',
              source: InterpretationSource.DATE_RULE,
            },
          ],
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      component.form.patchValue({ dateFrom: '2026-02-01' });

      await pick(1, 1);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(params.get('dateFrom')).toBe('2026-02-01');
      expect(texts('#interpreted-filters-applied dd')).toEqual([
        'Synthetic Court One',
        CODE_A_LABEL,
      ]);
      expect(changedByHandText()).toEqual([SEARCHED_FOR_CHANGED_BY_HAND_TEXT]);
    });

    it('says filters were changed when one was added by hand, without repeating it', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          appliedFilters: [COURT_ONE_ROW],
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      component.form.patchValue({ respondentSurname: 'Synthetic' });

      await pick(1, 1);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(params.get('respondentSurname')).toBe('Synthetic');
      expect(texts('#interpreted-filters-applied dd')).toEqual([
        'Synthetic Court One',
        CODE_A_LABEL,
      ]);
      expect(texts('#interpreted-filters-applied dt')).not.toContain(
        'Respondent surname',
      );
      expect(changedByHandText()).toEqual([SEARCHED_FOR_CHANGED_BY_HAND_TEXT]);
    });

    it('leaves out a list date fixed by hand after a pick search was blocked, once a changed pick searches', async () => {
      await interpret(
        interpretation({
          filter: {
            date: '2026-03-02',
            dateFrom: '2026-03-01',
            dateTo: '2026-03-31',
          },
          appliedFilters: [
            {
              field: SearchFilterField.DATE,
              label: '2 March 2026',
              source: InterpretationSource.DATE_RULE,
            },
            {
              field: SearchFilterField.DATE_FROM,
              label: '1 March 2026',
              source: InterpretationSource.DATE_RULE,
            },
            {
              field: SearchFilterField.DATE_TO,
              label: '31 March 2026',
              source: InterpretationSource.DATE_RULE,
            },
          ],
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      await pick(1, 1);
      httpMock.expectNone(isEntriesSearch);
      expect(errorSummaryTexts()).toContain(DATE_AND_RANGE);

      component.form.patchValue({ date: null });
      await settle();
      await pick(1, 2);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(params.has('date')).toBe(false);
      expect(texts('#interpreted-filters-applied dd')).toEqual([
        '1 March 2026',
        '31 March 2026',
        CODE_B_LABEL,
      ]);
      expect(texts('#searched-for')[0]).not.toContain('2 March 2026');
      expect(changedByHandText()).toEqual([SEARCHED_FOR_CHANGED_BY_HAND_TEXT]);
    });

    it('is not saved with the search state', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          appliedFilters: [COURT_ONE_ROW],
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      component.form.patchValue({ respondentSurname: 'Synthetic' });

      await pick(1, 1);
      await expectSearch(RESULTS_PAGE);

      const saved = JSON.stringify([
        searchStateService.state(),
        searchFormService.state(),
      ]);
      expect(saved).not.toContain('changed by hand');
      expect(saved).not.toContain(CODE_A_LABEL);
    });
  });

  // A court choice is shown as radios beside NAME_CHOICE, which is answered
  // None of these first, so each court pick then searches. Those searches
  // fail, so the choices stay for the next pick.
  describe('choices and filters set by hand', () => {
    beforeEach(async () => {
      await createPage();
    });

    // None of these for NAME_CHOICE, the second choice
    const answerApplicantNone = (): Promise<void> => pick(2, 3);

    it('takes out a CJA chosen by hand for a court pick, and puts it back for None of these', async () => {
      await interpret(withChoices(COURT_CHOICE, NAME_CHOICE));
      component.selectCja(CJA_AREA);
      await settle();
      await answerApplicantNone();

      await pick(1, 1);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_TWO, cja: '' }),
      );
      expect(courtText()).toBe('Synthetic Court Two');
      expect(cjaText()).toBe('');
      expect(notApplied()).toEqual([CJA_LABEL]);
      const picked = await pickedSearchParams();
      expect(picked.get('courtCode')).toBe(COURT_TWO);

      await pick(1, 2);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: '', cja: CJA_AREA.code }),
      );
      expect(courtText()).toBe('');
      expect(cjaText()).toBe(CJA_LABEL);
      expect(query('#interpreted-filters-not-applied')).toBeNull();
      const unpicked = await pickedSearchParams();
      expect(unpicked.get('cjaCode')).toBe(CJA_AREA.code);
      expect(unpicked.has('courtCode')).toBe(false);
    });

    it('takes out an Other location typed by hand for a court pick, and puts it back for None of these', async () => {
      await interpret(withChoices(COURT_CHOICE, NAME_CHOICE));
      component.form.patchValue({ location: 'Synthetic Hall' });
      await settle();
      await answerApplicantNone();

      await pick(1, 1);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_TWO, location: '' }),
      );
      expect(courtText()).toBe('Synthetic Court Two');
      expect(query<HTMLInputElement>('input#location')!.value).toBe('');
      expect(notApplied()).toEqual(['Synthetic Hall']);
      const picked = await pickedSearchParams();
      expect(picked.get('courtCode')).toBe(COURT_TWO);

      await pick(1, 2);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: '', location: 'Synthetic Hall' }),
      );
      expect(courtText()).toBe('');
      expect(query<HTMLInputElement>('input#location')!.value).toBe(
        'Synthetic Hall',
      );
      const unpicked = await pickedSearchParams();
      expect(unpicked.get('otherLocationDescription')).toBe('Synthetic Hall');
      expect(unpicked.has('courtCode')).toBe(false);
    });

    it('adds a court pick to Other courts with its label rather than replace a Court chosen by hand', async () => {
      await interpret(withChoices(COURT_CHOICE, NAME_CHOICE));
      component.selectCourthouse(COURTS[0]);
      await settle();
      await answerApplicantNone();

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(component.form.controls.courtCodes.value).toEqual([COURT_TWO]);
      expect(component.courtChipLabels()[COURT_TWO]).toBe(
        'Synthetic Court Two',
      );
      expect(courtText()).toBe(COURT_ONE_LABEL);
      expect(selectedOtherCourts()).toEqual([COURT_TWO_LABEL]);
      const picked = await pickedSearchParams();
      expect(courtCodesParam(picked)).toEqual([COURT_ONE, COURT_TWO]);
      expect(picked.has('courtCode')).toBe(false);

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(component.form.controls.courtCodes.value).toEqual([]);
      expect(courtText()).toBe(COURT_ONE_LABEL);
      expect(selectedOtherCourts()).toEqual([]);
      const unpicked = await pickedSearchParams();
      expect(unpicked.get('courtCode')).toBe(COURT_ONE);
      expect(unpicked.has('courtCodes')).toBe(false);
    });

    it('does not apply a CJA pick while a Court chosen by hand is set, and lists it', async () => {
      // A CJA choice is not about courts, so it is shown as radios alone
      await interpret(withChoices(CJA_CHOICE));
      component.selectCourthouse(COURTS[0]);
      await settle();

      await pick(1, 1);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_ONE, cja: '' }),
      );
      expect(courtText()).toBe(COURT_ONE_LABEL);
      expect(cjaText()).toBe('');
      expect(notApplied()).toEqual(['Synthetic Area']);
      const picked = await pickedSearchParams();
      expect(picked.get('courtCode')).toBe(COURT_ONE);

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(query('#interpreted-filters-not-applied')).toBeNull();
      const unpicked = await pickedSearchParams();
      expect(unpicked.get('courtCode')).toBe(COURT_ONE);
    });

    it('puts a court pick into an empty Court when Other courts is full, never a 20th Other court', async () => {
      const ended = endedCourts(19);
      await interpret(withChoices(OTHER_COURT_CHOICE, NAME_CHOICE));
      component.form.patchValue({ courtCodes: ended });
      await settle();
      await answerApplicantNone();

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_TWO);
      expect(component.form.controls.courtCodes.value).toEqual(ended);
      expect(courtText()).toBe('Synthetic Court Two');
      const picked = await pickedSearchParams();
      expect(courtCodesParam(picked)).toEqual([COURT_TWO, ...ended]);

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe('');
      expect(component.form.controls.courtCodes.value).toEqual(ended);
      expect(courtText()).toBe('');
      const unpicked = await pickedSearchParams();
      expect(courtCodesParam(unpicked)).toEqual(ended);
    });

    it('lists a court pick as not applied when Court and Other courts are full', async () => {
      const ended = endedCourts(19);
      await interpret(withChoices(ENDED_COURT_CHOICE, NAME_CHOICE));
      component.selectCourthouse(COURTS[0]);
      component.form.patchValue({ courtCodes: ended });
      await settle();
      await answerApplicantNone();

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(component.form.controls.courtCodes.value).toEqual(ended);
      expect(notApplied()).toEqual(['Synthetic Closed Court']);
      const picked = await pickedSearchParams();
      expect(courtCodesParam(picked)).toEqual([COURT_ONE, ...ended]);
    });

    it('moves an active court from a full Other courts into Court to make room for a pick, and moves it back with its label for None of these', async () => {
      // Other courts from the question, labelled, then filled up by hand
      await interpret(
        interpretation({
          filter: { courtCodes: [COURT_ONE] },
          appliedFilters: [
            {
              field: SearchFilterField.COURT_CODES,
              label: 'Synthetic Court One',
              source: InterpretationSource.SYNONYM,
            },
          ],
          choicesNeeded: [ENDED_COURT_CHOICE, NAME_CHOICE],
        }),
      );
      component.form.patchValue({
        courtCodes: [COURT_ONE, ...endedCourts(18)],
      });
      await settle();
      await answerApplicantNone();

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(component.form.controls.courtCodes.value).toEqual([
        ...endedCourts(18),
        ENDED_COURT,
      ]);
      // Its Other courts label is Court's display text
      expect(courtText()).toBe('Synthetic Court One');
      expect(component.courtChipLabels()[COURT_ONE]).toBeUndefined();
      expect(selectedOtherCourts()).toContain('Synthetic Closed Court');
      const picked = await pickedSearchParams();
      expect(courtCodesParam(picked)).toHaveLength(20);

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe('');
      expect(component.form.controls.courtCodes.value).toEqual([
        ...endedCourts(18),
        COURT_ONE,
      ]);
      expect(component.courtChipLabels()).toEqual({
        [COURT_ONE]: 'Synthetic Court One',
      });
      expect(courtText()).toBe('');
      expect(query('#interpreted-filters-not-applied')).toBeNull();
      const unpicked = await pickedSearchParams();
      expect(courtCodesParam(unpicked)).toEqual([
        ...endedCourts(18),
        COURT_ONE,
      ]);
    });

    it('lists a court it cannot move back into a full Other courts', async () => {
      const others = [...endedCourts(18), COURT_ONE];
      await interpret(withChoices(ENDED_COURT_CHOICE, NAME_CHOICE));
      component.form.patchValue({ courtCodes: others });
      await settle();
      await answerApplicantNone();
      await pick(1, 1);
      await pickedSearchParams();
      // By hand: Court changed, and Other courts full again
      component.selectCourthouse(COURTS[1]);
      component.form.patchValue({
        courtCodes: [...endedCourts(18), 'SYN800'],
      });
      await settle();

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe(COURT_TWO);
      expect(component.form.controls.courtCodes.value).toEqual([
        ...endedCourts(18),
        'SYN800',
      ]);
      expect(notApplied()).toEqual([COURT_ONE]);
      const unpicked = await pickedSearchParams();
      expect(courtCodesParam(unpicked)).toHaveLength(20);
    });

    it('does not move a court back that is already searched', async () => {
      const others = [...endedCourts(18), COURT_ONE];
      await interpret(withChoices(ENDED_COURT_CHOICE, NAME_CHOICE));
      component.form.patchValue({ courtCodes: others });
      await settle();
      await answerApplicantNone();
      await pick(1, 1);
      await pickedSearchParams();
      // By hand: Court changed, and the moved court added to Other courts
      component.selectCourthouse(COURTS[1]);
      component.form.patchValue({ courtCodes: [COURT_ONE] });
      await settle();

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe(COURT_TWO);
      expect(component.form.controls.courtCodes.value).toEqual([COURT_ONE]);
      expect(query('#interpreted-filters-not-applied')).toBeNull();
      await pickedSearchParams();
    });

    it('lists a list pick as not applied when the list is full', async () => {
      const codes = Array.from(
        { length: 50 },
        (_, index) => `AP9${String(index).padStart(4, '0')}`,
      );
      await interpret(withChoices(CODE_CHOICE));
      component.form.patchValue({ applicationCodes: codes });
      await settle();

      await pick(1, 1);

      expect(component.form.controls.applicationCodes.value).toEqual(codes);
      const { params } = (await expectSearch()).request;
      expect(
        JSON.parse(params.get('applicationCodes') ?? '[]') as string[],
      ).toEqual(codes);
      // Searched for lists it as not applied, not as a filter
      expect(notApplied()).toEqual([
        `${APPLICATION_CODE_A} - Synthetic application one`,
      ]);
      expect(texts('#interpreted-filters-applied dd')).not.toContain(
        `${APPLICATION_CODE_A} - Synthetic application one`,
      );
    });

    it('changes a court answer from one court to another, and to None of these, keeping Court and CJA apart', async () => {
      await interpret(cjaWithChoices(TWO_COURTS_CHOICE, NAME_CHOICE));
      await answerApplicantNone();

      await pick(1, 1);
      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_ONE, courtCodes: [], cja: '' }),
      );
      expect(courtText()).toBe('Synthetic Court One');
      await pickedSearchParams();

      // The new court replaces the court the first answer set
      await pick(1, 2);
      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_TWO, courtCodes: [], cja: '' }),
      );
      expect(courtText()).toBe('Synthetic Court Two');
      expect(cjaText()).toBe('');
      expect(notApplied()).toEqual(['Synthetic Area']);
      const picked = await pickedSearchParams();
      expect(picked.get('courtCode')).toBe(COURT_TWO);
      expect(picked.has('courtCodes')).toBe(false);

      // None of these brings back the CJA the court took out
      await pick(1, 3);
      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({
          court: '',
          courtCodes: [],
          cja: CJA_AREA.code,
        }),
      );
      expect(courtText()).toBe('');
      expect(cjaText()).toBe('Synthetic Area');
      expect(query('#interpreted-filters-not-applied')).toBeNull();
      const unpicked = await pickedSearchParams();
      expect(unpicked.get('cjaCode')).toBe(CJA_AREA.code);
      expect(unpicked.has('courtCode')).toBe(false);
    });

    it('keeps the CJA out when None of these is picked after a court was added by hand', async () => {
      await interpret(cjaWithChoices(COURT_CHOICE, NAME_CHOICE));
      await answerApplicantNone();
      await pick(1, 1);
      await pickedSearchParams();
      component.form.patchValue({ courtCodes: [COURT_ONE] });
      await settle();

      await pick(1, 2);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({
          court: '',
          courtCodes: [COURT_ONE],
          cja: '',
        }),
      );
      expect(cjaText()).toBe('');
      expect(notApplied()).toEqual(['Synthetic Area']);
      const unpicked = await pickedSearchParams();
      expect(unpicked.get('courtCode')).toBe(COURT_ONE);
    });

    it('keeps a Court changed by hand when the court answer is changed', async () => {
      await interpret(cjaWithChoices(COURT_CHOICE, NAME_CHOICE));
      await answerApplicantNone();
      await pick(1, 1);
      await pickedSearchParams();
      component.selectCourthouse(COURTS[0]);
      await settle();

      await pick(1, 2);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_ONE, courtCodes: [], cja: '' }),
      );
      expect(courtText()).toBe(COURT_ONE_LABEL);
      expect(cjaText()).toBe('');
      expect(notApplied()).toEqual(['Synthetic Area']);
      const unpicked = await pickedSearchParams();
      expect(unpicked.get('courtCode')).toBe(COURT_ONE);
    });
  });

  describe('a search from a question that does not run or fails', () => {
    beforeEach(async () => {
      await createPage();
    });

    // A list date and a date range together fail the form's validation
    const DATE_AND_RANGE_INTERPRETATION = interpretation({
      filter: {
        date: '2026-03-02',
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      },
      notices: [SearchInterpretationNotice.DATE_NOT_UNDERSTOOD],
    });

    it('does not search when the form fails validation: errors in the summary, which takes focus, and what the question set above the form', async () => {
      await interpret(DATE_AND_RANGE_INTERPRETATION);
      await afterFocusTimeouts();

      httpMock.expectNone(isEntriesSearch);
      expect(errorSummaryTexts()).toContain(DATE_AND_RANGE);
      expect(document.activeElement).toBe(query('.govuk-error-summary'));
      expect(query('#interpreted-filters-heading')?.textContent?.trim()).toBe(
        'Filters from your question',
      );
      expect(texts('#interpreted-filters-notices li')).toHaveLength(1);
      expect(searchedFor()).toBeNull();
      expect(statusText()).toBe('');
      // The form holds the question's filters, for staff to fix
      expect(component.form.controls.date.value).toBe('2026-03-02');
    });

    it('lets staff fix the form and search themselves, sending the interpretationId with that first search', async () => {
      await interpret(DATE_AND_RANGE_INTERPRETATION);
      component.form.patchValue({ date: null });

      await pressSearch();
      const { params } = (await expectSearch()).request;

      expect(params.getAll('interpretationId')).toEqual([INTERPRETATION_ID]);
      // A search staff ran themselves has no Searched for summary
      expect(searchedFor()).toBeNull();
      expect(pendingSummary()).toBeNull();
    });

    it.each([
      [500, SEARCH_FAILED],
      [400, 'Synthetic search problem'],
    ])(
      'shows the search error when it fails with %s, keeps what the question set above the form, and shows no Searched for',
      async (status, text) => {
        await interpret(FULL_INTERPRETATION);
        await failSearch(status);
        await afterFocusTimeouts();

        expect(errorSummaryTexts()).toEqual([text]);
        expect(document.activeElement).toBe(query('.govuk-error-summary'));
        expect(searchedFor()).toBeNull();
        expect(pendingSummary()).not.toBeNull();
        expect(statusText()).toBe('');
      },
    );

    it.each<[string, () => Promise<void>]>([
      [
        'blocked by validation',
        async () => {
          await interpret(
            interpretation({
              filter: {
                date: '2026-03-02',
                dateFrom: '2026-03-01',
                dateTo: '2026-03-31',
              },
              choicesNeeded: [PLACE_CHOICE],
            }),
          );
          await afterFocusTimeouts();
          httpMock.expectNone(isEntriesSearch);
          expect(errorSummaryTexts()).toContain(DATE_AND_RANGE);
        },
      ],
      [
        'failed',
        async () => {
          await interpret(interpretation({ choicesNeeded: [PLACE_CHOICE] }));
          await failSearch(500);
          await afterFocusTimeouts();
          expect(errorSummaryTexts()).toEqual([SEARCH_FAILED]);
        },
      ],
    ])(
      'lists the courts added from court choices above the form when their search is %s',
      async (_name, stopSearch) => {
        await stopSearch();

        expect(pendingSummary()).not.toBeNull();
        expect(query('#interpreted-filters-heading')?.textContent?.trim()).toBe(
          'Filters from your question',
        );
        expect(texts('#interpreted-filters')[0]).toContain(
          'Your question matched more than one court, so all of them were added to the filters:',
        );
        expect(texts('#interpreted-filters-matched-courts li')).toEqual([
          'Synthetic Court One',
          'Synthetic Closed Court',
          'Synthetic Court Two',
        ]);
        expect(query('#interpreted-filters-none')).toBeNull();
        expect(query('input[type="radio"]')).toBeNull();
        expect(searchedFor()).toBeNull();
        expect(document.activeElement).toBe(query('.govuk-error-summary'));
      },
    );

    it('runs a new search when a pick changes while the search from the last pick is loading, and both send the interpretationId', async () => {
      await interpret(withChoices(CODE_CHOICE));
      await pick(1, 1);
      const running = httpMock.expectOne(isEntriesSearch);

      await pick(1, 2);

      expect(running.cancelled).toBe(true);
      expect(running.request.params.getAll('interpretationId')).toEqual([
        INTERPRETATION_ID,
      ]);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;
      expect(JSON.parse(params.get('applicationCodes') ?? '[]')).toEqual([
        APPLICATION_CODE_B,
      ]);
      // The search whose results are shown has it too
      expect(params.getAll('interpretationId')).toEqual([INTERPRETATION_ID]);
      expect(texts('#interpreted-filters-applied dd')).toContain(
        `${APPLICATION_CODE_B} - Synthetic application two`,
      );
    });

    it('does not send the interpretationId again after the search from a pick failed', async () => {
      await interpret(withChoices(CODE_CHOICE));
      await pick(1, 1);
      const failed = await pickedSearchParams();
      expect(failed.getAll('interpretationId')).toEqual([INTERPRETATION_ID]);

      await pick(1, 2);
      const { params } = (await expectSearch(RESULTS_PAGE)).request;

      expect(JSON.parse(params.get('applicationCodes') ?? '[]')).toEqual([
        APPLICATION_CODE_B,
      ]);
      expect(params.has('interpretationId')).toBe(false);
    });

    it('keeps the answers staff changed while a search from a pick was loading when that search fails', async () => {
      await interpret(withChoices(CODE_CHOICE, NAME_CHOICE));
      await pick(1, 1);
      await pick(2, 1);
      const running = httpMock.expectOne(isEntriesSearch);

      // The applicant answer is taken back while the search loads
      component.onInterpretationAnswersChange(['option-0', null]);
      await settle();
      running.flush(
        { detail: 'Synthetic failure' },
        { status: 500, statusText: 'Synthetic status' },
      );
      await settle();

      expect(component.interpretationAnswers()).toEqual(['option-0', null]);
      expect(
        query<HTMLInputElement>('#interpretation-choice-2-1')!.checked,
      ).toBe(false);
      expect(component.form.controls.applicantOrg.value).toBe('');
      expect(searchedFor()).toBeNull();
    });
  });

  describe('Searched for summary', () => {
    beforeEach(async () => {
      await createPage();
    });

    it('is removed when staff press Search themselves', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      component.form.patchValue({ applicantName: 'Synthetic Refined' });
      await pressSearch();
      const req = await expectSearch(EMPTY_PAGE);
      await afterFocusTimeouts();

      expect(searchedFor()).toBeNull();
      expect(req.request.params.get('applicantName')).toBe('Synthetic Refined');
      // The no entries banner takes focus again, as for any search
      expect(document.activeElement).toBe(query('.govuk-notification-banner'));
      // The panel no longer says what the question's search found
      expect(statusText()).toBe('');
    });

    it('keeps saying Finding applications… when staff press Search while the question is worked out, and ignores another press', async () => {
      ask();
      const interpreting = httpMock.expectOne(isInterpretation);
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });

      await pressSearch();
      const manual = httpMock.expectOne(isEntriesSearch);

      expect(statusText()).toBe(FINDING);
      pressFind();
      httpMock.expectNone(isInterpretation);

      // The question's filters replace the form's, and its search runs
      interpreting.flush(FULL_INTERPRETATION);
      await settle();
      expect(manual.cancelled).toBe(true);
      await expectSearch(RESULTS_PAGE);
      expect(statusText()).toBe('25 applications found.');
    });

    it('stays with its results when staff press Search and it is blocked by validation', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      component.form.patchValue({ date: '2026-03-02' });
      await pressSearch();

      httpMock.expectNone(isEntriesSearch);
      expect(errorSummaryTexts()).toContain(DATE_AND_RANGE);
      expect(searchedFor()).not.toBeNull();
      expect(query('app-sortable-table')).not.toBeNull();
    });

    it('is removed on Clear search', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      await clearSearch();

      expect(searchedFor()).toBeNull();
      expect(statusText()).toBe('');
    });

    it('is removed as soon as a new question is asked', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      ask('synthetic court two');
      fixture.detectChanges();

      expect(searchedFor()).toBeNull();
      httpMock.expectOne(isInterpretation).flush(FULL_INTERPRETATION);
      await settle();
      await expectSearch(RESULTS_PAGE);
      expect(searchedFor()).not.toBeNull();
    });

    it('is removed when a new question is asked even when the new question fails', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      await failInterpretation(503);

      expect(searchedFor()).toBeNull();
      expect(summaryLinks()).toEqual([
        { href: '#plain-english-question', text: UNAVAILABLE },
      ]);
    });

    it('is kept while paging and sorting its results, and does not take focus again', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);
      question().focus();

      component.onPageChange(1);
      const page = await expectSearch(RESULTS_PAGE);
      component.onSortChange({ key: 'applicant', direction: 'asc' });
      const sort = await expectSearch(RESULTS_PAGE);

      expect(searchedFor()).not.toBeNull();
      expect(texts('#interpreted-filters-applied dd')).toHaveLength(5);
      expect(document.activeElement).toBe(question());
      expect(page.request.params.get('pageNumber')).toBe('1');
      expect(sort.request.params.getAll('sort')).toEqual(['applicantName,asc']);
      // The live status is not said again
      expect(statusText()).toBe('25 applications found.');
    });

    it('is not shown after Clear search, which cancels the search from the question, so its results and filters never come back', async () => {
      await interpret(FULL_INTERPRETATION);
      const running = httpMock.expectOne(isEntriesSearch);

      await clearSearch();

      expect(running.cancelled).toBe(true);
      expect(searchedFor()).toBeNull();
      expect(statusText()).toBe('');
      expect(query('app-sortable-table')).toBeNull();
      expect(component.vm().rows).toEqual([]);
      expect(searchStateService.state().appliedFilters).toEqual({});
    });

    it('describes only the new results when a new question is asked after Clear search cancelled the last search', async () => {
      await interpret(FULL_INTERPRETATION);
      const cleared = httpMock.expectOne(isEntriesSearch);
      await clearSearch();

      await interpret(
        interpretation({
          interpretationId: OTHER_INTERPRETATION_ID,
          filter: { courtCode: COURT_TWO },
          appliedFilters: [
            {
              field: SearchFilterField.COURT_CODE,
              label: 'Synthetic Court Two',
              source: InterpretationSource.SYNONYM,
            },
          ],
        }),
        'synthetic court two',
      );

      expect(cleared.cancelled).toBe(true);
      // Exactly one search is open: the new question's
      const req = httpMock.expectOne(isEntriesSearch);
      expect(req.request.params.get('courtCode')).toBe(COURT_TWO);
      expect(req.request.params.has('applicantName')).toBe(false);
      expect(req.request.params.getAll('interpretationId')).toEqual([
        OTHER_INTERPRETATION_ID,
      ]);
      req.flush({ ...RESULTS_PAGE, totalElements: 7 });
      await settle();

      expect(texts('#interpreted-filters-applied dd')).toEqual([
        'Synthetic Court Two',
      ]);
      expect(texts('#searched-for')[0]).not.toContain('with a blue folder');
      expect(statusText()).toBe('7 applications found.');
      expect(searchStateService.state().appliedFilters).toEqual({
        courtCode: COURT_TWO,
      });
    });

    it('saves only the filters of a search staff run after Clear search cancelled the search from the question', async () => {
      await interpret(FULL_INTERPRETATION);
      const cleared = httpMock.expectOne(isEntriesSearch);
      await clearSearch();
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });

      await pressSearch();
      const req = await expectSearch(RESULTS_PAGE);

      expect(cleared.cancelled).toBe(true);
      expect(req.request.params.has('interpretationId')).toBe(false);
      expect(component.vm().getFilters).toEqual({
        applicantOrganisation: 'Synthetic Organisation',
      });
      expect(searchStateService.state().appliedFilters).toEqual({
        applicantOrganisation: 'Synthetic Organisation',
      });
      expect(searchedFor()).toBeNull();
    });

    it('is never saved with the search state, and is not restored after navigation', async () => {
      await interpret({ ...FULL_INTERPRETATION, choicesNeeded: [CODE_CHOICE] });
      // The choice is answered, so the search runs
      await pick(1, 1);
      await expectSearch(RESULTS_PAGE);
      expect(searchedFor()).not.toBeNull();

      const saved = JSON.stringify([
        searchStateService.state(),
        searchFormService.state(),
        searchFormService.courtChipLabels(),
      ]);
      expect(saved).not.toContain(INTERPRETATION_ID);
      expect(saved).not.toContain(QUESTION);
      expect(saved).not.toContain('with a blue folder');
      expect(saved).not.toContain('Synthetic application one');

      // The next visit restores the search and runs it again
      fixture.destroy();
      await createPage();
      const restored = await expectSearch(RESULTS_PAGE);

      expect(restored.request.params.has('interpretationId')).toBe(false);
      expect(query('app-interpreted-filters-summary')).toBeNull();
      expect(searchedFor()).toBeNull();
    });
  });

  describe('interpretationId', () => {
    beforeEach(async () => {
      await createPage();
    });

    it('is sent once, as a top-level parameter of the search from the question', async () => {
      const getEntries = jest.spyOn(
        TestBed.inject(ApplicationListEntriesApi),
        'getEntries',
      );

      const first = await interpretAndSearch(FULL_INTERPRETATION);

      expect(first.request.params.getAll('interpretationId')).toEqual([
        INTERPRETATION_ID,
      ]);
      expect(getEntries.mock.calls[0][0].interpretationId).toBe(
        INTERPRETATION_ID,
      );
      expect(getEntries.mock.calls[0][0].filter).not.toHaveProperty(
        'interpretationId',
      );

      // A later search staff run themselves
      await pressSearch();
      const second = await expectSearch();

      expect(second.request.params.has('interpretationId')).toBe(false);
      expect(getEntries.mock.calls[1][0]).not.toHaveProperty(
        'interpretationId',
      );
    });

    it('is not sent when the interpretation has a blank one', async () => {
      const req = await interpretAndSearch({
        ...FULL_INTERPRETATION,
        interpretationId: '  ',
      });

      expect(req.request.params.has('interpretationId')).toBe(false);
      expect(req.request.params.get('courtCode')).toBe(COURT_ONE);
    });

    it('sends each question its own interpretationId', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      const req = await interpretAndSearch({
        ...FULL_INTERPRETATION,
        interpretationId: OTHER_INTERPRETATION_ID,
      });

      expect(req.request.params.getAll('interpretationId')).toEqual([
        OTHER_INTERPRETATION_ID,
      ]);
    });

    it('is never sent when paging or sorting, and neither calls the interpretation API', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);

      component.onPageChange(1);
      const page = await expectSearch(RESULTS_PAGE);
      component.onSortChange({ key: 'applicant', direction: 'asc' });
      const sort = await expectSearch(RESULTS_PAGE);

      httpMock.expectNone(isInterpretation);
      expect(page.request.params.has('interpretationId')).toBe(false);
      expect(sort.request.params.has('interpretationId')).toBe(false);
    });

    it('is kept for the search after the last choice when Search was blocked first', async () => {
      await interpret({ ...FULL_INTERPRETATION, choicesNeeded: [CODE_CHOICE] });
      await pressSearch();
      httpMock.expectNone(isEntriesSearch);

      await pick(1, 3);
      const req = await expectSearch();

      expect(req.request.params.getAll('interpretationId')).toEqual([
        INTERPRETATION_ID,
      ]);
    });

    it('is not sent after Clear search', async () => {
      await interpret({ ...FULL_INTERPRETATION, choicesNeeded: [CODE_CHOICE] });

      await clearSearch();
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      const req = await expectSearch();

      expect(req.request.params.has('interpretationId')).toBe(false);
    });

    it('is not sent after a new question that sets no filter', async () => {
      await interpret({ ...FULL_INTERPRETATION, choicesNeeded: [CODE_CHOICE] });

      await interpret(interpretation({ filter: ALL_NULL_FILTER }));
      await pressSearch();
      const req = await expectSearch();

      expect(req.request.params.has('interpretationId')).toBe(false);
      expect(req.request.params.get('courtCode')).toBe(COURT_ONE);
    });
  });

  describe('restoring a search', () => {
    beforeEach(async () => {
      await createPage();
    });

    const ENDED_AND_ACTIVE = interpretation({
      filter: { courtCodes: [ENDED_COURT, COURT_TWO] },
      appliedFilters: [
        {
          field: SearchFilterField.COURT_CODES,
          label: 'Synthetic Closed Court, Synthetic Court Two',
          source: InterpretationSource.SYNONYM,
        },
      ],
    });

    const restorePage = async (): Promise<TestRequest> => {
      fixture.destroy();
      await createPage();
      return expectSearch(RESULTS_PAGE);
    };

    it('shows an end-dated court with the label from the API after a restore', async () => {
      await interpretAndSearch(ENDED_AND_ACTIVE);

      const restored = await restorePage();

      expect(courtCodesParam(restored.request.params)).toEqual([
        ENDED_COURT,
        COURT_TWO,
      ]);
      // An active court keeps the typeahead's own label
      expect(selectedOtherCourts()).toEqual([
        'Synthetic Closed Court',
        COURT_TWO_LABEL,
      ]);
    });

    it('saves only the labels of the Other courts searched', async () => {
      await interpretAndSearch(ENDED_AND_ACTIVE);
      component.form.patchValue({ courtCodes: [COURT_TWO] });
      await pressSearch();
      await expectSearch(RESULTS_PAGE);

      expect(searchFormService.courtChipLabels()).toEqual({
        [COURT_TWO]: 'Synthetic Court Two',
      });
    });

    it('shows no label from a cleared search after a restore', async () => {
      await interpretAndSearch(ENDED_AND_ACTIVE);

      await clearSearch();
      expect(searchFormService.courtChipLabels()).toEqual({});
      component.form.patchValue({ courtCodes: [ENDED_COURT] });
      await pressSearch();
      await expectSearch(RESULTS_PAGE);

      await restorePage();

      expect(selectedOtherCourts()).toEqual([ENDED_COURT]);
    });
  });

  describe('errors', () => {
    beforeEach(async () => {
      await createPage();
    });

    it.each([
      [503, UNAVAILABLE],
      [504, UNAVAILABLE],
      [500, UNAVAILABLE],
      [429, TOO_MANY_REQUESTS],
      [422, NOT_UNDERSTOOD],
      [0, UNAVAILABLE],
    ])(
      'shows a %s from the interpretation API in the page error summary, linked to the question, and does not search',
      async (status, text) => {
        component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });

        await failInterpretation(status);
        await afterFocusTimeouts();

        expect(root().querySelectorAll('.govuk-error-summary')).toHaveLength(1);
        expect(summaryLinks()).toEqual([
          { href: '#plain-english-question', text },
        ]);
        expect(root().textContent).not.toContain('Synthetic detail');
        expect(document.activeElement).toBe(query('.govuk-error-summary'));
        // The form and the page are left as they were, and nothing is searched
        expect(component.form.controls.applicantOrg.value).toBe(
          'Synthetic Organisation',
        );
        expect(query('app-interpreted-filters-summary')).toBeNull();
        httpMock.expectNone(isEntriesSearch);
        expect(statusText()).toBe('');
        // The manual form still works
        await pressSearch();
        await expectSearch();
      },
    );

    it('shows the question error in the page error summary when no question is entered', async () => {
      ask('   ');
      await settle();

      httpMock.expectNone(isInterpretation);
      expect(summaryLinks()).toEqual([
        { href: '#plain-english-question', text: 'Enter a question' },
      ]);
    });

    it('lists the AI error before the errors of the search form', async () => {
      await pressSearch();

      await failInterpretation(503);

      expect(errorSummaryTexts()).toEqual([
        UNAVAILABLE,
        INVALID_SEARCH_CRITERIA,
      ]);
    });

    it('moves focus to the error summary when the interpretation fails, even while it already shows errors', async () => {
      await pressSearch();
      await afterFocusTimeouts();
      expect(document.activeElement).toBe(query('.govuk-error-summary'));
      question().focus();

      await failInterpretation(503);
      await afterFocusTimeouts();

      expect(document.activeElement).toBe(query('.govuk-error-summary'));
    });

    it('clears the AI error, in the summary and on the question, when Search is pressed', async () => {
      await failInterpretation(503);
      expect(query('#plain-english-question-error')).not.toBeNull();

      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      await expectSearch();

      expect(query('.govuk-error-summary')).toBeNull();
      expect(query('#plain-english-question-error')).toBeNull();
    });

    it('sends the question only in the POST body, never in the search', async () => {
      const req = await interpret(FULL_INTERPRETATION);

      expect(req.request.body).toEqual({ question: QUESTION });
      expect(req.request.urlWithParams).toBe(INTERPRETATIONS_PATH);

      const search = await expectSearch();

      expect(decodeURIComponent(search.request.urlWithParams)).not.toContain(
        QUESTION,
      );
    });
  });

  describe('Clear search', () => {
    beforeEach(async () => {
      await createPage();
    });

    it('clears the question, the summary, its choice errors and the AI errors', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      await pressSearch();
      expect(query('.govuk-error-summary')).not.toBeNull();

      await clearSearch();

      expect(question().value).toBe('');
      expect(query('app-interpreted-filters-summary')).toBeNull();
      expect(query('.govuk-error-summary')).toBeNull();
      expect(component.form.controls.court.value).toBe('');
      expect(component.showChoiceErrors()).toBe(false);
    });

    it('clears an AI error from the question and the summary', async () => {
      await failInterpretation(429);

      await clearSearch();

      expect(query('.govuk-error-summary')).toBeNull();
      expect(query('#plain-english-question-error')).toBeNull();
    });

    it('cancels an interpretation in flight, so its result never fills the form or searches', async () => {
      ask();
      const req = httpMock.expectOne(isInterpretation);

      await clearSearch();

      expect(req.cancelled).toBe(true);
      expect(component.form.controls.court.value).toBe('');
      expect(query('app-interpreted-filters-summary')).toBeNull();
      expect(statusText()).toBe('');
      httpMock.expectNone(isEntriesSearch);
    });

    it('lets staff ask a new question after clearing', async () => {
      await interpretAndSearch(FULL_INTERPRETATION);
      await clearSearch();

      const req = await interpret(
        interpretation({
          interpretationId: OTHER_INTERPRETATION_ID,
          filter: { courtCode: COURT_TWO },
        }),
        'synthetic court two',
      );
      const search = await expectSearch();

      expect(req.request.body).toEqual({ question: 'synthetic court two' });
      expect(component.form.controls.court.value).toBe(COURT_TWO);
      expect(search.request.params.get('courtCode')).toBe(COURT_TWO);
    });
  });
});
