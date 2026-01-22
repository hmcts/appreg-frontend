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
import { of, throwError } from 'rxjs';

import { ApplicationsList } from '@components/applications-list/applications-list';
import { APPLICATIONS_LIST_COLUMNS } from '@components/applications-list/util/applications-list.constants';
import {
  ApplicationsListState,
  clearNotificationsPatch,
} from '@components/applications-list/util/applications-list.state';
import * as LoadQuery from '@components/applications-list/util/load-query';
import { IF_MATCH, ROW_VERSION } from '@context/concurrency-context';
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
} from '@openapi';
import { PdfService } from '@services/pdf.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { ApplicationListRow } from '@util/types/application-list/types';

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

const getState = (component: ApplicationsList) => component.vm();

type AppListSignalStateAccessor = {
  appListSignalState: { patch: (p: Partial<ApplicationsListState>) => void };
};

const patchState = (
  component: ApplicationsList,
  patch: Partial<ApplicationsListState>,
): void => {
  (component as unknown as AppListSignalStateAccessor).appListSignalState.patch(
    patch,
  );
};
const flushSignalEffects = async (
  fixture?: ComponentFixture<ApplicationsList>,
): Promise<void> => {
  if (fixture) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return;
  }
  await Promise.resolve();
};

/**
 * Helper to build the component. Accepts:
 *  - platformId: 'browser' | 'server'
 *  - rows: optional seed for this.rows (useful for onPrintContinuous tests)
 */
