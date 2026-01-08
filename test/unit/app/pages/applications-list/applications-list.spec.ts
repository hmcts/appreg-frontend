import {
  HttpContext,
  HttpErrorResponse,
  HttpResponse,
  provideHttpClient,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  EnvironmentInjector,
  PLATFORM_ID,
  runInInjectionContext,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

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
} from '../../../../../src/generated/openapi';

import { ApplicationsList } from '@components/applications-list/applications-list';
import * as LoadQuery from '@components/applications-list/util/load-query';
import { PdfService } from '@services/pdf.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';

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

class ReferenceDataFacadeStub implements Pick<
  ReferenceDataFacade,
  'courtLocations$' | 'cja$'
> {
  courtLocations$ = of([] as CourtLocationGetSummaryDto[]);
  cja$ = of([] as CriminalJusticeAreaGetDto[]);
}

class PdfServiceStub implements Pick<
  PdfService,
  'generatePagedApplicationListPdf' | 'generateContinuousApplicationListsPdf'
> {
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
  const api: { printApplicationList: jest.Mock } = {
    printApplicationList: jest.fn(),
  };

  const pdf = new PdfServiceStub();
  const refFacade = new ReferenceDataFacadeStub();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platformId },
      { provide: ApplicationListsApi, useValue: api },
      { provide: ReferenceDataFacade, useValue: refFacade },
      { provide: PdfService, useValue: pdf },
    ],
  });

  const injector = TestBed.inject(EnvironmentInjector);
  const comp = runInInjectionContext(injector, () => new ApplicationsList());

  (comp as unknown as { rows: Array<{ id?: string | null }> }).rows = rows;

  const clearNotificationsSpy = jest.fn();
  const showInlineSpy = jest.fn();
  (comp as unknown as { clearNotifications: () => void }).clearNotifications =
    clearNotificationsSpy;
  (comp as unknown as { showInline: (m: string) => void }).showInline =
    showInlineSpy;

  return { comp, api, pdf, clearNotificationsSpy, showInlineSpy };
}

