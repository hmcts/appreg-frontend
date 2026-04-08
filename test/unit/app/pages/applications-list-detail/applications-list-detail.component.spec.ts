import {
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
  provideHttpClient,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApplicationsListDetail } from '@components/applications-list-detail/applications-list-detail.component';
import { selectedRow } from '@components/applications-list-detail/util';
import { ApplicationsListDetailState } from '@components/applications-list-detail/util/applications-list-detail.state';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { Row } from '@core-types/table/row.types';
import {
  Applicant,
  ApplicationListEntriesApi,
  ApplicationListGetDetailDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CriminalJusticeAreaGetDto,
  EntryGetSummaryDto,
  EntryPage,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { MojButtonMenu } from '@util/moj-button-menu';
import { formatPersonName } from '@util/string-helpers';

const flushSignalEffects = async (
  fixture?: ComponentFixture<ApplicationsListDetail>,
): Promise<void> => {
  if (fixture) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return;
  }
  await Promise.resolve();
};

type DetailSignalStateAccessor = {
  detailSignalState: {
    patch: (p: Partial<ApplicationsListDetailState>) => void;
  };
};

type PlaceFieldsStatePatch = {
  cjaSearch?: string | null;
  cja?: CriminalJusticeAreaGetDto[];
};

type PlaceFieldsSignalStateAccessor = {
  signalState: { patch: (p: Partial<PlaceFieldsStatePatch>) => void };
};

type ResultCodeHelpersAccessor = {
  getResultCodes(entry: EntryGetSummaryDto): string[];
  joinResultCodes(resultCodes: string[]): string;
};

