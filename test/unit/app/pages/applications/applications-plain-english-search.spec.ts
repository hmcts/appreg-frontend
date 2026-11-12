/**
 * Tests for plain-English search on /applications (the page wiring): the
 * panel shows only with the AI capability, a result fills the form without
 * searching and leaves no message about an earlier search, Search is blocked
 * until every choice is answered, a pick keeps the court rules and list
 * limits against filters set by hand, AI errors go in the page's one error
 * summary, interpretationId is sent once, on the first search after an
 * interpretation, and never saved, and Other courts labels are restored.
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
import { INTERPRETATION_CHOICE_ERROR_MESSAGE } from '@constants/applications/error-messages';
import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@constants/applications-list/applications-list.constants';
import { PdfService } from '@core/services/pdf.service';
import {
  AiCapabilitiesDto,
  ApplicationCodeGetSummaryDto,
  ApplicationListEntriesApi,
  BASE_PATH,
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
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

// The typeahead labels of a court and the CJA chosen by hand
const COURT_ONE_LABEL = `${COURT_ONE} - Synthetic Court One`;
const COURT_TWO_LABEL = `${COURT_TWO} - Synthetic Court Two`;
const CJA_LABEL = `${CJA_AREA.code} - Synthetic Area`;

// Synthetic end-dated court codes for a full Other courts: SYN500 and on
const endedCourts = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `SYN${index + 500}`);

// An applicant name from the question, so the search has a filter, and one
// choice
const withChoice = (choice: InterpretationChoiceDto): SearchInterpretationDto =>
  interpretation({
    filter: { applicantName: 'Synthetic Applicant' },
    choicesNeeded: [choice],
  });

// A CJA from the question, with its label, and one choice
const cjaWithChoice = (
  choice: InterpretationChoiceDto,
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
    choicesNeeded: [choice],
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
    // No request the test did not expect, such as an AI call
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

  const ask = (text: string = QUESTION): void => {
    const field = question();
    field.value = text;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    query<HTMLButtonElement>('app-plain-english-search button')!.click();
    fixture.detectChanges();
  };

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

  const failInterpretation = async (status: number): Promise<void> => {
    ask();
    httpMock
      .expectOne(isInterpretation)
      .flush(
        { title: 'Synthetic problem title', detail: 'Synthetic detail' },
        { status, statusText: 'Synthetic status' },
      );
    await settle();
  };

  const pressSearch = async (): Promise<void> => {
    query<HTMLButtonElement>('button#search')!.click();
    await settle();
  };

  const expectSearch = async (page = EMPTY_PAGE): Promise<TestRequest> => {
    const req = httpMock.expectOne(isEntriesSearch);
    req.flush(page);
    await settle();
    return req;
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

  // The error summary and the "no entries found" banner focus themselves in a
  // timeout after they render
  const afterFocusTimeouts = (): Promise<unknown> =>
    new Promise((resolve) => setTimeout(resolve, 0));

  const expectNoSearchMessages = (): void => {
    expect(query('.govuk-error-summary')).toBeNull();
    expect(query('app-notification-banner')).toBeNull();
    expect(root().textContent).not.toContain('No results found.');
  };

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

  // Searches (every choice must be answered) and checks the request never
  // sends a court together with a CJA or Other location
  const searchParams = async (): Promise<HttpParams> => {
    await pressSearch();
    const { params } = (await expectSearch()).request;
    const hasCourt = params.has('courtCode') || params.has('courtCodes');

    expect(hasCourt && params.has('cjaCode')).toBe(false);
    expect(hasCourt && params.has('otherLocationDescription')).toBe(false);
    return params;
  };

  const courtCodesParam = (params: HttpParams): string[] =>
    JSON.parse(params.get('courtCodes') ?? '[]') as string[];

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
      // No summary until there is a result
      expect(query('app-interpreted-filters-summary')).toBeNull();
    });
  });

  describe('a result', () => {
    beforeEach(async () => {
      await createPage();
    });

    it('fills the controls from the interpretation and does not search', async () => {
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
      expect(query<HTMLInputElement>('input#court')!.value).toBe(
        'Synthetic Court One',
      );
      expect(query<HTMLInputElement>('#applicantName')!.value).toBe(
        'Synthetic Applicant',
      );
      httpMock.expectNone(isEntriesSearch);
      expect(component.vm().isSearch).toBe(false);
    });

    it('shows the summary of the filters, unused parts and notices from the interpretation', async () => {
      await interpret(FULL_INTERPRETATION);

      const summary = query('app-interpreted-filters-summary')!;
      expect(summary).not.toBeNull();
      expect(
        summary.compareDocumentPosition(query('form')!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
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
    });

    it('shows an interpreted application title in the Application title field', async () => {
      await interpret(
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
      await interpret(
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
        `${COURT_TWO} - Synthetic Court Two`,
      ]);
    });

    it('opens Advanced search when the interpretation sets one of its filters', async () => {
      expect(advancedSearch().open).toBe(false);

      await interpret(
        interpretation({ filter: { applicationCodes: [APPLICATION_CODE_A] } }),
      );

      expect(component.vm().isAdvancedSearch).toBe(true);
      expect(advancedSearch().open).toBe(true);
      expect(searchFormService.state().isAdvancedSearch).toBe(true);
    });

    it('leaves Advanced search closed when the interpretation sets none of its filters', async () => {
      await interpret(FULL_INTERPRETATION);

      expect(component.vm().isAdvancedSearch).toBe(false);
      expect(advancedSearch().open).toBe(false);
    });

    it('moves focus to the summary heading', async () => {
      await interpret(FULL_INTERPRETATION);

      expect(document.activeElement?.id).toBe('interpreted-filters-heading');
    });

    it('moves focus to the summary heading again when the same interpretation comes back', async () => {
      await interpret(FULL_INTERPRETATION);
      question().focus();
      expect(document.activeElement).toBe(question());

      // The same interpretationId: focus still moves
      await interpret(FULL_INTERPRETATION);

      expect(document.activeElement?.id).toBe('interpreted-filters-heading');
    });

    it('clears the errors of an earlier search, which were about the replaced values', async () => {
      await pressSearch();
      expect(texts('.govuk-error-summary__list li')).toEqual([
        INVALID_SEARCH_CRITERIA,
      ]);

      await interpret(FULL_INTERPRETATION);

      expect(query('.govuk-error-summary')).toBeNull();
    });

    it('says nothing about a search after a Search blocked by validation, and focus stays on the summary heading', async () => {
      await pressSearch();
      await afterFocusTimeouts();

      await interpret(FULL_INTERPRETATION);
      await afterFocusTimeouts();

      expectNoSearchMessages();
      expect(component.vm().isSearch).toBe(false);
      expect(component.vm().submitted).toBe(false);
      httpMock.expectNone(isEntriesSearch);
      expect(document.activeElement?.id).toBe('interpreted-filters-heading');
    });

    it('says nothing about a search after a Search blocked by a choice, when a new interpretation comes', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      await pressSearch();
      expect(summaryLinks()).toHaveLength(1);

      await interpret(FULL_INTERPRETATION);
      await afterFocusTimeouts();

      expectNoSearchMessages();
      httpMock.expectNone(isEntriesSearch);
      expect(document.activeElement?.id).toBe('interpreted-filters-heading');
    });

    it.each([
      [500, 'There was a problem retrieving the applications. Try again.'],
      [400, 'Synthetic search problem'],
    ])(
      'says nothing about a search after a Search that failed with %s',
      async (status, text) => {
        component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
        await pressSearch();
        await failSearch(status);
        expect(texts('.govuk-error-summary__list li')).toEqual([text]);

        await interpret(FULL_INTERPRETATION);
        await afterFocusTimeouts();

        expectNoSearchMessages();
        expect(component.vm().isSearch).toBe(false);
        expect(document.activeElement?.id).toBe('interpreted-filters-heading');
      },
    );

    it('drops the "no entries found" message of an earlier search, whose filters it replaced', async () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      await expectSearch(EMPTY_PAGE);
      expect(query('app-notification-banner')).not.toBeNull();

      await interpret(FULL_INTERPRETATION);

      expectNoSearchMessages();
    });

    it('still says no entries were found for a search that was running when the interpretation came', async () => {
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      const running = httpMock.expectOne(isEntriesSearch);

      await interpret(FULL_INTERPRETATION);
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

      await interpret(FULL_INTERPRETATION);

      expect(component.vm().isSearch).toBe(true);
      expect(component.vm().rows).toHaveLength(1);
      expect(query('app-sortable-table')).not.toBeNull();
      expect(query('.govuk-error-summary')).toBeNull();
      expect(query('app-notification-banner')).toBeNull();
    });

    it('clears a court error about text it replaced', async () => {
      component.setCourthouseSearch('Synthetic Unknown Court');
      component.onCourthouseInputChange();
      await pressSearch();
      expect(component.form.controls.court.errors).toEqual(
        expect.objectContaining({ courtNotFound: true }),
      );
      expect(inlineErrors()).toContain('Court location not found');

      await interpret(
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

      await interpret(interpretation({ filter: { courtCode: COURT_ONE } }));

      expect(component.vm().submitted).toBe(true);
      expect(component.form.controls.cja.errors?.['cjaNotFound']).toBe(
        undefined,
      );
      expect(inlineErrors()).not.toContain('Criminal justice area not found');
      expect(component.form.controls.court.value).toBe(COURT_ONE);
    });

    it('searches with the interpreted filters when Search is pressed', async () => {
      await interpret(FULL_INTERPRETATION);

      await pressSearch();
      const req = await expectSearch();

      expect(req.request.params.get('dateFrom')).toBe('2026-03-01');
      expect(req.request.params.get('dateTo')).toBe('2026-03-31');
      expect(req.request.params.get('courtCode')).toBe(COURT_ONE);
      expect(req.request.params.get('applicantName')).toBe(
        'Synthetic Applicant',
      );
      expect(req.request.params.get('status')).toBe('OPEN');
    });
  });

  describe('choices', () => {
    beforeEach(async () => {
      await createPage();
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
      expect(texts('.govuk-error-summary__list li')).toEqual([
        INTERPRETATION_CHOICE_ERROR_MESSAGE,
        INVALID_SEARCH_CRITERIA,
      ]);
    });

    it('searches once every choice is answered, None of these included', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE, NAME_CHOICE],
        }),
      );
      await pressSearch();
      httpMock.expectNone(isEntriesSearch);

      // None of these is the last option of each choice
      await pick(1, 3);
      expect(query('#interpretation-choice-1-error')).toBeNull();
      await pick(2, 1);
      await pressSearch();
      const req = await expectSearch();

      expect(req.request.params.get('courtCode')).toBe(COURT_ONE);
      expect(req.request.params.get('applicantOrganisation')).toBe(
        'Synthetic Council',
      );
      expect(req.request.params.has('applicationCodes')).toBe(false);
    });

    it('fills the control a pick sets, and empties it again when None of these is picked', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE],
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
    });

    it('takes a pick out when its answer is cleared', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE],
        }),
      );
      await pick(1, 1);
      expect(component.form.controls.applicationCodes.value).toEqual([
        APPLICATION_CODE_A,
      ]);

      component.onInterpretationAnswersChange([null]);
      await settle();

      expect(component.form.controls.applicationCodes.value).toEqual([]);
      expect(component.interpretationAnswers()).toEqual([null]);
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

    it('keeps filters edited by hand when a choice is picked', async () => {
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

      // Changing the answer takes out only the code the first answer added
      await pick(1, 2);
      expect(component.form.controls.applicationCodes.value).toEqual([
        'AP99003',
        APPLICATION_CODE_B,
      ]);
    });

    it('adds a court pick to Other courts when Court is set, labelled with its name', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [
            {
              field: SearchFilterField.COURT_CODES,
              text: 'Which other court did you mean?',
              options: [
                {
                  field: SearchFilterField.COURT_CODES,
                  code: ENDED_COURT,
                  label: 'Synthetic Closed Court',
                },
              ],
            },
          ],
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
      await interpret(
        interpretation({
          filter: { cjaCode: CJA_AREA.code },
          appliedFilters: [
            {
              field: SearchFilterField.CJA_CODE,
              label: 'Synthetic Area',
              source: InterpretationSource.SYNONYM,
            },
          ],
          choicesNeeded: [COURT_CHOICE],
        }),
      );
      expect(component.placeState().cjaSearch).toBe('Synthetic Area');

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_TWO);
      expect(component.form.controls.cja.value).toBe('');
      expect(component.placeState().courthouseSearch).toBe(
        'Synthetic Court Two',
      );
      expect(component.placeState().cjaSearch).toBe('');
      expect(query<HTMLInputElement>('input#court')!.value).toBe(
        'Synthetic Court Two',
      );
    });

    it('leaves focus on the choice that was picked', async () => {
      await interpret(
        interpretation({
          filter: { courtCode: COURT_ONE },
          choicesNeeded: [CODE_CHOICE],
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
      await interpret(cjaWithChoice(COURT_CHOICE));
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

  describe('choices and filters set by hand', () => {
    beforeEach(async () => {
      await createPage();
    });

    it('takes out a CJA chosen by hand for a court pick, and puts it back for None of these', async () => {
      await interpret(withChoice(COURT_CHOICE));
      component.selectCja(CJA_AREA);
      await settle();

      await pick(1, 1);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_TWO, cja: '' }),
      );
      expect(courtText()).toBe('Synthetic Court Two');
      expect(cjaText()).toBe('');
      expect(notApplied()).toEqual([CJA_LABEL]);
      const picked = await searchParams();
      expect(picked.get('courtCode')).toBe(COURT_TWO);

      await pick(1, 2);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: '', cja: CJA_AREA.code }),
      );
      expect(courtText()).toBe('');
      expect(cjaText()).toBe(CJA_LABEL);
      expect(query('#interpreted-filters-not-applied')).toBeNull();
      const unpicked = await searchParams();
      expect(unpicked.get('cjaCode')).toBe(CJA_AREA.code);
      expect(unpicked.has('courtCode')).toBe(false);
    });

    it('takes out an Other location typed by hand for a court pick, and puts it back for None of these', async () => {
      await interpret(withChoice(COURT_CHOICE));
      component.form.patchValue({ location: 'Synthetic Hall' });
      await settle();

      await pick(1, 1);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_TWO, location: '' }),
      );
      expect(courtText()).toBe('Synthetic Court Two');
      expect(query<HTMLInputElement>('input#location')!.value).toBe('');
      expect(notApplied()).toEqual(['Synthetic Hall']);
      const picked = await searchParams();
      expect(picked.get('courtCode')).toBe(COURT_TWO);

      await pick(1, 2);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: '', location: 'Synthetic Hall' }),
      );
      expect(courtText()).toBe('');
      expect(query<HTMLInputElement>('input#location')!.value).toBe(
        'Synthetic Hall',
      );
      const unpicked = await searchParams();
      expect(unpicked.get('otherLocationDescription')).toBe('Synthetic Hall');
      expect(unpicked.has('courtCode')).toBe(false);
    });

    it('adds a court pick to Other courts with its label rather than replace a Court chosen by hand', async () => {
      await interpret(withChoice(COURT_CHOICE));
      component.selectCourthouse(COURTS[0]);
      await settle();

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(component.form.controls.courtCodes.value).toEqual([COURT_TWO]);
      expect(component.courtChipLabels()[COURT_TWO]).toBe(
        'Synthetic Court Two',
      );
      expect(courtText()).toBe(COURT_ONE_LABEL);
      expect(selectedOtherCourts()).toEqual([COURT_TWO_LABEL]);
      const picked = await searchParams();
      expect(courtCodesParam(picked)).toEqual([COURT_ONE, COURT_TWO]);
      expect(picked.has('courtCode')).toBe(false);

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(component.form.controls.courtCodes.value).toEqual([]);
      expect(courtText()).toBe(COURT_ONE_LABEL);
      expect(selectedOtherCourts()).toEqual([]);
      const unpicked = await searchParams();
      expect(unpicked.get('courtCode')).toBe(COURT_ONE);
      expect(unpicked.has('courtCodes')).toBe(false);
    });

    it('does not apply a CJA pick while a Court chosen by hand is set, and lists it', async () => {
      await interpret(withChoice(CJA_CHOICE));
      component.selectCourthouse(COURTS[0]);
      await settle();

      await pick(1, 1);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_ONE, cja: '' }),
      );
      expect(courtText()).toBe(COURT_ONE_LABEL);
      expect(cjaText()).toBe('');
      expect(notApplied()).toEqual(['Synthetic Area']);
      const picked = await searchParams();
      expect(picked.get('courtCode')).toBe(COURT_ONE);

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(query('#interpreted-filters-not-applied')).toBeNull();
      const unpicked = await searchParams();
      expect(unpicked.get('courtCode')).toBe(COURT_ONE);
    });

    it('puts a court pick into an empty Court when Other courts is full, never a 20th Other court', async () => {
      const ended = endedCourts(19);
      await interpret(withChoice(OTHER_COURT_CHOICE));
      component.form.patchValue({ courtCodes: ended });
      await settle();

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_TWO);
      expect(component.form.controls.courtCodes.value).toEqual(ended);
      expect(courtText()).toBe('Synthetic Court Two');
      const picked = await searchParams();
      expect(courtCodesParam(picked)).toEqual([COURT_TWO, ...ended]);

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe('');
      expect(component.form.controls.courtCodes.value).toEqual(ended);
      expect(courtText()).toBe('');
      const unpicked = await searchParams();
      expect(courtCodesParam(unpicked)).toEqual(ended);
    });

    it('lists a court pick as not applied when Court and Other courts are full', async () => {
      const ended = endedCourts(19);
      await interpret(withChoice(ENDED_COURT_CHOICE));
      component.selectCourthouse(COURTS[0]);
      component.form.patchValue({ courtCodes: ended });
      await settle();

      await pick(1, 1);

      expect(component.form.controls.court.value).toBe(COURT_ONE);
      expect(component.form.controls.courtCodes.value).toEqual(ended);
      expect(notApplied()).toEqual(['Synthetic Closed Court']);
      const picked = await searchParams();
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
          choicesNeeded: [ENDED_COURT_CHOICE],
        }),
      );
      component.form.patchValue({
        courtCodes: [COURT_ONE, ...endedCourts(18)],
      });
      await settle();

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
      const picked = await searchParams();
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
      const unpicked = await searchParams();
      expect(courtCodesParam(unpicked)).toEqual([
        ...endedCourts(18),
        COURT_ONE,
      ]);
    });

    it('lists a court it cannot move back into a full Other courts', async () => {
      const others = [...endedCourts(18), COURT_ONE];
      await interpret(withChoice(ENDED_COURT_CHOICE));
      component.form.patchValue({ courtCodes: others });
      await settle();
      await pick(1, 1);
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
      const unpicked = await searchParams();
      expect(courtCodesParam(unpicked)).toHaveLength(20);
    });

    it('does not move a court back that is already searched', async () => {
      const others = [...endedCourts(18), COURT_ONE];
      await interpret(withChoice(ENDED_COURT_CHOICE));
      component.form.patchValue({ courtCodes: others });
      await settle();
      await pick(1, 1);
      // By hand: Court changed, and the moved court added to Other courts
      component.selectCourthouse(COURTS[1]);
      component.form.patchValue({ courtCodes: [COURT_ONE] });
      await settle();

      await pick(1, 2);

      expect(component.form.controls.court.value).toBe(COURT_TWO);
      expect(component.form.controls.courtCodes.value).toEqual([COURT_ONE]);
      expect(query('#interpreted-filters-not-applied')).toBeNull();
    });

    it('lists a list pick as not applied when the list is full', async () => {
      const codes = Array.from(
        { length: 50 },
        (_, index) => `AP9${String(index).padStart(4, '0')}`,
      );
      await interpret(withChoice(CODE_CHOICE));
      component.form.patchValue({ applicationCodes: codes });
      await settle();

      await pick(1, 1);

      expect(component.form.controls.applicationCodes.value).toEqual(codes);
      expect(notApplied()).toEqual([
        `${APPLICATION_CODE_A} - Synthetic application one`,
      ]);
      const picked = await searchParams();
      expect(
        JSON.parse(picked.get('applicationCodes') ?? '[]') as string[],
      ).toEqual(codes);
    });

    it('changes a court answer from one court to another, and to None of these, keeping Court and CJA apart', async () => {
      await interpret(cjaWithChoice(TWO_COURTS_CHOICE));

      await pick(1, 1);
      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_ONE, courtCodes: [], cja: '' }),
      );
      expect(courtText()).toBe('Synthetic Court One');

      // The new court replaces the court the first answer set
      await pick(1, 2);
      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_TWO, courtCodes: [], cja: '' }),
      );
      expect(courtText()).toBe('Synthetic Court Two');
      expect(cjaText()).toBe('');
      expect(notApplied()).toEqual(['Synthetic Area']);
      const picked = await searchParams();
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
      const unpicked = await searchParams();
      expect(unpicked.get('cjaCode')).toBe(CJA_AREA.code);
      expect(unpicked.has('courtCode')).toBe(false);
    });

    it('keeps the CJA out when None of these is picked after a court was added by hand', async () => {
      await interpret(cjaWithChoice(COURT_CHOICE));
      await pick(1, 1);
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
      const unpicked = await searchParams();
      expect(unpicked.get('courtCode')).toBe(COURT_ONE);
    });

    it('keeps a Court changed by hand when the court answer is changed', async () => {
      await interpret(cjaWithChoice(COURT_CHOICE));
      await pick(1, 1);
      component.selectCourthouse(COURTS[0]);
      await settle();

      await pick(1, 2);

      expect(component.form.getRawValue()).toEqual(
        expect.objectContaining({ court: COURT_ONE, courtCodes: [], cja: '' }),
      );
      expect(courtText()).toBe(COURT_ONE_LABEL);
      expect(cjaText()).toBe('');
      expect(notApplied()).toEqual(['Synthetic Area']);
      const unpicked = await searchParams();
      expect(unpicked.get('courtCode')).toBe(COURT_ONE);
    });
  });

  describe('interpretationId', () => {
    beforeEach(async () => {
      await createPage();
    });

    it('sends the interpretationId once, as a top-level parameter of the first search after the interpretation', async () => {
      const getEntries = jest.spyOn(
        TestBed.inject(ApplicationListEntriesApi),
        'getEntries',
      );
      await interpret(FULL_INTERPRETATION);

      await pressSearch();
      const first = await expectSearch();

      expect(first.request.params.getAll('interpretationId')).toEqual([
        INTERPRETATION_ID,
      ]);
      expect(getEntries.mock.calls[0][0].interpretationId).toBe(
        INTERPRETATION_ID,
      );
      expect(getEntries.mock.calls[0][0].filter).not.toHaveProperty(
        'interpretationId',
      );

      await pressSearch();
      const second = await expectSearch();

      expect(second.request.params.has('interpretationId')).toBe(false);
      expect(getEntries.mock.calls[1][0]).not.toHaveProperty(
        'interpretationId',
      );
    });

    it('sends no interpretationId when the interpretation has a blank one', async () => {
      await interpret({ ...FULL_INTERPRETATION, interpretationId: '  ' });

      await pressSearch();
      const req = await expectSearch();

      expect(req.request.params.has('interpretationId')).toBe(false);
      expect(req.request.params.get('courtCode')).toBe(COURT_ONE);
    });

    it('sends the newest interpretationId when there is more than one interpretation before a search', async () => {
      await interpret(FULL_INTERPRETATION);
      await interpret({
        ...FULL_INTERPRETATION,
        interpretationId: OTHER_INTERPRETATION_ID,
      });

      await pressSearch();
      const req = await expectSearch();

      expect(req.request.params.getAll('interpretationId')).toEqual([
        OTHER_INTERPRETATION_ID,
      ]);
    });

    it('never sends the interpretationId or calls the interpretation API when paging or sorting', async () => {
      // Results from a search before the interpretation
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      await expectSearch(RESULTS_PAGE);

      await interpret(FULL_INTERPRETATION);

      component.onPageChange(1);
      const page = await expectSearch(RESULTS_PAGE);
      component.onSortChange({ key: 'applicant', direction: 'asc' });
      const sort = await expectSearch(RESULTS_PAGE);

      httpMock.expectNone(isInterpretation);
      expect(page.request.params.has('interpretationId')).toBe(false);
      expect(page.request.params.get('pageNumber')).toBe('1');
      expect(sort.request.params.has('interpretationId')).toBe(false);
      expect(sort.request.params.getAll('sort')).toEqual(['applicantName,asc']);

      // Still sent with the next search staff run
      await pressSearch();
      const search = await expectSearch();
      expect(search.request.params.getAll('interpretationId')).toEqual([
        INTERPRETATION_ID,
      ]);
    });

    it('keeps the interpretationId for the search that runs after a blocked one', async () => {
      await interpret({ ...FULL_INTERPRETATION, choicesNeeded: [CODE_CHOICE] });
      await pressSearch();
      httpMock.expectNone(isEntriesSearch);

      await pick(1, 3);
      await pressSearch();
      const req = await expectSearch();

      expect(req.request.params.getAll('interpretationId')).toEqual([
        INTERPRETATION_ID,
      ]);
    });

    it('does not send the interpretationId after Clear search', async () => {
      await interpret(FULL_INTERPRETATION);

      query<HTMLButtonElement>('form .govuk-button--secondary')!.click();
      await settle();
      component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });
      await pressSearch();
      const req = await expectSearch();

      expect(req.request.params.has('interpretationId')).toBe(false);
    });

    it('does not save the interpretationId or the question, so a restored search sends neither', async () => {
      await interpret(FULL_INTERPRETATION);
      await pressSearch();
      await expectSearch(RESULTS_PAGE);

      const saved = JSON.stringify([
        searchStateService.state(),
        searchFormService.state(),
        searchFormService.courtChipLabels(),
      ]);
      expect(saved).not.toContain(INTERPRETATION_ID);
      expect(saved).not.toContain(QUESTION);
      expect(searchStateService.state().hasSearched).toBe(true);

      // The next visit restores the search and runs it again
      fixture.destroy();
      await createPage();
      const restored = await expectSearch(RESULTS_PAGE);

      expect(restored.request.params.has('interpretationId')).toBe(false);
      expect(restored.request.params.get('courtCode')).toBe(COURT_ONE);
      expect(query('app-interpreted-filters-summary')).toBeNull();
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
      await interpret(ENDED_AND_ACTIVE);
      await pressSearch();
      await expectSearch(RESULTS_PAGE);

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
      await interpret(ENDED_AND_ACTIVE);
      component.form.patchValue({ courtCodes: [COURT_TWO] });
      await pressSearch();
      await expectSearch(RESULTS_PAGE);

      expect(searchFormService.courtChipLabels()).toEqual({
        [COURT_TWO]: 'Synthetic Court Two',
      });
    });

    it('shows no label from a cleared search after a restore', async () => {
      await interpret(ENDED_AND_ACTIVE);
      await pressSearch();
      await expectSearch(RESULTS_PAGE);

      query<HTMLButtonElement>('form .govuk-button--secondary')!.click();
      await settle();
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
    ])(
      'shows a %s from the interpretation API in the page error summary, linked to the question',
      async (status, text) => {
        component.form.patchValue({ applicantOrg: 'Synthetic Organisation' });

        await failInterpretation(status);

        expect(root().querySelectorAll('.govuk-error-summary')).toHaveLength(1);
        expect(summaryLinks()).toEqual([
          { href: '#plain-english-question', text },
        ]);
        expect(root().textContent).not.toContain('Synthetic detail');
        // The form and the page are left as they were, and nothing is searched
        expect(component.form.controls.applicantOrg.value).toBe(
          'Synthetic Organisation',
        );
        expect(query('app-interpreted-filters-summary')).toBeNull();
        httpMock.expectNone(isEntriesSearch);
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

      expect(texts('.govuk-error-summary__list li')).toEqual([
        UNAVAILABLE,
        INVALID_SEARCH_CRITERIA,
      ]);
    });

    it('moves focus to the error summary when the interpretation fails, even while it already shows errors', async () => {
      // The error summary focuses itself in a timeout after it renders
      const summaryFocus = (): Promise<unknown> =>
        new Promise((resolve) => setTimeout(resolve, 0));
      await pressSearch();
      await summaryFocus();
      expect(document.activeElement).toBe(query('.govuk-error-summary'));
      question().focus();

      await failInterpretation(503);
      await summaryFocus();

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

      await pressSearch();
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

    const clearSearch = async (): Promise<void> => {
      query<HTMLButtonElement>('form .govuk-button--secondary')!.click();
      await settle();
    };

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

    it('cancels an interpretation in flight, so its result never fills the form', async () => {
      ask();
      const req = httpMock.expectOne(isInterpretation);

      await clearSearch();

      expect(req.cancelled).toBe(true);
      expect(component.form.controls.court.value).toBe('');
      expect(query('app-interpreted-filters-summary')).toBeNull();
      expect(texts('#plain-english-search-status')).toEqual(['']);
    });

    it('lets staff ask a new question after clearing', async () => {
      await interpret(FULL_INTERPRETATION);
      await clearSearch();

      const req = await interpret(
        interpretation({
          interpretationId: OTHER_INTERPRETATION_ID,
          filter: { courtCode: COURT_TWO },
        }),
        'synthetic court two',
      );

      expect(req.request.body).toEqual({ question: 'synthetic court two' });
      expect(component.form.controls.court.value).toBe(COURT_TWO);
    });
  });
});
