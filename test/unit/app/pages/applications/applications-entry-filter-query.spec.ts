/**
 * Pins the wire format of the list filters on GET /application-list-entries.
 *
 * The generated ApplicationListEntriesApi explodes `filter` into one query
 * parameter per field, and sends an array field as a single parameter holding
 * a JSON string (applicationCodes=["AP99001","SW99002"]). The API's
 * ListStringConverter parses that form, so these tests use the real generated
 * client and check the request it actually sends.
 *
 * Court and Other courts are sent as courtCode when they hold one court and
 * as courtCodes when they hold more, never both (the API rejects both).
 */

import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { LOCALE_ID, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';

import { Applications } from '@components/applications/applications.component';
import { PdfService } from '@core/services/pdf.service';
import {
  ApplicationCodeGetSummaryDto,
  ApplicationListEntriesApi,
  BASE_PATH,
  BulkActionSelectionType,
  BulkActionType,
  EntryPage,
  GetEntriesRequestParams,
  ResultCodeGetSummaryDto,
} from '@openapi';
import { ApplicationsSearchFormService } from '@services/applications/applications-search-form.service';
import { ApplicationsSearchStateService } from '@services/applications/applications-search-state.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';

const APPLICATION_CODES = ['AP99001', 'SW99002'];
const RESULT_CODES = ['RC9901', 'RC9902'];
const COURT_CODES = ['SYN001', 'SYN002'];
const ENTRIES_PATH = '/application-list-entries';

const EMPTY_PAGE = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  pageNumber: 0,
  pageSize: 10,
} as unknown as EntryPage;

const isEntriesSearch = (url: string, method: string): boolean =>
  method === 'GET' && url === ENTRIES_PATH;

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
  cja$: of([]),
  courtLocations$: of([]),
  applicationCodeTitles: signal<string[]>([]),
  applicationCodes: signal<ApplicationCodeGetSummaryDto[]>([]),
  resultCodes: signal<ResultCodeGetSummaryDto[]>([]),
  ensureResultCodes: jest.fn(),
  hasLoadError: signal(false),
  hasPlaceLoadError: signal(false),
  refresh: jest.fn(),
};

describe('ApplicationListEntriesApi.getEntries', () => {
  let api: ApplicationListEntriesApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BASE_PATH, useValue: '' },
      ],
    });

    api = TestBed.inject(ApplicationListEntriesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const search = async (
    params: GetEntriesRequestParams,
  ): Promise<TestRequest> => {
    const response = firstValueFrom(api.getEntries(params));
    const req = httpMock.expectOne((r) => isEntriesSearch(r.url, r.method));
    req.flush(EMPTY_PAGE);
    await response;
    return req;
  };

  it('sends one applicationCodes parameter holding the codes as a JSON string', async () => {
    const req = await search({
      filter: { applicationCodes: APPLICATION_CODES },
    });

    expect(req.request.params.getAll('applicationCodes')).toEqual([
      '["AP99001","SW99002"]',
    ]);
    expect(req.request.urlWithParams).toBe(
      `${ENTRIES_PATH}?applicationCodes=${encodeURIComponent('["AP99001","SW99002"]')}`,
    );
  });

  it('sends one resultCodes parameter holding the codes as a JSON string', async () => {
    const req = await search({ filter: { resultCodes: RESULT_CODES } });

    expect(req.request.params.getAll('resultCodes')).toEqual([
      '["RC9901","RC9902"]',
    ]);
  });

  it('sends one courtCodes parameter holding the codes as a JSON string', async () => {
    const req = await search({ filter: { courtCodes: COURT_CODES } });

    expect(req.request.params.getAll('courtCodes')).toEqual([
      '["SYN001","SYN002"]',
    ]);
  });

  it('sends a single code as a one-item JSON array', async () => {
    const req = await search({ filter: { applicationCodes: ['AP99001'] } });

    expect(req.request.params.getAll('applicationCodes')).toEqual([
      '["AP99001"]',
    ]);
  });

  it('sends an empty list as an empty JSON array', async () => {
    // Why the page leaves empty lists out of the filter
    const req = await search({ filter: { applicationCodes: [] } });

    expect(req.request.params.getAll('applicationCodes')).toEqual(['[]']);
  });

  it('sends list and plain filters side by side without a filter prefix', async () => {
    const req = await search({
      filter: {
        applicantOrganisation: 'Synthetic Org',
        applicationCodes: APPLICATION_CODES,
        resultCodes: RESULT_CODES,
      },
      pageNumber: 0,
      pageSize: 10,
    });

    expect(req.request.params.keys()).toEqual([
      'applicantOrganisation',
      'applicationCodes',
      'resultCodes',
      'pageNumber',
      'pageSize',
    ]);
    expect(req.request.params.get('applicantOrganisation')).toBe(
      'Synthetic Org',
    );
  });
});

