import {
  HttpContext,
  HttpErrorResponse,
  HttpResponse,
  provideHttpClient,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { PdfService } from '../../../../../src/app/core/services/pdf.service';
import { ReferenceDataFacade } from '../../../../../src/app/core/services/reference-data.facade';
import { ApplicationsList } from '../../../../../src/app/pages/applications-list/applications-list';
import * as LoadQuery from '../../../../../src/app/pages/applications-list/util/load-query';
import {
  IF_MATCH,
  ROW_VERSION,
} from '../../../../../src/app/shared/context/concurrency-context';
import {
  ApplicationListGetFilterDto,
  ApplicationListGetPrintDto,
  ApplicationListGetSummaryDto,
  ApplicationListPage,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
  GetApplicationListsRequestParams,
  PrintApplicationListRequestParams,
} from '../../../../../src/generated/openapi';

const makePrintDto = (entries: unknown[] = []): ApplicationListGetPrintDto =>
  <ApplicationListGetPrintDto>{
    date: '2025-01-01',
    time: '10:00',
    entries,
  };

const applicationsListsApiMock: jest.Mocked<
  Pick<ApplicationListsApi, 'getApplicationLists' | 'printApplicationList'>
> = {
  getApplicationLists: jest.fn().mockReturnValue(of({ content: [] })),
  printApplicationList: jest.fn(),
};

// used by ReferenceDataFacade (unchanged)
const courtLocationsApiMock = {
  getCourtLocations: jest.fn().mockReturnValue(of({ content: [] })),
};
const cjaApiMock = {
  getCriminalJusticeAreas: jest.fn().mockReturnValue(of({ content: [] })),
};

class ReferenceDataFacadeStub
  implements Pick<ReferenceDataFacade, 'courtLocations$' | 'cja$'>
{
  courtLocations$ = of([] as CourtLocationGetSummaryDto[]);
  cja$ = of([] as CriminalJusticeAreaGetDto[]);
}

type PrintFn = (
  requestParameters: PrintApplicationListRequestParams,
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean },
) => Observable<ApplicationListGetPrintDto>;

class PdfServiceStub
  implements
    Pick<
      PdfService,
      | 'generatePagedApplicationListPdf'
      | 'generateContinuousApplicationListsPdf'
    >
{
  generatePagedApplicationListPdf = jest.fn<
    Promise<void>,
    [unknown, { crestUrl?: string } | undefined]
  >();

  generateContinuousApplicationListsPdf = jest.fn<Promise<void>, [unknown[]]>();
}

/**
 * Helper to build the component. Accepts:
 *  - platformId: 'browser' | 'server'
 *  - rows: optional seed for this.rows (useful for onPrintContinuous tests)
 */
function createInstance(
  platformId: 'browser' | 'server' = 'browser',
  rows: Array<{ id?: string | null }> = [],
) {
  const api: { printApplicationList: jest.MockedFunction<PrintFn> } = {
    // jest.fn with correct param/return types
    printApplicationList: jest.fn<
      ReturnType<PrintFn>,
      Parameters<PrintFn>
    >() as never,
  };

  const pdf = new PdfServiceStub();

  const comp = new ApplicationsList(
    platformId as unknown as object,
    new ReferenceDataFacadeStub() as unknown as ReferenceDataFacade,
    api as unknown as ApplicationListsApi,
    pdf as unknown as PdfService,
  );

  (comp as unknown as { rows: Array<{ id?: string | null }> }).rows = rows;

  // expose spies with the names the tests use
  const clearErrorsSpy = jest.fn();
  const showInlineSpy = jest.fn();
  (comp as unknown as { clearErrors: () => void }).clearErrors = clearErrorsSpy;
  (comp as unknown as { showInline: (m: string) => void }).showInline =
    showInlineSpy;

  return { comp, api, pdf, clearErrorsSpy, showInlineSpy };
}