function submitEvent(value: string | null = 'search'): {
  e: SubmitEvent;
  preventDefault: jest.Mock;
} {
  const preventDefault = jest.fn();
  const btn =
    value === null
      ? null
      : Object.assign(document.createElement('button'), { value });

  const e = {
    preventDefault,
    submitter: btn,
  } as unknown as SubmitEvent;

  return { e, preventDefault };
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
      listId: 'abc-123',
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
    jest.spyOn(globalThis, 'confirm').mockReturnValue(false);

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
    (globalThis.confirm as jest.Mock)?.mockRestore?.();
  });

  it('when user cancels confirmation, does NOT call API and leaves state unchanged', async () => {
    await component.onDelete(component.rows[0]);

    expect(globalThis.confirm).toHaveBeenCalled();
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

  it('when hasParams=false, does not call API and surfaces validation error', () => {
    service.getApplicationLists.mockClear();
    component.searchErrors = [];
    component.loadApplicationsLists(false);
    expect(service.getApplicationLists).not.toHaveBeenCalled();
    expect(component.searchErrors[0]).toEqual({
      id: '',
      text: 'Invalid Search Criteria. At least one field must be entered.',
    });
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
            entriesCount: 7,
            status: ApplicationListStatus.OPEN,
          },
        ]),
      ),
    );
    component.loadApplicationsLists(true);
    expect(component.rows).toHaveLength(1);
    expect(component.rows[0].date).toBe('2025-09-17');
    expect(component.rows[0].time).toBe('14:05');
    expect(component.rows[0].entries).toBe(7);
  });

  it('sets totals from page response', () => {
    service.getApplicationLists.mockReturnValue(
      of(pageStub([], { totalElements: 10, totalPages: 2 })),
    );

    component.loadApplicationsLists(true);
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
    component.loadApplicationsLists(true);
    expect(component.rows).toHaveLength(0);
    expect(component.totalPages).toBe(0);
    expect(component.submitted).toBe(true);
    expect(component.searchErrors[0]).toEqual({
      id: 'search',
      text: 'Request failed',
    });
  });

  it('when hasParams=false, does not call API and shows the same validation error', () => {
    service.getApplicationLists.mockClear();
    component.searchErrors = [];
    component.loadApplicationsLists(false);
    expect(service.getApplicationLists).not.toHaveBeenCalled();
    expect(component.searchErrors[0]).toEqual({
      id: '',
      text: 'Invalid Search Criteria. At least one field must be entered.',
    });
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

  describe('buildTrailingNumericSortKey', () => {
    type PrivateApi = {
      buildTrailingNumericSortKey(value: unknown): string;
    };

    const sortKey = (v: unknown) =>
      (component as unknown as PrivateApi).buildTrailingNumericSortKey(v);

    it('returns empty string for null, empty string, and unsupported types', () => {
      expect(sortKey(null)).toBe('');
      expect(sortKey('   ')).toBe('');
      expect(sortKey(undefined)).toBe('');
      expect(sortKey({})).toBe('');
      expect(sortKey([])).toBe('');
    });

    it('normalises strings and pads trailing numeric suffix', () => {
      expect(sortKey(' ABC 12 ')).toBe('abc 0012');
      expect(sortKey('abc')).toBe('abc');
      expect(sortKey('abc12d')).toBe('abc12d'); // not trailing digits
      expect(sortKey('abc12345')).toBe('abc12345'); // longer than 4
      expect(sortKey('  7  ')).toBe('0007'); // prefix empty
    });

    it('handles numbers and booleans', () => {
      expect(sortKey(12)).toBe('0012');
      expect(sortKey(0)).toBe('0000');
      expect(sortKey(true)).toBe('true');
      expect(sortKey(false)).toBe('false');
    });
  });

  describe('hasAnyParams', () => {
    type PrivateApi = {
      hasAnyParams(): boolean;
    };

    const hasAny = () => (component as unknown as PrivateApi).hasAnyParams();

    it('returns false when all fields are empty/default', () => {
      component.form.controls.date.setValue(null);
      component.form.controls.time.setValue(null);
      component.form.controls.description.setValue('');
      component.form.controls.status.setValue(null);
      component.form.controls.court.setValue('');
      component.form.controls.location.setValue('');
      component.form.controls.cja.setValue('');

      expect(hasAny()).toBe(false);
    });

    it('returns true when any field has a value', () => {
      component.form.controls.date.setValue('2025-12-15');
      expect(hasAny()).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('collects date/time validation errors and does not run search', () => {
      const spy = jest.spyOn(component, 'loadApplicationsLists');

      component.form.controls.date.setErrors({
        dateInvalid: true,
        dateErrorText: 'Enter a valid date',
      });

      component.form.controls.time.setErrors({
        durationInvalid: true,
        durationErrorText: 'Enter a valid time',
      });

      const { e, preventDefault } = submitEvent('search');
      component.onSubmit(e);

      expect(preventDefault).toHaveBeenCalled();
      expect(component.submitted).toBe(true);
      expect(component.searchErrors).toEqual([
        { id: 'date-day', text: 'Enter a valid date' },
        { id: 'time-hours', text: 'Enter a valid time' },
      ]);
      expect(spy).not.toHaveBeenCalled();
    });

    it('calls loadApplicationsLists(hasAnyParams) for search action when no validation errors', () => {
      const spy = jest
        .spyOn(component, 'loadApplicationsLists')
        .mockImplementation(() => undefined);

      component.form.controls.date.setValue('2025-12-15');
      component.form.controls.date.setErrors(null);
      component.form.controls.time.setErrors(null);

      component.currentPage = 3;

      const { e, preventDefault } = submitEvent('search');
      component.onSubmit(e);

      expect(preventDefault).toHaveBeenCalled();
      expect(component.submitted).toBe(true);
      expect(component.isSearch).toBe(true);
      expect(component.currentPage).toBe(1);
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('defaults action to "search" when submitter is missing', () => {
      const spy = jest
        .spyOn(component, 'loadApplicationsLists')
        .mockImplementation(() => undefined);

      component.form.controls.date.setValue('2025-12-15');
      component.form.controls.date.setErrors(null);
      component.form.controls.time.setErrors(null);

      const { e } = submitEvent(null);
      component.onSubmit(e);

      expect(spy).toHaveBeenCalledWith(true);
    });
  });
});

describe('ApplicationsList.onPrintPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns early when id is falsy', async () => {
    const { comp, api, pdf, clearNotificationsSpy } = createInstance('browser');

    await comp.onPrintPage('');

    expect(clearNotificationsSpy).not.toHaveBeenCalled();
    expect(api.printApplicationList).not.toHaveBeenCalled();
    expect(pdf.generatePagedApplicationListPdf).not.toHaveBeenCalled();
  });

  it('clears errors and calls API with transferCache: false', async () => {
    const { comp, api, clearNotificationsSpy } = createInstance('browser');

    const dto = makePrintDto([]);
    api.printApplicationList.mockReturnValue(of(dto));

    await comp.onPrintPage('abc-123');

    expect(clearNotificationsSpy).toHaveBeenCalledTimes(1);

    // args: { id }, undefined, undefined, { transferCache: false }
    expect(api.printApplicationList).toHaveBeenCalledTimes(1);
    expect(api.printApplicationList.mock.calls[0][0]).toEqual({
      listId: 'abc-123',
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
    const { comp, api, pdf, clearNotificationsSpy, showInlineSpy } =
      createInstance('server');

    await comp.onPrintContinuous('abc-123', false);

    expect(clearNotificationsSpy).not.toHaveBeenCalled();
    expect(api.printApplicationList).not.toHaveBeenCalled();
    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
    expect(showInlineSpy).not.toHaveBeenCalled();
  });

  it('returns early when id is falsy', async () => {
    const { comp, api, pdf, clearNotificationsSpy, showInlineSpy } =
      createInstance('browser');

    await comp.onPrintContinuous('', false);

    expect(clearNotificationsSpy).not.toHaveBeenCalled();
    expect(api.printApplicationList).not.toHaveBeenCalled();
    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
    expect(showInlineSpy).not.toHaveBeenCalled();
  });

  it('clears errors and calls API with transferCache: false', async () => {
    const { comp, api, clearNotificationsSpy } = createInstance('browser');

    const dto = makePrintDto([{ a: 1 } as unknown]);
    api.printApplicationList.mockReturnValue(of(dto));

    await comp.onPrintContinuous('abc-123', false);

    expect(clearNotificationsSpy).toHaveBeenCalledTimes(1);

    expect(api.printApplicationList).toHaveBeenCalledTimes(1);
    expect(api.printApplicationList.mock.calls[0][0]).toEqual({
      listId: 'abc-123',
    });
    expect(api.printApplicationList.mock.calls[0][1]).toBeUndefined();
    expect(api.printApplicationList.mock.calls[0][2]).toBeUndefined();
    expect(api.printApplicationList.mock.calls[0][3]).toEqual({
      transferCache: false,
    });
  });

  it('shows inline message when there are no entries', async () => {
    const { comp, api, pdf, showInlineSpy } = createInstance('browser');

    api.printApplicationList.mockReturnValue(of(makePrintDto([])));

    await comp.onPrintContinuous('abc-123', false);

    expect(showInlineSpy).toHaveBeenCalledWith('No entries available to print');
    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
  });

  it('generates PDF on the browser when entries exist', async () => {
    const { comp, api, pdf } = createInstance('browser');

    const dto = makePrintDto([{}]);
    api.printApplicationList.mockReturnValue(of(dto));

    await comp.onPrintContinuous('abc-123', false);

    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledTimes(1);
    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledWith(
      [dto],
      false,
    );
  });

  it('shows a generic error if PDF generation rejects', async () => {
    const { comp, api, pdf, showInlineSpy } = createInstance('browser');

    const dto = makePrintDto([{ x: 1 } as unknown]);
    api.printApplicationList.mockReturnValue(of(dto));
    pdf.generateContinuousApplicationListsPdf.mockRejectedValueOnce(
      new Error('pdf fail'),
    );

    await comp.onPrintContinuous('abc-123', false);

    expect(api.printApplicationList).toHaveBeenCalledTimes(1);
    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledTimes(1);
    expect(showInlineSpy).toHaveBeenCalledWith('Unable to generate PDF.');
  });
});