describe('ApplicationsListDetail', () => {
  let fixture: ComponentFixture<ApplicationsListDetail>;
  let component: ApplicationsListDetail;

  const apiStub: jest.Mocked<
    Pick<ApplicationListsApi, 'getApplicationList' | 'updateApplicationList'>
  > = {
    getApplicationList: jest.fn(),
    updateApplicationList: jest.fn(),
  };

  const entriesApiStub: jest.Mocked<
    Pick<ApplicationListEntriesApi, 'getApplicationListEntries'>
  > = {
    getApplicationListEntries: jest.fn(),
  };

  const menuStub: jest.Mocked<Pick<MojButtonMenu, 'initAll'>> = {
    initAll: jest.fn(),
  };

  const refFacadeStub: Pick<ReferenceDataFacade, 'courtLocations$' | 'cja$'> = {
    courtLocations$: of([]),
    cja$: of([] as CriminalJusticeAreaGetDto[]),
  };

  let historyStateSpy: jest.SpyInstance;

  const vm = () => component.vm();

  const patchDetailState = (p: Partial<ApplicationsListDetailState>): void => {
    (component as unknown as DetailSignalStateAccessor).detailSignalState.patch(
      p,
    );
  };

  const patchPlaceFieldsState = (p: Partial<PlaceFieldsStatePatch>): void => {
    (component as unknown as PlaceFieldsSignalStateAccessor).signalState.patch(
      p,
    );
  };

  beforeEach(async () => {
    const row = {
      id: 'id-1',
      location: 'LOC1',
      description: '',
      status: 'OPEN' as const,
    };

    historyStateSpy = jest
      .spyOn(globalThis.history, 'state', 'get')
      .mockReturnValue({ row });

    const dto = {
      entriesCount: 0,
      entriesSummary: [],
    } as unknown as ApplicationListGetDetailDto;

    apiStub.getApplicationList.mockReturnValue(
      of(
        new HttpResponse<ApplicationListGetDetailDto>({
          status: 200,
          body: dto,
          headers: new HttpHeaders({ ETag: '"etag-v1"' }),
        }),
      ),
    );

    const respondent: Applicant = {
      organisation: {
        name: 'Acme',
        contactDetails: {
          addressLine1: '123 Street',
          addressLine2: null,
          addressLine3: null,
          addressLine4: null,
          addressLine5: null,
          postcode: 'AB12 3CD',
          phone: null,
          mobile: null,
          email: null,
        },
      },
    };

    const entry: EntryGetSummaryDto = {
      id: 'abc',
      sequenceNumber: 7,
      accountNumber: '',
      applicant: undefined,
      respondent,
      applicationTitle: 'Land Registry Appeal',
      isFeeRequired: true,
      isResulted: false,
      status: ApplicationListStatus.OPEN,
    };

    const entriesPage: EntryPage = {
      pageNumber: 1,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      elementsOnPage: 1,
      sort: { orders: [] },
      content: [entry],
    };

    entriesApiStub.getApplicationListEntries.mockReturnValue(
      of(
        new HttpResponse<EntryPage>({
          status: 200,
          body: entriesPage,
          headers: new HttpHeaders(),
        }),
      ),
    );

    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ApplicationListsApi, useValue: apiStub },
        { provide: ApplicationListEntriesApi, useValue: entriesApiStub },
        { provide: MojButtonMenu, useValue: menuStub },
        { provide: ReferenceDataFacade, useValue: refFacadeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDetail);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await flushSignalEffects(fixture);
  });

  afterEach(() => {
    historyStateSpy?.mockRestore();
    jest.clearAllMocks();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders tabs with correct selection', () => {
    const appsTab = fixture.debugElement.query(By.css('#tab_applications'));
    const detailsTab = fixture.debugElement.query(By.css('#tab_list-details'));

    expect(appsTab).toBeTruthy();
    expect(detailsTab).toBeTruthy();

    expect(appsTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    expect(detailsTab.nativeElement.getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('shows success banner when updateDone is true', async () => {
    patchDetailState({ updateDone: true });
    await flushSignalEffects(fixture);

    expect(
      fixture.debugElement.query(By.css('app-success-banner')),
    ).toBeTruthy();
  });

  it('shows error summary when errorSummary has items', async () => {
    patchDetailState({
      errorSummary: [{ href: '#x', text: 'Error' }],
      updateInvalid: true,
      errorHint: 'There is a problem',
    });

    await flushSignalEffects(fixture);

    expect(
      fixture.debugElement.query(By.css('app-error-summary')),
    ).toBeTruthy();
  });

  it('disables Other location when Court is chosen (PlaceFieldsBase disabler)', () => {
    component.form.controls.court.setValue('LOC123');
    fixture.detectChanges();

    expect(component.form.controls.location.disabled).toBe(true);

    const otherLoc = fixture.debugElement.query(
      By.css('app-text-input[formControlName="location"]'),
    );
    if (otherLoc?.componentInstance) {
      expect(otherLoc.componentInstance.disabledState?.()).toBe(true);
    }
  });

  it('resetErrorSummary patches detailSignalState with default values', () => {
    const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');

    component['resetErrorSummary']();

    expect(patchSpy).toHaveBeenCalledWith({
      errorSummary: [],
      errorHint: '',
      preserveErrorSummaryOnLoad: false,
      updateInvalid: false,
    });
  });

  describe('mapTableResponsetoRows', () => {
    it('maps the API shape into selected rows', () => {
      const dto = {
        content: [
          {
            id: 'entry-1',
            sequenceNumber: 42,
            accountNumber: 'ACC-123',
            applicant: {
              organisation: {
                name: 'Applicant Org',
                contactDetails: {
                  postcode: 'AA1 1AA',
                },
              },
            },
            respondent: {
              organisation: {
                name: 'Respondent Org',
                contactDetails: {
                  postcode: 'BB2 2BB',
                },
              },
            },
            applicationTitle: 'Some application title',
            isFeeRequired: true,
            resulted: [
              {
                resultCode: 'COST',
                title: 'Costs granted',
              },
            ],
          },
        ],
      } as unknown as { content: EntryGetSummaryDto[] };

      const result = (
        component as unknown as {
          mapTableResponsetoRows(dto: {
            content: EntryGetSummaryDto[];
          }): selectedRow[];
        }
      ).mapTableResponsetoRows(dto);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'entry-1',
        sequenceNumber: 42,
        accountNumber: 'ACC-123',
        applicant: 'Applicant Org',
        respondent: 'Respondent Org',
        postCode: 'BB2 2BB',
        title: 'Some application title',
        feeReq: 'Yes',
        resulted: 'COST',
      });
    });

    it('uses person names when person data exists', () => {
      const dto = {
        content: [
          {
            id: 'entry-2',
            sequenceNumber: 7,
            accountNumber: null,
            applicant: {
              person: {
                name: {
                  surname: 'Brown',
                  firstForename: 'Alex',
                  secondForename: 'J',
                  thirdForename: null,
                  title: 'Mr',
                },
              },
            },
            respondent: {
              person: {
                name: {
                  surname: 'Green',
                  firstForename: 'Sam',
                  secondForename: null,
                  thirdForename: null,
                  title: null,
                },
                contactDetails: {
                  postcode: 'CC3 3CC',
                },
              },
            },
            applicationTitle: 'Another title',
            isFeeRequired: false,
            resulted: [
              {
                resultCode: 'COST',
                title: 'Costs granted',
              },
            ],
          },
        ],
      } as unknown as { content: EntryGetSummaryDto[] };

      const result = (
        component as unknown as {
          mapTableResponsetoRows(dto: {
            content: EntryGetSummaryDto[];
          }): selectedRow[];
        }
      ).mapTableResponsetoRows(dto);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'entry-2',
        sequenceNumber: 7,
        accountNumber: '',
        applicant: 'Mr, Alex J, Brown',
        respondent: 'Sam, Green',
        postCode: 'CC3 3CC',
        title: 'Another title',
        feeReq: 'No',
        resulted: 'COST',
      });
    });
  });

  describe('result code helpers', () => {
    const resultCodeHelpers = (): ResultCodeHelpersAccessor =>
      component as unknown as ResultCodeHelpersAccessor;

    it('getResultCodes returns all codes when resulted is a string array', () => {
      const entry = {
        id: 'entry-1',
        applicationTitle: 'Title',
        isFeeRequired: false,
        isResulted: true,
        status: ApplicationListStatus.OPEN,
        resulted: ['COST', 'ADJ'],
      } as unknown as EntryGetSummaryDto;

      expect(resultCodeHelpers().getResultCodes(entry)).toEqual([
        'COST',
        'ADJ',
      ]);
    });

    it('getResultCodes returns all codes when resulted is an object array', () => {
      const entry = {
        id: 'entry-1b',
        applicationTitle: 'Title',
        isFeeRequired: false,
        isResulted: true,
        status: ApplicationListStatus.OPEN,
        resulted: [
          { resultCode: 'COST', title: 'Costs granted' },
          { resultCode: 'ADJ', title: 'Adjourned' },
        ],
      } as unknown as EntryGetSummaryDto;

      expect(resultCodeHelpers().getResultCodes(entry)).toEqual([
        'COST',
        'ADJ',
      ]);
    });

    it('getResultCodes returns a single-item array for the legacy result object shape', () => {
      const entry = {
        id: 'entry-2',
        applicationTitle: 'Title',
        isFeeRequired: false,
        isResulted: true,
        status: ApplicationListStatus.OPEN,
        resulted: [
          {
            resultCode: 'COST',
            title: 'Costs granted',
          },
        ],
      } as unknown as EntryGetSummaryDto;

      expect(resultCodeHelpers().getResultCodes(entry)).toEqual(['COST']);
    });

    it('getResultCodes returns an empty array when no result code is present', () => {
      const entry = {
        id: 'entry-3',
        applicationTitle: 'Title',
        isFeeRequired: false,
        isResulted: false,
        status: ApplicationListStatus.OPEN,
      } as EntryGetSummaryDto;

      expect(resultCodeHelpers().getResultCodes(entry)).toEqual([]);
    });

    it('joinResultCodes joins trimmed codes and ignores blank values', () => {
      expect(
        resultCodeHelpers().joinResultCodes([' COST ', '', '  ', 'ADJ']),
      ).toBe('COST, ADJ');
    });
  });

  describe('formatPersonName', () => {
    it('returns null when applicant or name is missing', () => {
      expect(formatPersonName()).toBeNull();
      expect(formatPersonName({} as Applicant)).toBeNull();
    });

    it('formats title, forenames, and surname', () => {
      const applicant = {
        person: {
          name: {
            surname: 'Smith',
            firstForename: 'John',
            secondForename: 'Paul',
            thirdForename: 'George',
            title: 'Mr',
          },
        },
      } as Applicant;

      expect(formatPersonName(applicant)).toBe('Mr, John Paul George, Smith');
    });

    it('skips missing forenames', () => {
      const applicant = {
        person: {
          name: {
            surname: 'Smith',
            firstForename: 'John',
            secondForename: null,
            thirdForename: undefined,
            title: 'Mr',
          },
        },
      } as Applicant;

      expect(formatPersonName(applicant)).toBe('Mr, John, Smith');
    });
  });

  it('maps a 400 close error from navigation state onto the detail page', async () => {
    historyStateSpy.mockReturnValue({
      row: {
        id: 'id-1',
        location: 'LOC1',
        description: '',
        status: 'OPEN',
      },
      closeError: {
        status: 400,
        title: 'List cannot be closed',
        detail: 'All applications must have a Paid or Remitted Fee status.',
      },
    });

    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key) => {
        if (key === 'close') {
          return 'error';
        }
        if (key === 'code') {
          return '400';
        }
        return null;
      });

    (
      component as unknown as {
        setCloseErrorFromNavigation(): void;
      }
    ).setCloseErrorFromNavigation();

    await flushSignalEffects(fixture);

    expect(vm().updateInvalid).toBe(true);
    expect(vm().errorHint).toBe('There is a problem');
    expect(vm().errorSummary).toEqual([
      {
        id: 'status-close',
        href: '#status',
        text: 'All applications must have a Paid or Remitted Fee status.',
      },
    ]);
    expect(vm().preserveErrorSummaryOnLoad).toBe(true);
  });

  it('maps move errors from navigation state onto the detail page', async () => {
    historyStateSpy.mockReturnValue({
      row: {
        id: 'id-1',
        location: 'LOC1',
        description: '',
        status: 'OPEN',
      },
      moveError: 'Unable to move applications right now.',
    });

    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key) => {
        if (key === 'move') {
          return 'error';
        }
        return null;
      });

    (
      component as unknown as {
        setMoveErrorFromNavigation(): void;
      }
    ).setMoveErrorFromNavigation();

    await flushSignalEffects(fixture);

    expect(vm().updateInvalid).toBe(true);
    expect(vm().errorHint).toBe('There is a problem');
    expect(vm().errorSummary).toEqual([
      {
        id: '',
        href: '',
        text: 'Unable to move applications right now.',
      },
    ]);
    expect(vm().preserveErrorSummaryOnLoad).toBe(true);
  });

  it('sets moveDone when moveEntriesSuccessful query param is true', () => {
    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key) => {
        if (key === 'moveEntriesSuccessful') {
          return 'true';
        }
        return null;
      });

    component.setSuccessBanner();

    expect(vm().moveDone).toBe(true);
  });

  it('preserves returned close errors when the detail page reload completes', async () => {
    patchDetailState({
      updateInvalid: true,
      errorSummary: [
        {
          id: 'status-close',
          href: '#status',
          text: 'All applications must have a Paid or Remitted Fee status.',
        },
      ],
      preserveErrorSummaryOnLoad: true,
    });

    component.id = 'list-123';
    component.loadListDetailsInfo();
    await flushSignalEffects(fixture);

    expect(vm().updateInvalid).toBe(true);
    expect(vm().errorSummary).toEqual([
      {
        id: 'status-close',
        href: '#status',
        text: 'All applications must have a Paid or Remitted Fee status.',
      },
    ]);
    expect(vm().preserveErrorSummaryOnLoad).toBe(true);
  });

  describe('onTabSelected', () => {
    it('should reset error summary when applications tab has validation issues', () => {
      jest.spyOn(component, 'vm').mockReturnValue({
        errorSummary: [{ text: 'Something went wrong' }],
        updateInvalid: false,
        preserveErrorSummaryOnLoad: false,
      } as ApplicationsListDetailState);

      const resetSpy = jest.spyOn(
        component as unknown as { resetErrorSummary(): void },
        'resetErrorSummary',
      );

      component.onTabSelected('applications');

      expect(resetSpy).toHaveBeenCalled();
    });

    it('should reset success banner when applications tab has no errors but updateDone is true', () => {
      jest.spyOn(component, 'vm').mockReturnValue({
        errorSummary: [] as ErrorItem[],
        updateInvalid: false,
        updateDone: true,
        preserveErrorSummaryOnLoad: false,
      } as ApplicationsListDetailState);

      const resetBannerSpy = jest.spyOn(
        component as unknown as { resetSuccessBanner(): void },
        'resetSuccessBanner',
      );

      component.onTabSelected('applications');

      expect(resetBannerSpy).toHaveBeenCalled();
    });

    it('should NOT reset error summary when a different tab is selected', () => {
      jest.spyOn(component, 'vm').mockReturnValue({
        errorSummary: [{ text: 'Something went wrong' }],
        updateInvalid: true,
        preserveErrorSummaryOnLoad: false,
      } as ApplicationsListDetailState);

      const resetSpy = jest.spyOn(
        component as unknown as { resetErrorSummary(): void },
        'resetErrorSummary',
      );

      component.onTabSelected('details');

      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  it('ResetSuccessBanner should reset success banner by setting updateDone to false', () => {
    const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');

    (
      component as unknown as { resetSuccessBanner(): void }
    ).resetSuccessBanner();

    expect(patchSpy).toHaveBeenCalledWith({
      updateDone: false,
    });
  });

  it('onPageChange patches page + clears selectedIds + triggers load', () => {
    const loadSpy = jest
      .spyOn(component, 'loadListDetailsInfo')
      .mockImplementation(() => undefined);

    patchDetailState({ selectedIds: new Set(['a', 'b']) });

    component.onPageChange(3);

    expect(vm().currentPage).toBe(3);
    expect(vm().selectedIds.size).toBe(0);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('onSortChange stores the UI sort key and reloads data', () => {
    const loadSpy = jest
      .spyOn(component, 'loadListDetailsInfo')
      .mockImplementation(() => undefined);

    component.onSortChange({ key: 'title', direction: 'desc' });

    expect(vm().sortField).toEqual({
      key: 'title',
      direction: 'desc',
    });
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  describe('noEntries', () => {
    it('is false while loading', () => {
      patchDetailState({ isLoading: true, updateInvalid: false, rows: [] });
      expect(component.noEntries).toBe(false);
    });

    it('is false when updateInvalid is true', () => {
      patchDetailState({ isLoading: false, updateInvalid: true, rows: [] });
      expect(component.noEntries).toBe(false);
    });

    it('is true when not loading, not invalid, and no rows', () => {
      patchDetailState({ isLoading: false, updateInvalid: false, rows: [] });
      expect(component.noEntries).toBe(true);
    });
  });

  describe('loadListDetailsInfo', () => {
    it('calls API with listId, page (0-based), size; patches rows, clears errors, updates selection', async () => {
      component.id = 'list-123';

      patchDetailState({
        currentPage: 1,
        pageSize: 10,
        sortField: { key: 'sequenceNumber', direction: 'asc' },
        selectedIds: new Set(['stale-id']),
      });

      const dto = {
        entriesCount: 1,
        entriesSummary: [
          {
            uuid: 'abc',
            sequenceNumber: 7,
            accountNumber: '',
            applicant: null,
            respondent: 'Acme',
            postCode: null,
            applicationTitle: 'Land Registry Appeal',
            feeRequired: true,
            result: false,
          },
        ],
      } as unknown as ApplicationListGetDetailDto;

      apiStub.getApplicationList.mockReturnValueOnce(
        of(
          new HttpResponse<ApplicationListGetDetailDto>({
            status: 200,
            body: dto,
            headers: new HttpHeaders({ ETag: '"etag-v2"' }),
          }),
        ),
      );

      component.loadListDetailsInfo();
      await flushSignalEffects(fixture);

      expect(entriesApiStub.getApplicationListEntries).toHaveBeenCalledWith(
        expect.objectContaining({
          listId: 'list-123',
          pageNumber: 1,
          pageSize: 10,
          sort: ['sequenceNumber,asc'],
        }),
        'response',
        false,
        { transferCache: false },
      );

      expect(apiStub.getApplicationList).toHaveBeenNthCalledWith(
        2,
        {
          listId: 'list-123',
          pageNumber: 1,
          pageSize: 10,
        },
        'response',
        false,
        { transferCache: false },
      );

      expect(vm().isLoading).toBe(false);
      expect(vm().updateInvalid).toBe(false);
      expect(vm().errorHint).toBe('');
      expect(vm().errorSummary).toEqual([]);

      expect(vm().rows).toEqual([
        {
          id: 'abc',
          sequenceNumber: 7,
          accountNumber: '',
          applicant: null,
          respondent: 'Acme',
          postCode: 'AB12 3CD',
          title: 'Land Registry Appeal',
          feeReq: 'Yes',
          resulted: '',
        },
      ]);

      expect(vm().selectedIds.has('stale-id')).toBe(false);
      expect(vm().totalPages).toBe(0);
    });

    it('sets error state on API failure', async () => {
      component.id = 'list-123';

      apiStub.getApplicationList.mockReturnValueOnce(
        throwError(
          () => new HttpErrorResponse({ status: 500, statusText: 'boom' }),
        ),
      );

      patchDetailState({ selectedIds: new Set(['x', 'y']) });

      component.loadListDetailsInfo();
      await flushSignalEffects(fixture);

      expect(vm().updateInvalid).toBe(true);
      expect(vm().rows).toEqual([]);
      expect(vm().totalPages).toBe(0);
      expect(vm().selectedIds.size).toBe(0);
      expect(vm().errorSummary.length).toBeGreaterThan(0);
    });
  });

  it('setSuccessBanner: sets createDone to true when listCreated=true', () => {
    const route = TestBed.inject(ActivatedRoute);
    const routeSpy = jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockReturnValue('true');

    component.setSuccessBanner();

    expect(routeSpy).toHaveBeenCalledWith('listCreated');
    expect(component.vm().createDone).toBe(true);
  });

  it('setSuccessBanner: sets createDone to false when listCreated=false', () => {
    const route = TestBed.inject(ActivatedRoute);
    const routeSpy = jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockReturnValue('false');

    component.setSuccessBanner();

    expect(routeSpy).toHaveBeenCalledWith('listCreated');
    expect(component.vm().createDone).toBe(false);
  });

  it('openUpdate: navigates with state & queryParams', async () => {
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.id = 'list-9';

    await component.openUpdate({
      id: 'entry-123',
      applicant: 'Alice',
      respondent: 'Bob',
      title: 'Case XYZ',
    });

    expect(navSpy).toHaveBeenCalledWith(
      ['/applications-list', 'list-9', 'update-entry', 'entry-123'],
      {
        state: {
          appListId: 'list-9',
          resultApplicantContext: {
            applicant: 'Alice',
            respondent: 'Bob',
            title: 'Case XYZ',
          },
        },
      },
    );
  });

  it('onSelectedRowsChange: patches selectedRows in state', () => {
    const rows: Row[] = [{ id: 'id-1', resulted: 'No' } as unknown as Row];
    component.onSelectedRowsChange(rows);
    expect(vm().selectedRows).toEqual(rows);
  });

  it('prefillFromApi: sets listRow when navigation state row is missing', () => {
    component.listRow = undefined;
    component['etag'] = '"etag-v2"';

    const dto = {
      id: 'list-123',
      date: '2026-03-01',
      time: '09:30:00',
      courtName: 'Bristol',
      description: 'Morning list',
      entriesCount: 4,
      status: 'OPEN',
      version: 7,
    } as unknown as ApplicationListGetDetailDto;

    component['prefillFromApi'](dto);

    expect(component.listRow).toEqual({
      id: 'list-123',
      date: '2026-03-01',
      time: '09:30',
      location: 'Bristol',
      description: 'Morning list',
      entries: 4,
      status: 'OPEN',
      deletable: true,
      etag: '"etag-v2"',
      rowVersion: '7',
    });
    expect(component.entryCount).toBe(4);
  });

  describe('onResultButtonClick', () => {
    it('navigates to result-selected with selected  applications', () => {
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigate');

      patchDetailState({
        selectedRows: [
          {
            sequenceNumber: 1,
            applicant: 'A',
            respondent: 'R',
            title: 'T1',
            resulted: 'Yes',
          },
          {
            sequenceNumber: 2,
            applicant: 'B',
            respondent: 'S',
            title: 'T2',
            resulted: 'No',
          },
        ],
      });

      component.onResultButtonClick();

      expect(navSpy).toHaveBeenCalledTimes(1);

      expect(navSpy).toHaveBeenCalledWith(
        ['result-selected'],
        expect.objectContaining({
          state: {
            resultingApplications: [
              {
                sequenceNumber: 1,
                applicant: 'A',
                respondent: 'R',
                title: 'T1',
              },
              {
                sequenceNumber: 2,
                applicant: 'B',
                respondent: 'S',
                title: 'T2',
              },
            ],
          },
        }),
      );
    });
  });

  it('can patch place fields state (sanity)', async () => {
    patchPlaceFieldsState({
      cjaSearch: 'ABC - Something',
      cja: [{ code: 'DEF' } as CriminalJusticeAreaGetDto],
    });
    await flushSignalEffects(fixture);

    // no assertion required; just ensures accessor doesn’t break
    expect(true).toBe(true);
  });
});