describe('ApplicationsList – delete flow (server platform: no confirm)', () => {
  let fixture: ComponentFixture<ApplicationsList>;
  let component: ApplicationsList;
  let api: { deleteApplicationList: jest.Mock };

  beforeEach(async () => {
    api = {
      deleteApplicationList: jest
        .fn()
        .mockReturnValue(of({ status: 204 } as HttpResponse<unknown>)),
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationsList], // standalone component
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'server' }, // skip confirm() path by default
        { provide: ApplicationListsApi, useValue: api },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsList);
    component = fixture.componentInstance;
    // avoid ngOnInit’s demo data; set our own rows
    component.rows = [
      {
        id: 'abc-123',
        date: '2025-10-01',
        time: '09:30',
        location: 'X',
        description: 'Y',
        entries: 0,
        status: ApplicationListStatus.OPEN,
        deletable: true,
        etag: 'W/"etag-val"',
        rowVersion: '42',
      },
      {
        id: 'keep-me',
        date: '',
        time: '',
        location: '',
        description: '',
        entries: 0,
        status: ApplicationListStatus.OPEN,
      },
    ];
  });

  it('guards when row.deletable === false: sets error and does NOT call API', async () => {
    const row = {
      id: 'nope',
      date: '',
      time: '',
      location: '',
      description: '',
      entries: 0,
      status: ApplicationListStatus.OPEN,
      deletable: false,
    };
    await component.onDelete(row);

    expect(component.deleteInvalid).toBe(true);
    expect(component.errorHint).toBe('There is a problem');
    expect(component.errorSummary).toEqual([
      { text: 'This list cannot be deleted.' },
    ]);
    expect(api.deleteApplicationList).not.toHaveBeenCalled();
    expect(component.deletingId).toBeNull();
  });

  it('on success (204) removes row and sets deleteDone=true; passes ETag/RowVersion via HttpContext', async () => {
    const row = component.rows[0]; // abc-123

    // capture call args to inspect HttpContext values
    let capturedOptions: { context?: HttpContext } | undefined;

    api.deleteApplicationList.mockImplementation(
      (_params, _observe, _progress, options?: { context?: HttpContext }) => {
        capturedOptions = options;
        return of({ status: 204 } as HttpResponse<unknown>);
      },
    );

    await component.onDelete(row);

    expect(api.deleteApplicationList).toHaveBeenCalledTimes(1);
    expect(api.deleteApplicationList.mock.calls[0][0]).toEqual({
      id: 'abc-123',
    });

    // Concurrency tokens from context
    expect(capturedOptions?.context?.get(IF_MATCH)).toBe('W/"etag-val"');
    expect(capturedOptions?.context?.get(ROW_VERSION)).toBe('42');

    // Row removed, banner flag set, deletingId reset
    expect(component.rows.find((r) => r.id === 'abc-123')).toBeUndefined();
    expect(component.rows).toHaveLength(1);
    expect(component.rows[0].id).toBe('keep-me');
    expect(component.deleteDone).toBe(true);
    expect(component.deleteInvalid).toBe(false);
    expect(component.errorSummary).toEqual([]);
    expect(component.deletingId).toBeNull();
  });

  describe('error mapping -> inline error summary', () => {
    const cases: Array<{ status: number; firstText: string }> = [
      {
        status: 401,
        firstText: 'You are not signed in. Please sign in and try again.',
      },
      {
        status: 403,
        firstText: 'You do not have permission to delete this list.',
      },
      {
        status: 404,
        firstText: 'Application List not found. Return to the Lists view.',
      },
      {
        status: 409,
        firstText: 'This list has entries or is in a non-deletable state.',
      },
      {
        status: 412,
        firstText: 'The list has changed. Refresh the page and try again.',
      },
      {
        status: 500,
        firstText: 'Unable to delete list. Please try again later.',
      }, // default branch
    ];

    it.each(cases)(
      'status %s -> shows correct inline error',
      async ({ status, firstText }) => {
        api.deleteApplicationList.mockReturnValueOnce(
          throwError(() => new HttpErrorResponse({ status })),
        );

        const row = {
          id: 'abc-123',
          date: '',
          time: '',
          location: '',
          description: '',
          entries: 0,
          status: ApplicationListStatus.OPEN,
          deletable: true,
        };

        // keep a couple of rows to confirm list remains intact on error
        component.rows = [
          { ...row },
          {
            id: 'keep-me',
            date: '',
            time: '',
            location: '',
            description: '',
            entries: 0,
            status: ApplicationListStatus.OPEN,
          },
        ];

        await component.onDelete(row);

        // API was called
        expect(api.deleteApplicationList).toHaveBeenCalled();

        // Error flags and message mapping
        expect(component.deleteDone).toBe(false);
        expect(component.deleteInvalid).toBe(true);
        expect(component.errorHint).toBe('There is a problem');
        expect(component.errorSummary[0].text).toBe(firstText);

        // Row NOT removed on error; deletingId reset
        expect(component.rows).toHaveLength(2);
        expect(component.deletingId).toBeNull();
      },
    );
  });
});

