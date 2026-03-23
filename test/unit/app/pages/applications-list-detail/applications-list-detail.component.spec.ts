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
import { ApplicationsListDetailState } from '@components/applications-list-detail/util/applications-list-detail.state';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListGetDetailDto,
  ApplicationListsApi,
  CriminalJusticeAreaGetDto,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { MojButtonMenu } from '@util/moj-button-menu';

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

describe('ApplicationsListDetail', () => {
  let fixture: ComponentFixture<ApplicationsListDetail>;
  let component: ApplicationsListDetail;

  const apiStub: jest.Mocked<
    Pick<ApplicationListsApi, 'getApplicationList' | 'updateApplicationList'>
  > = {
    getApplicationList: jest.fn(),
    updateApplicationList: jest.fn(),
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

    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ApplicationListsApi, useValue: apiStub },
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
    component.loadApplicationsLists();
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
      .spyOn(component, 'loadApplicationsLists')
      .mockImplementation(() => undefined);

    patchDetailState({ selectedIds: new Set(['a', 'b']) });

    component.onPageChange(3);

    expect(vm().currentPage).toBe(3);
    expect(vm().selectedIds.size).toBe(0);
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

  describe('loadApplicationsLists', () => {
    it('calls API with listId, page (0-based), size; patches rows, clears errors, updates selection', async () => {
      component.id = 'list-123';

      patchDetailState({
        currentPage: 1,
        pageSize: 10,
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

      component.loadApplicationsLists();
      await flushSignalEffects(fixture);

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
          postCode: null,
          title: 'Land Registry Appeal',
          feeReq: 'Yes',
          resulted: 'No',
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

      component.loadApplicationsLists();
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
    it('sets errorSummary message and does not navigate when all selected are resulted (plural)', () => {
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
            resulted: 'Yes',
          },
        ],
      });

      component.onResultButtonClick();

      expect(vm().errorSummary).toHaveLength(1);
      expect(vm().errorSummary[0].text).toBe(
        'These applications have already been resulted.',
      );
      expect(navSpy).not.toHaveBeenCalled();
    });

    it('sets errorSummary message and does not navigate when all selected are resulted (singular)', () => {
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
        ],
      });

      component.onResultButtonClick();

      expect(vm().errorSummary).toHaveLength(1);
      expect(vm().errorSummary[0].text).toBe(
        'This application has already been resulted.',
      );
      expect(navSpy).not.toHaveBeenCalled();
    });

    it('navigates with mixedResultedAndUnresultedApplications = true for mixed selection', () => {
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
                sequenceNumber: 2,
                applicant: 'B',
                respondent: 'S',
                title: 'T2',
              },
            ],
            mixedResultedAndUnresultedApplications: true,
          },
        }),
      );
    });

    it('navigates with mixedResultedAndUnresultedApplications = false when all unresulted', () => {
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigate');

      patchDetailState({
        selectedRows: [
          {
            sequenceNumber: 10,
            applicant: 'X',
            respondent: 'Y',
            title: 'Alpha',
            resulted: 'No',
          },
          {
            sequenceNumber: 11,
            applicant: 'Z',
            respondent: 'W',
            title: 'Beta',
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
                sequenceNumber: 10,
                applicant: 'X',
                respondent: 'Y',
                title: 'Alpha',
              },
              {
                sequenceNumber: 11,
                applicant: 'Z',
                respondent: 'W',
                title: 'Beta',
              },
            ],
            mixedResultedAndUnresultedApplications: false,
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
