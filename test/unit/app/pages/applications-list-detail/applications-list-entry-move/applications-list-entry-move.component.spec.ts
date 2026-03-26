import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { jest } from '@jest/globals';
import { of, throwError } from 'rxjs';

import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import { ApplicationsListEntryMoveComponent } from '@components/applications-list-detail/applications-list-entry-move/applications-list-entry-move.component';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import {
  ApplicationListPage,
  ApplicationListStatus,
  ApplicationListsApi,
} from '@openapi';
import * as buildApplicationsListErrorSummaryModule from '@services/applications-list/build-applications-list-error-summary';
import { DEFAULT_STATE } from '@services/applications-list/searchform/application-list-search-form.service';
import { ApplicationListRow } from '@util/types/application-list/types';

describe('ApplicationsListEntryMoveComponent', () => {
  let component: ApplicationsListEntryMoveComponent;
  let fixture: ComponentFixture<ApplicationsListEntryMoveComponent>;
  let router: Router;

  const routeStub: Partial<ActivatedRoute> = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'source-list-id' }),
    } as ActivatedRoute['snapshot'],
  };

  const entriesToMove: ApplicationEntriesResultContext[] = [
    {
      id: 'entry-1',
      sequenceNumber: '1',
      applicant: 'A Applicant',
      respondent: 'R Respondent',
      title: 'Case title',
    },
  ];

  const pageContent = [
    {
      id: 'target-list-id',
      date: '2026-03-26',
      time: '10:00',
      location: 'Court 1',
      courtName: 'Court 1',
      description: 'Target list',
      entriesCount: 2,
      status: ApplicationListStatus.OPEN,
      version: 4,
    },
  ];

  const applicationListPage: ApplicationListPage = {
    pageNumber: 0,
    pageSize: 10,
    totalElements: pageContent.length,
    totalPages: 2,
    elementsOnPage: pageContent.length,
    content: pageContent,
  };

  const getApplicationListsMock = jest.fn();

  const apiStub: Pick<ApplicationListsApi, 'getApplicationLists'> = {
    getApplicationLists:
      getApplicationListsMock as unknown as ApplicationListsApi['getApplicationLists'],
  };

  const flushSignalEffects = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setHistoryState = (state: unknown): void => {
    globalThis.history.replaceState(state, '', '/');
  };

  const createComponent = async ({
    listId = 'source-list-id',
    historyState = { entriesToMove },
  }: {
    listId?: string;
    historyState?: unknown;
  } = {}): Promise<void> => {
    routeStub.snapshot = {
      ...(routeStub.snapshot as ActivatedRoute['snapshot']),
      paramMap: convertToParamMap(listId ? { id: listId } : {}),
    } as ActivatedRoute['snapshot'];

    setHistoryState(historyState);

    fixture = TestBed.createComponent(ApplicationsListEntryMoveComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    getApplicationListsMock.mockReset();
    getApplicationListsMock.mockReturnValue(of(applicationListPage));

    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryMoveComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: ApplicationListsApi, useValue: apiStub },
      ],
    }).compileComponents();

    await createComponent();
  });

  afterEach(() => {
    setHistoryState({});
    jest.clearAllMocks();
  });

  it('creates with move state from the route and browser history', () => {
    expect(component).toBeTruthy();
    expect(component.createListState).toEqual({
      createMoveTargetList: true,
      originalListId: 'source-list-id',
      entriesToMove,
    });
    expect(component.form.getRawValue().status).toBe('open');
    expect(component.storedRecordsVm().submitted).toBe(false);
  });

  it('redirects back when the route id is missing', async () => {
    const navigateSpy = jest
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    await createComponent({ listId: '' });

    expect(navigateSpy).toHaveBeenCalledWith(['../'], {
      relativeTo: TestBed.inject(ActivatedRoute),
    });
  });

  it('redirects back when no entries were provided to move', async () => {
    const navigateSpy = jest
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    await createComponent({ historyState: {} });

    expect(navigateSpy).toHaveBeenCalledWith(['../'], {
      relativeTo: TestBed.inject(ActivatedRoute),
    });
  });

  it('shows an invalid search criteria error when all search fields are empty', () => {
    const preventDefault = jest.fn();
    const event = { preventDefault } as unknown as SubmitEvent;
    component.form.patchValue({ status: null });

    component.onSearch(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(getApplicationListsMock).not.toHaveBeenCalled();
    expect(component.vm().searchErrors).toEqual([
      {
        id: '',
        text: APPLICATIONS_LIST_ERROR_MESSAGES.invalidSearchCriteria,
      },
    ]);
  });

  it('stores validation errors and stops before loading when the form summary is invalid', () => {
    const event = { preventDefault: jest.fn() } as unknown as SubmitEvent;
    jest
      .spyOn(
        buildApplicationsListErrorSummaryModule,
        'buildApplicationsListErrorSummary',
      )
      .mockReturnValueOnce([{ id: 'date', text: 'Enter a valid date' }]);

    component.onSearch(event);

    expect(getApplicationListsMock).not.toHaveBeenCalled();
    expect(component.storedRecordsVm().submitted).toBe(true);
    expect(component.vm().searchErrors).toEqual([
      { id: 'date', text: 'Enter a valid date' },
    ]);
  });

  it('loads application lists and stores the results for a valid search', async () => {
    component.form.patchValue({ description: 'Target' });
    const event = { preventDefault: jest.fn() } as unknown as SubmitEvent;

    component.onSearch(event);
    await flushSignalEffects();

    expect(getApplicationListsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pageNumber: 0,
        pageSize: 10,
        sort: ['date,desc'],
      }),
      undefined,
      undefined,
      { transferCache: true },
    );
    expect(component.vm().searchDone).toBe(true);
    expect(component.vm().searchErrors).toEqual([]);
    expect(component.storedRecordsVm().submitted).toBe(true);
    expect(component.storedRecordsVm().totalPages).toBe(2);
    expect(component.storedRecordsVm().rows).toEqual([
      {
        id: 'target-list-id',
        date: '2026-03-26',
        time: '10:00',
        location: 'Court 1',
        description: 'Target list',
        entries: 2,
        status: ApplicationListStatus.OPEN,
        deletable: true,
        etag: null,
        rowVersion: '4',
      },
    ]);
    expect(component.searchFormState().description).toBe('Target');
  });

  it('stores API errors for a failed search', async () => {
    getApplicationListsMock.mockReturnValueOnce(
      throwError(
        () => new HttpErrorResponse({ status: 500, statusText: 'boom' }),
      ),
    );
    component.form.patchValue({ description: 'Target' });
    const event = { preventDefault: jest.fn() } as unknown as SubmitEvent;

    component.onSearch(event);
    await flushSignalEffects();

    expect(component.vm().searchDone).toBe(true);
    expect(component.vm().searchErrors).toEqual([
      {
        id: 'search',
        text: 'Http failure response for (unknown url): 500 boom',
      },
    ]);
    expect(component.storedRecordsVm().submitted).toBe(true);
    expect(component.storedRecordsVm().rows).toEqual([]);
    expect(component.storedRecordsVm().totalPages).toBe(0);
  });

  it('navigates to move confirm with selected target list state', () => {
    const navigateSpy = jest
      .spyOn(router, 'navigate')
      .mockResolvedValue(true as never);
    const targetList: ApplicationListRow = {
      id: 'target-list-id',
      date: '2026-03-26',
      time: '10:00',
      location: 'Court 1',
      description: 'Target list',
      entries: 2,
      status: ApplicationListStatus.OPEN,
      deletable: true,
      etag: null,
      rowVersion: null,
    };

    component.onSelect(targetList);

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/applications-list', 'source-list-id', 'move', 'confirm'],
      {
        state: {
          entriesToMove,
          targetList,
        },
      },
    );
  });

  it('does not navigate when the target list selection is incomplete', () => {
    const navigateSpy = jest
      .spyOn(router, 'navigate')
      .mockResolvedValue(true as never);

    component.onSelect({
      id: '',
      date: '2026-03-26',
      time: '10:00',
      location: 'Court 1',
      description: 'Target list',
      entries: 2,
      status: ApplicationListStatus.OPEN,
      deletable: true,
      etag: null,
      rowVersion: null,
    });

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('maps known sort keys and preserves unknown ones', () => {
    component.onSortChange({ key: 'entries', direction: 'asc' });

    expect(component.vm().sortField).toEqual({
      key: 'entriesCount',
      direction: 'asc',
    });

    component.onSortChange({ key: 'customSort', direction: 'desc' });

    expect(component.vm().sortField).toEqual({
      key: 'customSort',
      direction: 'desc',
    });
  });

  it('loads the selected page of results', async () => {
    component.form.patchValue({ description: 'Target' });

    component.onPageChange(3);
    await flushSignalEffects();

    expect(component.storedRecordsVm().currentPage).toBe(3);
    expect(getApplicationListsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pageNumber: 3,
        pageSize: 10,
      }),
      undefined,
      undefined,
      { transferCache: true },
    );
  });

  it('returns field errors from search state', () => {
    const error = { id: 'search', text: 'Problem' };
    (
      component as unknown as {
        moveEntryPatch: (patch: { searchErrors: (typeof error)[] }) => void;
      }
    ).moveEntryPatch({
      searchErrors: [error],
    });

    expect(component.fieldError('search')).toEqual(error);
    expect(component.fieldError('missing')).toBeUndefined();
  });

  it('toggles advanced search state', () => {
    expect(component.searchFormState().isAdvancedSearch).toBe(false);

    component.toggleAdvancedSearch();
    expect(component.searchFormState().isAdvancedSearch).toBe(true);

    component.toggleAdvancedSearch();
    expect(component.searchFormState().isAdvancedSearch).toBe(false);
  });

  it('clears search state, form state, and place search values', () => {
    (
      component as unknown as {
        moveEntryPatch: (patch: {
          searchErrors: { id: string; text: string }[];
        }) => void;
      }
    ).moveEntryPatch({
      searchErrors: [{ id: 'search', text: 'Problem' }],
    });
    component.form.patchValue({
      description: 'Target',
      status: 'closed',
      court: 'CRT',
      location: 'Other',
      cja: 'CJA',
    });
    component.toggleAdvancedSearch();
    component.setCjaSearch('CJA');
    component.setCourthouseSearch('Court');
    (
      component as unknown as {
        patch: (patch: {
          filteredCja: { code: string; description: string }[];
          filteredCourthouses: { locationCode: string; name: string }[];
        }) => void;
      }
    ).patch({
      filteredCja: [{ code: 'CJA', description: 'Area' }],
      filteredCourthouses: [{ locationCode: 'CRT', name: 'Court' }],
    });

    component.clearSearch();

    expect(component.vm().searchErrors).toEqual([]);
    expect(component.storedRecordsVm().submitted).toBe(false);
    expect(component.storedRecordsVm().rows).toEqual([]);
    expect(component.form.getRawValue()).toEqual({
      date: null,
      time: null,
      description: '',
      status: null,
      court: '',
      location: '',
      cja: '',
    });
    expect(component.searchFormState()).toEqual(DEFAULT_STATE);
    expect(
      (
        component as unknown as {
          state: () => {
            cjaSearch: string;
            courthouseSearch: string;
            filteredCja: unknown[];
            filteredCourthouses: unknown[];
          };
        }
      ).state(),
    ).toMatchObject({
      cjaSearch: '',
      courthouseSearch: '',
      filteredCja: [],
      filteredCourthouses: [],
    });
  });
});