function createInstance(
  platformId: 'browser' | 'server' = 'browser',
  rows: ApplicationListRow[] = [],
) {
  const api: { printApplicationList: jest.Mock } = {
    printApplicationList: jest.fn(),
  };

  const pdf = new PdfServiceStub();
  const refFacade = new ReferenceDataFacadeStub();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ApplicationsList],
    providers: [
      provideRouter([]),
      { provide: PLATFORM_ID, useValue: platformId },
      { provide: ApplicationListsApi, useValue: api },
      { provide: ReferenceDataFacade, useValue: refFacade },
      { provide: PdfService, useValue: pdf },
    ],
  });

  const fixture = TestBed.createComponent(ApplicationsList);
  const comp = fixture.componentInstance;
  fixture.detectChanges();

  patchState(comp, { rows });

  const showInlineSpy = jest.fn();
  (comp as unknown as { showInline: (m: string) => void }).showInline =
    showInlineSpy;

  const patchSpy = jest.spyOn(
    (comp as unknown as AppListSignalStateAccessor).appListSignalState,
    'patch',
  );

  return { comp, api, pdf, patchSpy, showInlineSpy, fixture };
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
    patchState(component, {
      rows: [
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
      ],
    });
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
    component.onDelete(row);
    await flushSignalEffects(fixture);

    expect(getState(component).deleteInvalid).toBe(true);
    expect(getState(component).errorSummary).toEqual([
      { text: 'This list cannot be deleted.' },
    ]);
    expect(api.deleteApplicationList).not.toHaveBeenCalled();
    expect(getState(component).deletingId).toBeNull();
  });

  it('on success (204) removes row and sets deleteDone=true; passes ETag/RowVersion via HttpContext', async () => {
    const row = getState(component).rows[0]; // abc-123

    // capture call args to inspect HttpContext values
    let capturedOptions: { context?: HttpContext } | undefined;

    api.deleteApplicationList.mockImplementation(
      (_params, _observe, _progress, options?: { context?: HttpContext }) => {
        capturedOptions = options;
        return of({ status: 204 } as HttpResponse<unknown>);
      },
    );

    component.onDelete(row);
    await flushSignalEffects(fixture);

    expect(api.deleteApplicationList).toHaveBeenCalledTimes(1);
    expect(api.deleteApplicationList.mock.calls[0][0]).toEqual({
      listId: 'abc-123',
    });

    // Concurrency tokens from context
    expect(capturedOptions?.context?.get(IF_MATCH)).toBe('W/"etag-val"');
    expect(capturedOptions?.context?.get(ROW_VERSION)).toBe('42');

    // Row removed, banner flag set, deletingId reset
    expect(
      getState(component).rows.find((r) => r.id === 'abc-123'),
    ).toBeUndefined();
    expect(getState(component).rows).toHaveLength(1);
    expect(getState(component).rows[0].id).toBe('keep-me');
    expect(getState(component).deleteDone).toBe(true);
    expect(getState(component).deleteInvalid).toBe(false);
    expect(getState(component).errorSummary).toEqual([]);
    expect(getState(component).deletingId).toBeNull();
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
        patchState(component, {
          rows: [
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
          ],
        });

        component.onDelete(row);
        await flushSignalEffects(fixture);

        // API was called
        expect(api.deleteApplicationList).toHaveBeenCalled();

        // Error flags and message mapping
        expect(getState(component).deleteDone).toBe(false);
        expect(getState(component).deleteInvalid).toBe(true);
        expect(getState(component).errorSummary[0].text).toBe(firstText);

        // Row NOT removed on error; deletingId reset
        expect(getState(component).rows).toHaveLength(2);
        expect(getState(component).deletingId).toBeNull();
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

    patchState(component, {
      rows: [
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
      ],
    });
  });

  afterEach(() => {
    (globalThis.confirm as jest.Mock)?.mockRestore?.();
  });

  it('when user cancels confirmation, does NOT call API and leaves state unchanged', () => {
    component.onDelete(getState(component).rows[0]);

    expect(globalThis.confirm).toHaveBeenCalled();
    expect(api.deleteApplicationList).not.toHaveBeenCalled();

    // no flags set, no removal, deletingId stays null
    expect(getState(component).deleteDone).toBe(false);
    expect(getState(component).deleteInvalid).toBe(false);
    expect(getState(component).errorSummary).toEqual([]);
    expect(getState(component).rows).toHaveLength(1);
    expect(getState(component).deletingId).toBeNull();
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

    patchState(component, { pageSize: 25, currentPage: 1 });
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
    patchState(component, { searchErrors: [] });
    component.loadApplicationsLists(false);
    expect(service.getApplicationLists).not.toHaveBeenCalled();
    expect(getState(component).searchErrors[0]).toEqual({
      id: '',
      text: 'Invalid Search Criteria. At least one field must be entered.',
    });
  });

  it('merges filter when hasParams=true', async () => {
    jest.spyOn(LoadQuery, 'loadQuery').mockReturnValue({
      status: ApplicationListStatus.OPEN,
      courtLocationCode: 'LOC1',
    } as ApplicationListGetFilterDto);

    service.getApplicationLists.mockReturnValue(of(pageStub([])));

    applicationsListsApiMock.getApplicationLists.mockClear();
    component.loadApplicationsLists(true);
    await flushSignalEffects(fixture);
    const args = service.getApplicationLists.mock
      .calls[0][0] as GetApplicationListsRequestParams;
    expect(args.filter).toEqual({
      status: ApplicationListStatus.OPEN,
      courtLocationCode: 'LOC1',
    });
  });

  it('formats date as YYYY-MM-DD and trims time to HH:mm', async () => {
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
    await flushSignalEffects(fixture);
    expect(getState(component).rows).toHaveLength(1);
    expect(getState(component).rows[0].date).toBe('2025-09-17');
    expect(getState(component).rows[0].time).toBe('14:05');
    expect(getState(component).rows[0].entries).toBe(7);
  });

  it('sets totals from page response', async () => {
    service.getApplicationLists.mockReturnValue(
      of(pageStub([], { totalElements: 10, totalPages: 2 })),
    );

    component.loadApplicationsLists(true);
    await flushSignalEffects(fixture);
    expect(getState(component).totalPages).toBe(2);
  });

  it('handles backend error: clears rows, zeros totals, sets submitted and searchErrors', async () => {
    service.getApplicationLists.mockReturnValue(
      throwError(() => new Error('Request failed')),
    );
    patchState(component, {
      rows: [
        {
          id: 'keep',
          date: '2025-01-01',
          time: '10:00',
          location: '',
          description: '',
          entries: 0,
          status: ApplicationListStatus.OPEN,
        },
      ],
      totalPages: 3,
      submitted: false,
      searchErrors: [],
    });
    component.loadApplicationsLists(true);
    await flushSignalEffects(fixture);
    expect(getState(component).rows).toHaveLength(0);
    expect(getState(component).totalPages).toBe(0);
    expect(getState(component).submitted).toBe(true);
    expect(getState(component).searchErrors[0]).toEqual({
      id: 'search',
      text: 'Request failed',
    });
  });

  it('includes filter object when hasParams=true even if partial', async () => {
    jest.spyOn(LoadQuery, 'loadQuery').mockReturnValue({
      status: ApplicationListStatus.CLOSED,
    } as ApplicationListGetFilterDto);

    service.getApplicationLists.mockReturnValue(of(pageStub([])));
    component.loadApplicationsLists(true);
    await flushSignalEffects(fixture);
    const args = service.getApplicationLists.mock
      .calls[0][0] as GetApplicationListsRequestParams;
    expect(args.filter).toEqual({ status: 'CLOSED' });
  });

  describe('buildTrailingNumericSortKey', () => {
    const sortKey = (v: unknown) => {
      const column = APPLICATIONS_LIST_COLUMNS.find(
        (item) => item.field === 'location',
      );
      if (!column?.sortValue) {
        throw new Error('Location column sortValue is missing');
      }
      return column.sortValue({ location: v } as Record<string, unknown>);
    };

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
      expect(getState(component).submitted).toBe(true);
      expect(getState(component).searchErrors).toEqual([
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

      patchState(component, { currentPage: 3 });

      const { e, preventDefault } = submitEvent('search');
      component.onSubmit(e);

      expect(preventDefault).toHaveBeenCalled();
      expect(getState(component).submitted).toBe(true);
      expect(getState(component).isSearch).toBe(true);
      expect(getState(component).currentPage).toBe(1);
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

  it('returns early when id is falsy', () => {
    const { comp, api, pdf, patchSpy } = createInstance('browser');
    patchSpy.mockClear();

    comp.onPrintPage('');

    expect(patchSpy).not.toHaveBeenCalled();
    expect(api.printApplicationList).not.toHaveBeenCalled();
    expect(pdf.generatePagedApplicationListPdf).not.toHaveBeenCalled();
  });

  it('clears errors and calls API with transferCache: false', async () => {
    const { comp, api, patchSpy, fixture } = createInstance('browser');
    patchSpy.mockClear();

    const dto = makePrintDto([]);
    api.printApplicationList.mockReturnValue(of(dto));

    comp.onPrintPage('abc-123');
    await flushSignalEffects(fixture);

    expect(patchSpy).toHaveBeenCalledTimes(1);
    expect(patchSpy).toHaveBeenCalledWith(clearNotificationsPatch());

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
    const { comp, api, pdf, showInlineSpy, fixture } =
      createInstance('browser');

    const dto = makePrintDto([]);
    api.printApplicationList.mockReturnValue(of(dto));

    comp.onPrintPage('abc-123');
    await flushSignalEffects(fixture);

    expect(showInlineSpy).toHaveBeenCalledWith('No entries available to print');
    expect(pdf.generatePagedApplicationListPdf).not.toHaveBeenCalled();
  });

  it('generates PDF on the browser when entries exist', async () => {
    const { comp, api, pdf, fixture } = createInstance('browser');

    // include at least one entry so the component proceeds to generate the PDF
    const dto = makePrintDto([{}]);

    // ensure the mock is typed like the real method’s return
    api.printApplicationList.mockReturnValue(of(dto));

    comp.onPrintPage('abc-123');
    await flushSignalEffects(fixture);

    expect(pdf.generatePagedApplicationListPdf).toHaveBeenCalledTimes(1);
    expect(pdf.generatePagedApplicationListPdf).toHaveBeenCalledWith(dto, {
      crestUrl: '/assets/govuk-crest.png',
    });
  });

  it('does not generate PDF on the server platform', async () => {
    const { comp, api, pdf, fixture } = createInstance('server');

    const dto = makePrintDto([]);
    api.printApplicationList.mockReturnValue(of(dto));

    comp.onPrintPage('abc-123');
    await flushSignalEffects(fixture);

    expect(pdf.generatePagedApplicationListPdf).not.toHaveBeenCalled();
  });

  it('maps 404 to "Application List not found"', async () => {
    const { comp, api, showInlineSpy, fixture } = createInstance('browser');

    api.printApplicationList.mockReturnValue(
      throwError(() => ({ status: 404 })),
    );

    comp.onPrintPage('abc-123');
    await flushSignalEffects(fixture);

    expect(showInlineSpy).toHaveBeenCalledWith('Application List not found');
  });

  it('maps non-404 errors to generic banner', async () => {
    const { comp, api, showInlineSpy, fixture } = createInstance('browser');

    api.printApplicationList.mockReturnValue(
      throwError(() => ({ status: 500 })),
    );

    comp.onPrintPage('abc-123');
    await flushSignalEffects(fixture);

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
    const { comp, api, pdf, patchSpy, showInlineSpy, fixture } =
      createInstance('server');
    patchSpy.mockClear();

    comp.onPrintContinuous('abc-123', false);
    await flushSignalEffects(fixture);

    expect(patchSpy).not.toHaveBeenCalled();
    expect(api.printApplicationList).not.toHaveBeenCalled();
    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
    expect(showInlineSpy).not.toHaveBeenCalled();
  });

  it('returns early when id is falsy', () => {
    const { comp, api, pdf, patchSpy, showInlineSpy } =
      createInstance('browser');
    patchSpy.mockClear();

    comp.onPrintContinuous('', false);

    expect(patchSpy).not.toHaveBeenCalled();
    expect(api.printApplicationList).not.toHaveBeenCalled();
    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
    expect(showInlineSpy).not.toHaveBeenCalled();
  });

  it('clears errors and calls API with transferCache: false', async () => {
    const { comp, api, patchSpy, fixture } = createInstance('browser');
    patchSpy.mockClear();

    const dto = makePrintDto([{ a: 1 } as unknown]);
    api.printApplicationList.mockReturnValue(of(dto));

    comp.onPrintContinuous('abc-123', false);
    await flushSignalEffects(fixture);

    expect(patchSpy).toHaveBeenCalledTimes(1);
    expect(patchSpy).toHaveBeenCalledWith(clearNotificationsPatch());

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
    const { comp, api, pdf, showInlineSpy, fixture } =
      createInstance('browser');

    api.printApplicationList.mockReturnValue(of(makePrintDto([])));

    comp.onPrintContinuous('abc-123', false);
    await flushSignalEffects(fixture);

    expect(showInlineSpy).toHaveBeenCalledWith('No entries available to print');
    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
  });

  it('generates PDF on the browser when entries exist', async () => {
    const { comp, api, pdf, fixture } = createInstance('browser');

    const dto = makePrintDto([{}]);
    api.printApplicationList.mockReturnValue(of(dto));

    comp.onPrintContinuous('abc-123', false);
    await flushSignalEffects(fixture);

    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledTimes(1);
    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledWith(
      [dto],
      false,
    );
  });

  it('shows a generic error if PDF generation rejects', async () => {
    const { comp, api, pdf, showInlineSpy, fixture } =
      createInstance('browser');

    const dto = makePrintDto([{ x: 1 } as unknown]);
    api.printApplicationList.mockReturnValue(of(dto));
    pdf.generateContinuousApplicationListsPdf.mockRejectedValueOnce(
      new Error('pdf fail'),
    );

    comp.onPrintContinuous('abc-123', false);
    await flushSignalEffects(fixture);

    expect(api.printApplicationList).toHaveBeenCalledTimes(1);
    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledTimes(1);
    expect(showInlineSpy).toHaveBeenCalledWith('Unable to generate PDF.');
  });
});

describe('ApplicationsList.clearSearch', () => {
  it('clears state, errors and resets forms', () => {
    const { comp, patchSpy } = createInstance('browser');

    patchState(comp, {
      isSearch: true,
      rows: [{ id: 'x' } as ApplicationListRow],
    });

    const searchForm = comp as unknown as {
      searchForm: {
        reset: jest.Mock;
        state: () => Record<string, unknown>;
      };
    };

    searchForm.searchForm.reset = jest.fn();
    searchForm.searchForm.state = jest.fn(() => ({ status: 'OPEN' }));

    const formResetSpy = jest.spyOn(comp.form, 'reset');

    comp.clearSearch();

    expect(patchSpy).toHaveBeenCalledWith(clearNotificationsPatch());
    expect(patchSpy).toHaveBeenCalledWith({ isSearch: false, rows: [] });

    expect(searchForm.searchForm.reset).toHaveBeenCalled();
    expect(formResetSpy).toHaveBeenCalled();
    expect(formResetSpy.mock.calls[0][0]).toEqual({ status: 'OPEN' });
  });
});