describe('ApplicationsList – delete flow (browser platform: confirm cancel)', () => {
  let fixture: ComponentFixture<ApplicationsList>;
  let component: ApplicationsList;
  let api: { deleteApplicationList: jest.Mock };

  beforeEach(async () => {
    api = { deleteApplicationList: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ApplicationsList],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' }, // will hit window.confirm
        { provide: ApplicationListsApi, useValue: api },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    // Important: stub confirm BEFORE component method runs
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    fixture = TestBed.createComponent(ApplicationsList);
    component = fixture.componentInstance;

    component.rows = [
      {
        id: 'abc-123',
        date: '2025-10-01',
        time: '09:30',
        location: 'X',
        description: 'Y',
        entries: 0,
        status: ApplicationListStatus.OPEN,
        deletable: true,
      },
    ];
  });

  afterEach(() => {
    (window.confirm as jest.Mock)?.mockRestore?.();
  });

  it('when user cancels confirmation, does NOT call API and leaves state unchanged', async () => {
    await component.onDelete(component.rows[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(api.deleteApplicationList).not.toHaveBeenCalled();

    // no flags set, no removal, deletingId stays null
    expect(component.deleteDone).toBe(false);
    expect(component.deleteInvalid).toBe(false);
    expect(component.errorSummary).toEqual([]);
    expect(component.rows).toHaveLength(1);
    expect(component.deletingId).toBeNull();
  });
});

describe('ApplicationsList – search', () => {
  let fixture: ComponentFixture<ApplicationsList>;
  let component: ApplicationsList;
  let service: { getApplicationLists: jest.Mock };

  beforeEach(async () => {
    // Build a correctly-typed page body
    const pageBody /* : ApplicationListPage */ = {
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 25,
    } as unknown as ApplicationListPage;

    applicationsListsApiMock.getApplicationLists.mockReset();

    // Return an HttpResponse<T>, which is assignable to HttpEvent<T>
    applicationsListsApiMock.getApplicationLists.mockReturnValue(
      of(
        new HttpResponse<ApplicationListPage>({
          status: 200,
          body: pageBody,
        }),
      ),
    );

    await TestBed.configureTestingModule({
      imports: [ApplicationsList],
      providers: [
        provideRouter([]),
        { provide: ApplicationListsApi, useValue: applicationsListsApiMock },
        { provide: CourtLocationsApi, useValue: courtLocationsApiMock },
        { provide: CriminalJusticeAreasApi, useValue: cjaApiMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsList);
    component = fixture.componentInstance;

    // Only needed if you still want a typed handle for direct assertions:
    service = TestBed.inject(ApplicationListsApi) as unknown as {
      getApplicationLists: jest.Mock;
    };

    component.pageSize = 25;
    component.currentPage = 1;
    fixture.detectChanges();
  });

  const pageStub = (
    content: ReadonlyArray<Partial<ApplicationListGetSummaryDto>>,
    extras?: Partial<ApplicationListPage>,
    pageNumber = 0,
    pageSize = 25,
  ): ApplicationListPage => ({
    pageNumber,
    pageSize,
    totalElements: 134,
    totalPages: 6,
    first: pageNumber === 0,
    last: false,
    elementsOnPage: content.length,
    sort: {} as unknown as ApplicationListPage['sort'],
    content: content as ApplicationListGetSummaryDto[],
    ...extras,
  });

  it('requests first page without filter when hasParams=false', () => {
    service.getApplicationLists.mockReturnValue(of(pageStub([])));
    component.loadApplicationsLists(false);
    const args = service.getApplicationLists.mock
      .calls[0][0] as GetApplicationListsRequestParams;
    expect(args).toEqual({});
  });

  it('merges filter when hasParams=true', () => {
    jest.spyOn(LoadQuery, 'loadQuery').mockReturnValue({
      status: ApplicationListStatus.OPEN,
      courtLocationCode: 'LOC1',
    } as ApplicationListGetFilterDto);

    service.getApplicationLists.mockReturnValue(of(pageStub([])));

    applicationsListsApiMock.getApplicationLists.mockClear();
    component.loadApplicationsLists(true);
    const args = service.getApplicationLists.mock
      .calls[0][0] as GetApplicationListsRequestParams;
    expect(args.filter).toEqual({
      status: ApplicationListStatus.OPEN,
      courtLocationCode: 'LOC1',
    });
  });

  it('formats date as YYYY-MM-DD and trims time to HH:mm', () => {
    service.getApplicationLists.mockReturnValue(
      of(
        pageStub([
          {
            id: 'x1',
            date: '2025-09-17',
            time: '14:05:33.000Z',
            location: 'Court A',
            description: 'Desc',
            numberOfEntries: 7,
            status: ApplicationListStatus.OPEN,
          },
        ]),
      ),
    );
    component.loadApplicationsLists(false);
    expect(component.rows).toHaveLength(1);
    expect(component.rows[0].date).toBe('2025-09-17');
    expect(component.rows[0].time).toBe('14:05');
    expect(component.rows[0].entries).toBe(7);
  });

  it('sets totals from page response', () => {
    service.getApplicationLists.mockReturnValue(
      of(pageStub([], { totalElements: 10, totalPages: 2 })),
    );
    component.loadApplicationsLists(false);
    expect(component.totalPages).toBe(2);
  });

  it('handles backend error: clears rows, zeros totals, sets submitted and searchErrors', () => {
    service.getApplicationLists.mockReturnValue(
      throwError(() => new Error('Request failed')),
    );
    component.rows = [
      {
        id: 'keep',
        date: '2025-01-01',
        time: '10:00',
        location: '',
        description: '',
        entries: 0,
        status: ApplicationListStatus.OPEN,
      },
    ];
    component.totalPages = 3;
    component.submitted = false;
    component.searchErrors = [];
    component.loadApplicationsLists(false);
    expect(component.rows).toHaveLength(0);
    expect(component.totalPages).toBe(0);
    expect(component.submitted).toBe(true);
    expect(component.searchErrors[0]).toEqual({
      id: 'search',
      text: 'Request failed',
    });
  });

  it('omits filter entirely when hasParams=false', () => {
    service.getApplicationLists.mockReturnValue(of(pageStub([])));
    component.loadApplicationsLists(false);
    const args = service.getApplicationLists.mock
      .calls[0][0] as GetApplicationListsRequestParams;
    expect('filter' in args).toBe(false);
  });

  it('includes filter object when hasParams=true even if partial', () => {
    jest.spyOn(LoadQuery, 'loadQuery').mockReturnValue({
      status: ApplicationListStatus.CLOSED,
    } as ApplicationListGetFilterDto);

    service.getApplicationLists.mockReturnValue(of(pageStub([])));
    component.loadApplicationsLists(true);
    const args = service.getApplicationLists.mock
      .calls[0][0] as GetApplicationListsRequestParams;
    expect(args.filter).toEqual({ status: 'CLOSED' });
  });
});

describe('ApplicationsList.onPrintPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns early when id is falsy', async () => {
    const { comp, api, pdf, clearErrorsSpy } = createInstance('browser');

    await comp.onPrintPage('');

    expect(clearErrorsSpy).not.toHaveBeenCalled();
    expect(api.printApplicationList).not.toHaveBeenCalled();
    expect(pdf.generatePagedApplicationListPdf).not.toHaveBeenCalled();
  });

  it('clears errors and calls API with transferCache: false', async () => {
    const { comp, api, clearErrorsSpy } = createInstance('browser');

    const dto = makePrintDto([]);
    api.printApplicationList.mockReturnValue(of(dto));

    await comp.onPrintPage('abc-123');

    expect(clearErrorsSpy).toHaveBeenCalledTimes(1);

    // args: { id }, undefined, undefined, { transferCache: false }
    expect(api.printApplicationList).toHaveBeenCalledTimes(1);
    expect(api.printApplicationList.mock.calls[0][0]).toEqual({
      id: 'abc-123',
    });
    expect(api.printApplicationList.mock.calls[0][1]).toBeUndefined();
    expect(api.printApplicationList.mock.calls[0][2]).toBeUndefined();
    expect(api.printApplicationList.mock.calls[0][3]).toEqual({
      transferCache: false,
    });
  });

  it('shows inline message when there are no entries', async () => {
    const { comp, api, pdf, showInlineSpy } = createInstance('browser');

    const dto = makePrintDto([]);
    api.printApplicationList.mockReturnValue(of(dto));

    await comp.onPrintPage('abc-123');

    expect(showInlineSpy).toHaveBeenCalledWith('No entries available to print');
    expect(pdf.generatePagedApplicationListPdf).not.toHaveBeenCalled();
  });

  it('generates PDF on the browser when entries exist', async () => {
    const { comp, api, pdf } = createInstance('browser');

    // include at least one entry so the component proceeds to generate the PDF
    const dto = makePrintDto([{}]);

    // ensure the mock is typed like the real method’s return
    api.printApplicationList.mockReturnValue(of(dto));

    await comp.onPrintPage('abc-123');

    expect(pdf.generatePagedApplicationListPdf).toHaveBeenCalledTimes(1);
    expect(pdf.generatePagedApplicationListPdf).toHaveBeenCalledWith(dto, {
      crestUrl: '/assets/govuk-crest.png',
    });
  });

  it('does not generate PDF on the server platform', async () => {
    const { comp, api, pdf } = createInstance('server');

    const dto = makePrintDto([]);
    api.printApplicationList.mockReturnValue(of(dto));

    await comp.onPrintPage('abc-123');

    expect(pdf.generatePagedApplicationListPdf).not.toHaveBeenCalled();
  });

  it('maps 404 to "Application List not found"', async () => {
    const { comp, api, showInlineSpy } = createInstance('browser');

    api.printApplicationList.mockReturnValue(
      throwError(() => ({ status: 404 })),
    );

    await comp.onPrintPage('abc-123');

    expect(showInlineSpy).toHaveBeenCalledWith('Application List not found');
  });

  it('maps non-404 errors to generic banner', async () => {
    const { comp, api, showInlineSpy } = createInstance('browser');

    api.printApplicationList.mockReturnValue(
      throwError(() => ({ status: 500 })),
    );

    await comp.onPrintPage('abc-123');

    expect(showInlineSpy).toHaveBeenCalledWith(
      'Unable to generate PDF. Please try again later',
    );
  });
});

describe('ApplicationsList.onPrintContinuous', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns early on non-browser platform', async () => {
    const { comp, api, pdf, clearErrorsSpy, showInlineSpy } = createInstance(
      'server',
      [{ id: 'X' }],
    );

    await comp.onPrintContinuous();

    expect(clearErrorsSpy).not.toHaveBeenCalled();
    expect(api.printApplicationList).not.toHaveBeenCalled();
    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
    expect(showInlineSpy).not.toHaveBeenCalled();
  });

  it('shows "No lists to print" when rows contain no valid ids', async () => {
    const { comp, api, pdf, clearErrorsSpy, showInlineSpy } = createInstance(
      'browser',
      [{ id: '' }, {}, { id: null }],
    );

    await comp.onPrintContinuous();

    expect(clearErrorsSpy).toHaveBeenCalledTimes(1);
    expect(api.printApplicationList).not.toHaveBeenCalled();
    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
    expect(showInlineSpy).toHaveBeenCalledWith('No lists to print');
  });

  it('shows "No entries available to print" when all fulfilled results have empty/missing entries', async () => {
    const { comp, api, pdf, showInlineSpy } = createInstance('browser', [
      { id: 'A' },
      { id: 'B' },
    ]);

    api.printApplicationList.mockReturnValueOnce(of(makePrintDto([])));
    api.printApplicationList.mockReturnValueOnce(
      of({} as unknown as ApplicationListGetPrintDto),
    );

    await comp.onPrintContinuous();

    expect(api.printApplicationList).toHaveBeenCalledTimes(2);
    expect(api.printApplicationList).toHaveBeenNthCalledWith(
      1,
      { id: 'A' },
      undefined,
      undefined,
      { transferCache: false },
    );
    expect(api.printApplicationList).toHaveBeenNthCalledWith(
      2,
      { id: 'B' },
      undefined,
      undefined,
      { transferCache: false },
    );

    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
    expect(showInlineSpy).toHaveBeenCalledWith('No entries available to print');
  });

  it('ignores rejected/invalid results and prints when at least one DTO has entries', async () => {
    const { comp, api, pdf, showInlineSpy } = createInstance('browser', [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
    ]);

    api.printApplicationList
      .mockReturnValueOnce(of(makePrintDto([{ foo: 1 } as unknown])))
      .mockImplementationOnce(() => throwError(() => new Error('boom')))
      .mockReturnValueOnce(of(makePrintDto([])));

    await comp.onPrintContinuous();

    expect(api.printApplicationList).toHaveBeenCalledTimes(3);
    // Still must pass transferCache: false for every call
    for (const id of ['A', 'B', 'C']) {
      expect(api.printApplicationList).toHaveBeenCalledWith(
        { id },
        undefined,
        undefined,
        { transferCache: false },
      );
    }

    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledTimes(1);
    // The dtos array should contain only the valid fulfilled one(s)
    const passedDtos =
      pdf.generateContinuousApplicationListsPdf.mock.calls[0][0];
    expect(passedDtos).toHaveLength(1);
    expect(showInlineSpy).not.toHaveBeenCalled();
  });

  it('shows a generic error if PDF generation rejects', async () => {
    const { comp, api, pdf, showInlineSpy } = createInstance('browser', [
      { id: 'A' },
    ]);

    api.printApplicationList.mockReturnValue(
      of(makePrintDto([{ x: 1 } as unknown])),
    );
    pdf.generateContinuousApplicationListsPdf.mockRejectedValueOnce(
      new Error('pdf fail'),
    );

    await comp.onPrintContinuous();

    expect(api.printApplicationList).toHaveBeenCalledTimes(1);
    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledTimes(1);
    expect(showInlineSpy).toHaveBeenCalledWith(
      'Unable to generate PDF. Please try again later',
    );
  });

  it('clears errors at the start on browser platform', async () => {
    const { comp, api, clearErrorsSpy } = createInstance('browser', [
      { id: 'A' },
    ]);

    api.printApplicationList.mockReturnValue(
      of(makePrintDto([{ z: 1 } as unknown])),
    );

    await comp.onPrintContinuous();

    expect(clearErrorsSpy).toHaveBeenCalledTimes(1);
  });
});
