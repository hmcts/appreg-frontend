import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { LOCALE_ID, PLATFORM_ID, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { Applications } from '@components/applications/applications.component';
import { ApplicationsState } from '@components/applications/util/applications.state';
import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { PdfService } from '@core/services/pdf.service';
import {
  ApplicationListEntriesApi,
  ApplicationListGetPrintDto,
  ApplicationListStatus,
  ApplicationListsApi,
  EntryGetFilterDto,
  EntryGetSummaryDto,
  EntryIdsDto,
  EntryPage,
} from '@openapi';
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
  } as ApplicationListGetPrintDto;
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

describe('ApplicationsComponent', () => {
  let component: Applications;
  let fixture: ComponentFixture<Applications>;

  const referenceDataFacadeStub: Pick<
    ReferenceDataFacade,
    'cja$' | 'courtLocations$'
  > = {
    cja$: of([]),
    courtLocations$: of([]),
  };

  const getEntriesMock: jest.MockedFunction<
    ApplicationListEntriesApi['getEntries']
  > = jest.fn();
  const getEntryIdsMock: jest.MockedFunction<
    ApplicationListEntriesApi['getEntryIds']
  > = jest.fn();

  const appListEntriesApiStub: Pick<
    ApplicationListEntriesApi,
    'getEntries' | 'getEntryIds'
  > = {
    getEntries: getEntriesMock,
    getEntryIds: getEntryIdsMock,
  };

  const printApplicationListMock = jest.fn();
  const appListsApiStub = {
    printApplicationList: printApplicationListMock,
  } as unknown as Pick<ApplicationListsApi, 'printApplicationList'>;

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
    getEntryIdsMock.mockReset();
    printApplicationListMock.mockReset();
    pdfServiceStub.generatePagedApplicationListPdf.mockReset();
    pdfServiceStub.generateContinuousApplicationListsPdf.mockReset();

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
    getEntryIdsMock.mockReturnValue(
      of({ ids: [] } as EntryIdsDto) as unknown as ReturnType<
        ApplicationListEntriesApi['getEntryIds']
      >,
    );

    await TestBed.configureTestingModule({
      imports: [Applications],
      providers: [
        { provide: LOCALE_ID, useValue: 'en-GB' },
        { provide: ReferenceDataFacade, useValue: referenceDataFacadeStub },
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

    fixture = TestBed.createComponent(Applications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

    it('when submitted with no params: sets invalid search criteria error and does not call API', () => {
      getEntriesMock.mockClear();

      component.form.reset({
        date: null,
        applicantOrg: '',
        respondentOrg: '',
        applicantSurname: '',
        respondentSurname: '',
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
          text: expect.stringContaining('Invalid Search Criteria'),
        }),
      ]);
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
          respondentPostcode: 'AB1 2CD',
          standardApplicantCode: 'STD123',
          accountReference: 'ACC-999',
        }),
      );

      component.form.reset({ date: '   ' });
      const emptyFilter = (component as unknown as HasLoadQuery).loadQuery();
      expect(emptyFilter.date).toBeUndefined();
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

    it('header select-all fetches matching ids and updates selection', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        rows: [
          makeEntry({ id: 'entry-1', listId: 'list-a' }),
          makeEntry({ id: 'entry-2', listId: 'list-b' }),
        ],
        totalEntries: 4,
        getFilters: { applicantOrganisation: 'Org Ltd' },
      }));

      getEntryIdsMock.mockReturnValueOnce(
        of({
          ids: ['entry-1', 'entry-2', 'entry-3', 'entry-4'],
        }) as unknown as ReturnType<ApplicationListEntriesApi['getEntryIds']>,
      );

      await component.onHeaderSelectAllChange(true);

      expect(getEntryIdsMock).toHaveBeenCalledWith({
        filter: { applicantOrganisation: 'Org Ltd' },
      });
      expect(component.vm().selectedIds).toEqual(
        new Set(['entry-1', 'entry-2', 'entry-3', 'entry-4']),
      );
      expect(component.vm().isSelectingAll).toBe(false);
      expect(component.vm().allMatchingSelected).toBe(true);
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

    it('clears selection when header select-all is unchecked', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedIds: new Set(['entry-1']),
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
        allMatchingSelected: true,
        isSelectingAll: true,
      }));

      await component.onHeaderSelectAllChange(false);

      expect(component.vm().selectedIds.size).toBe(0);
      expect(component.vm().selectedRows).toEqual([]);
      expect(component.vm().allMatchingSelected).toBe(false);
      expect(component.vm().isSelectingAll).toBe(false);
    });

    it('ignores stale select-all responses after the selection is cleared', async () => {
      const idsSubject = new Subject<EntryIdsDto>();

      appStateSignal(component).update((s) => ({
        ...s,
        rows: [
          makeEntry({ id: 'entry-1', listId: 'list-a' }),
          makeEntry({ id: 'entry-2', listId: 'list-b' }),
        ],
        totalEntries: 4,
        getFilters: { applicantOrganisation: 'Org Ltd' },
      }));

      getEntryIdsMock.mockReturnValueOnce(
        idsSubject.asObservable() as unknown as ReturnType<
          ApplicationListEntriesApi['getEntryIds']
        >,
      );

      const selectAllPromise = component.onHeaderSelectAllChange(true);

      expect(component.vm().selectedIds).toEqual(
        new Set(['entry-1', 'entry-2']),
      );
      expect(component.vm().isSelectingAll).toBe(true);

      await component.onHeaderSelectAllChange(false);

      idsSubject.next({
        ids: ['entry-1', 'entry-2', 'entry-3', 'entry-4'],
      } as EntryIdsDto);
      idsSubject.complete();
      await selectAllPromise;

      expect(component.vm().selectedIds.size).toBe(0);
      expect(component.vm().selectedRows).toEqual([]);
      expect(component.vm().allMatchingSelected).toBe(false);
      expect(component.vm().isSelectingAll).toBe(false);
    });
  });

  describe('onPrintContinuousClick', () => {
    it('resolves selected rows across pages before printing', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedIds: new Set(['entry-1', 'entry-2']),
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
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

      printApplicationListMock.mockImplementation(({ listId }) =>
        of(
          makePrintDto({
            entries: [
              {
                id: listId === 'list-a' ? 'entry-1' : 'entry-2',
                applicant: {},
                applicationCode: '',
                applicationTitle: '',
                applicationWording: '',
              },
            ],
          }),
        ),
      );

      await component.onPrintContinuousClick();
      await flushSignalEffects(fixture);

      expect(getEntriesMock).toHaveBeenCalledWith({
        pageNumber: 0,
        pageSize: 10,
        sort: ['date,desc'],
        filter: { applicantOrganisation: 'Org Ltd' },
      });
      expect(printApplicationListMock).toHaveBeenCalledTimes(2);
    });

    it('fetches each unique list id and generates one filtered continuous PDF', async () => {
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

      printApplicationListMock.mockImplementation(({ listId }) => {
        if (listId === 'list-a') {
          return of(listADto);
        }
        return of(listBDto);
      });

      await component.onPrintContinuousClick();
      await flushSignalEffects(fixture);

      expect(printApplicationListMock).toHaveBeenCalledTimes(2);
      expect(printApplicationListMock.mock.calls[0]).toEqual([
        { listId: 'list-a' },
        undefined,
        undefined,
        { transferCache: false },
      ]);
      expect(printApplicationListMock.mock.calls[1]).toEqual([
        { listId: 'list-b' },
        undefined,
        undefined,
        { transferCache: false },
      ]);
      expect(
        pdfServiceStub.generateContinuousApplicationListsPdf,
      ).toHaveBeenCalledWith(
        [
          {
            ...listADto,
            entries: listADto.entries.filter((entry) =>
              ['entry-a1', 'entry-a2'].includes(entry.id),
            ),
          },
          {
            ...listBDto,
            entries: listBDto.entries.filter((entry) =>
              ['entry-b1'].includes(entry.id),
            ),
          },
        ],
        false,
      );
    });

    it('shows no entries message when all fetched DTO entries are filtered out', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
      }));
      printApplicationListMock.mockReturnValue(
        of(
          makePrintDto({
            entries: [
              {
                id: 'other-entry',
                applicant: {},
                applicationCode: '',
                applicationTitle: '',
                applicationWording: '',
              },
            ],
          }),
        ),
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
      printApplicationListMock.mockReturnValue(
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

      getEntriesMock.mockReturnValueOnce(
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

      expect(printApplicationListMock).not.toHaveBeenCalled();
      expect(component.vm().errorSummary).toEqual([{ text: 'Resolve failed' }]);
    });

    it('patches a generic print error when PDF generation rejects', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
      }));
      printApplicationListMock.mockReturnValue(
        of(
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
        ),
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
    it('fetches each unique list id and generates one filtered page PDF', async () => {
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

      printApplicationListMock.mockImplementation(({ listId }) => {
        if (listId === 'list-a') {
          return of(listADto);
        }
        return of(listBDto);
      });

      await component.onPrintPageClick();
      await flushSignalEffects(fixture);

      expect(printApplicationListMock).toHaveBeenCalledTimes(2);
      expect(printApplicationListMock.mock.calls[0]).toEqual([
        { listId: 'list-a' },
        undefined,
        undefined,
        { transferCache: false },
      ]);
      expect(printApplicationListMock.mock.calls[1]).toEqual([
        { listId: 'list-b' },
        undefined,
        undefined,
        { transferCache: false },
      ]);
      expect(
        pdfServiceStub.generatePagedApplicationListPdf,
      ).toHaveBeenCalledWith(
        [
          {
            ...listADto,
            entries: listADto.entries.filter((entry) =>
              ['entry-a1', 'entry-a2'].includes(entry.id),
            ),
          },
          {
            ...listBDto,
            entries: listBDto.entries.filter((entry) =>
              ['entry-b1'].includes(entry.id),
            ),
          },
        ],
        { crestUrl: '/assets/govuk-crest.png' },
      );
      expect(
        pdfServiceStub.generateContinuousApplicationListsPdf,
      ).not.toHaveBeenCalled();
    });

    it('shows no entries message when all fetched DTO entries are filtered out', async () => {
      appStateSignal(component).update((s) => ({
        ...s,
        selectedRows: [makeSelectedRow('entry-1', 'list-a')],
      }));
      printApplicationListMock.mockReturnValue(
        of(
          makePrintDto({
            entries: [
              {
                id: 'other-entry',
                applicant: {},
                applicationCode: '',
                applicationTitle: '',
                applicationWording: '',
              },
            ],
          }),
        ),
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
      printApplicationListMock.mockReturnValue(
        of(
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
        ),
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