describe('Applications', () => {
  let httpMock: HttpTestingController;
  let searchFormService: ApplicationsSearchFormService;
  let searchStateService: ApplicationsSearchStateService;

  beforeEach(async () => {
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
    httpMock.verify();
  });

  const createPage = (): Applications => {
    const fixture = TestBed.createComponent(Applications);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  const submit = (component: Applications): TestRequest => {
    component.onSubmit({
      preventDefault: jest.fn(),
    } as unknown as SubmitEvent);
    return httpMock.expectOne((r) => isEntriesSearch(r.url, r.method));
  };

  it('sends the chosen application codes and result codes as JSON-string parameters', () => {
    const component = createPage();
    component.form.patchValue({
      applicationCodes: APPLICATION_CODES,
      resultCodes: RESULT_CODES,
    });

    const req = submit(component);

    expect(req.request.params.getAll('applicationCodes')).toEqual([
      '["AP99001","SW99002"]',
    ]);
    expect(req.request.params.getAll('resultCodes')).toEqual([
      '["RC9901","RC9902"]',
    ]);
    req.flush(EMPTY_PAGE);
  });

  it('sends no list parameters when both lists are empty', () => {
    const component = createPage();
    component.form.patchValue({ applicantOrg: 'Synthetic Org' });

    const req = submit(component);

    expect(req.request.params.has('applicationCodes')).toBe(false);
    expect(req.request.params.has('resultCodes')).toBe(false);
    expect(req.request.params.get('applicantOrganisation')).toBe(
      'Synthetic Org',
    );
    req.flush(EMPTY_PAGE);
  });

  it('sends a single court as courtCode and no courtCodes parameter', () => {
    const component = createPage();
    component.form.patchValue({ courtCodes: ['SYN001'] });

    const req = submit(component);

    expect(req.request.params.getAll('courtCode')).toEqual(['SYN001']);
    expect(req.request.params.has('courtCodes')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('sends Court and Other courts as one courtCodes parameter and no courtCode', () => {
    const component = createPage();
    component.form.patchValue({ court: 'SYN001', courtCodes: ['SYN002'] });

    const req = submit(component);

    expect(req.request.params.getAll('courtCodes')).toEqual([
      '["SYN001","SYN002"]',
    ]);
    expect(req.request.params.has('courtCode')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('sends the lists, courts included, as JSON arrays in the body of a select-all-matching bulk preview', async () => {
    const component = createPage();
    component.form.patchValue({
      applicationCodes: APPLICATION_CODES,
      resultCodes: RESULT_CODES,
      court: COURT_CODES[0],
      courtCodes: COURT_CODES.slice(1),
    });
    submit(component).flush({
      ...EMPTY_PAGE,
      content: [{ id: 'entry-1', listId: 'list-1' }],
      totalPages: 1,
      totalElements: 1,
    });
    component.onHeaderSelectAllChange(true);

    const preview = (
      component as unknown as {
        getBulkPreviewData: (action: BulkActionType) => Promise<unknown>;
      }
    ).getBulkPreviewData(BulkActionType.PRINT_PAGE);
    const req = httpMock.expectOne(
      (r) =>
        r.method === 'POST' && r.url === `${ENTRIES_PATH}/bulk-action-preview`,
    );

    expect(req.request.params.keys()).toEqual([]);
    expect(req.request.body).toEqual({
      action: BulkActionType.PRINT_PAGE,
      selection: {
        selectionType: BulkActionSelectionType.FILTER,
        filter: {
          courtCodes: COURT_CODES,
          applicationCodes: APPLICATION_CODES,
          resultCodes: RESULT_CODES,
        },
      },
    });

    req.flush({
      action: BulkActionType.PRINT_PAGE,
      limit: 2000,
      selectedCount: 0,
      eligibleCount: 0,
      ineligibleCount: 0,
      entryIds: [],
      entries: [],
    });
    await preview;
  });
});
