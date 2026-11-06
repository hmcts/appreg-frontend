import { Location } from '@angular/common';
import {
  HttpContext,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
  convertToParamMap,
} from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { ApplicationsListDeleteComponent } from '@components/applications-list/applications-list-delete/applications-list-delete.component';
import { IF_MATCH, ROW_VERSION } from '@context/concurrency-context';
import {
  ApplicationListEntriesApi,
  ApplicationListStatus,
  ApplicationListsApi,
  EntryPage1,
} from '@openapi';
import { ApplicationListRow } from '@util/types/application-list/types';

describe('ApplicationsListDeleteComponent', () => {
  let fixture: ComponentFixture<ApplicationsListDeleteComponent>;
  let component: ApplicationsListDeleteComponent;

  let api: Pick<ApplicationListsApi, 'deleteApplicationList'>;
  let entriesApi: Pick<ApplicationListEntriesApi, 'getApplicationListEntries'>;
  let router: Pick<Router, 'navigate'>;
  let location: Pick<Location, 'getState'>;

  const makeRow = (
    overrides: Partial<ApplicationListRow> = {},
  ): ApplicationListRow => ({
    id: 'abc-123',
    date: '2025-10-01',
    time: '09:30',
    location: 'X',
    description: 'Y',
    status: ApplicationListStatus.OPEN,
    entries: 0,
    deletable: true,
    etag: 'W/"etag-val"',
    rowVersion: '42',
    ...overrides,
  });

  const setup = async (opts?: {
    platformId?: 'browser' | 'server';
    navStateRow?: ApplicationListRow | undefined;
    routeId?: string | null;
    entriesResponse?: (pageNumber: number) => Observable<EntryPage1>;
    realTemplate?: boolean;
  }) => {
    const platformId = opts?.platformId ?? 'browser';
    const navStateRow = opts?.navStateRow;
    const routeId = opts?.routeId ?? 'abc-123';

    api = {
      deleteApplicationList: jest.fn(),
    };
    entriesApi = {
      getApplicationListEntries: jest.fn(
        ({ pageNumber }) =>
          opts?.entriesResponse?.(pageNumber ?? 0) ?? of(makePage()),
      ),
    };

    router = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    location = {
      getState: jest.fn().mockReturnValue({
        listRow: navStateRow,
      }),
    };

    const snapshot = {
      paramMap: convertToParamMap({ id: routeId }),
    } as unknown as ActivatedRouteSnapshot;

    const routeStub: Partial<ActivatedRoute> = { snapshot };

    TestBed.resetTestingModule();

    if (!opts?.realTemplate) {
      TestBed.overrideComponent(ApplicationsListDeleteComponent, {
        set: { template: '' },
      });
    }

    await TestBed.configureTestingModule({
      imports: [ApplicationsListDeleteComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: ApplicationListsApi, useValue: api },
        { provide: ApplicationListEntriesApi, useValue: entriesApi },
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const makePage = (
    ids: string[] = [],
    pageNumber = 0,
    totalElements = ids.length,
  ): EntryPage1 => ({
    pageNumber,
    pageSize: 1,
    totalElements,
    elementsOnPage: ids.length,
    content: ids.map((id) => ({
      id,
      applicationTitle: 'Synthetic application',
      isFeeRequired: false,
      isResulted: false,
      status: ApplicationListStatus.OPEN,
    })),
  });

  it('renders parent details and every child across pages with missing-value fallbacks', async () => {
    await setup({
      navStateRow: makeRow({ entries: 99 }),
      realTemplate: true,
      entriesResponse: (page) => {
        const response = makePage([`entry-${page}`], page, 2);
        if (page === 0) {
          response.content[0] = {
            ...response.content[0],
            sequenceNumber: 7,
            accountNumber: 'SYNTHETIC-ACCOUNT',
            applicationTitle: 'Synthetic title',
            applicant: {
              organisation: {
                name: 'Synthetic organisation',
                contactDetails: { addressLine1: 'Synthetic test address' },
              },
            },
            respondent: {
              person: {
                name: { firstName: 'Synthetic', lastName: 'Respondent' },
                contactDetails: { addressLine1: 'Synthetic test address' },
              },
            },
          };
        }
        return of(response);
      },
    });
    const root = fixture.nativeElement as HTMLElement;
    const values = (element: Element) =>
      Array.from(element.querySelectorAll('dd'), (cell) =>
        cell.textContent?.trim(),
      );
    expect(root.querySelector('h1')?.textContent).toContain(
      'Check the application list and entries before deleting',
    );
    expect(values(root.querySelector('dl')!)).toEqual([
      expect.any(String),
      '09:30',
      'X',
      'Y',
      'OPEN',
    ]);
    expect(
      root
        .querySelector('[role="status"]')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim(),
    ).toBe('2 application list entries will be deleted.');
    const cards = root.querySelectorAll('.govuk-summary-card');
    expect(cards).toHaveLength(2);
    expect(values(cards[0])).toEqual([
      '7',
      'SYNTHETIC-ACCOUNT',
      'Synthetic organisation',
      'Synthetic Respondent',
      'Synthetic title',
    ]);
    expect(values(cards[1])).toEqual([
      'Not provided',
      'Not provided',
      'Not provided',
      'Not provided',
      'Synthetic application',
    ]);
    expect(root.querySelector('.govuk-summary-list__actions')).toBeNull();
    expect(api.deleteApplicationList).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'cancels the rendered review with fromListDetails=%s without deleting',
    async (fromListDetails) => {
      await setup({ navStateRow: makeRow(), realTemplate: true });
      component.isFromListDetails = fromListDetails;
      fixture.nativeElement
        .querySelector('app-review-confirm .govuk-button-group a')
        .click();
      expect(router.navigate).toHaveBeenCalledWith(
        ...(fromListDetails
          ? [['/applications-list', 'abc-123'], { fragment: 'list-details' }]
          : [['/applications-list']]),
      );
      expect(api.deleteApplicationList).not.toHaveBeenCalled();
    },
  );

  it('loads every unfiltered page in sequence order, independent of the parent entry count', async () => {
    await setup({
      navStateRow: makeRow(),
      entriesResponse: (page) => of(makePage([`entry-${page}`], page, 2)),
    });

    expect(component.childEntries().map((entry) => entry.id)).toEqual([
      'entry-0',
      'entry-1',
    ]);
    expect(component.entriesLoaded()).toBe(true);
    expect(entriesApi.getApplicationListEntries).toHaveBeenCalledTimes(2);
    for (const pageNumber of [0, 1]) {
      expect(entriesApi.getApplicationListEntries).toHaveBeenNthCalledWith(
        pageNumber + 1,
        {
          listId: 'abc-123',
          pageNumber,
          pageSize: 100,
          sort: ['sequenceNumber,asc'],
        },
        'body',
        false,
        { transferCache: false },
      );
    }
  });

  it.each([0, 1])(
    'blocks deletion after page %i fails, then allows retry of an empty list',
    async (failingPage) => {
      const pending = new Subject<EntryPage1>();
      await setup({
        navStateRow: makeRow(),
        realTemplate: true,
        entriesResponse: (page) =>
          page === failingPage ? pending : of(makePage(['entry-0'], 0, 2)),
      });
      const confirm = () =>
        fixture.nativeElement.querySelector(
          'app-review-confirm .govuk-button--warning',
        ) as HTMLButtonElement;
      expect(confirm().disabled).toBe(true);
      expect(fixture.nativeElement.textContent).toContain(
        'Loading application list entries',
      );
      component.onDelete();
      expect(api.deleteApplicationList).not.toHaveBeenCalled();

      pending.error(new HttpErrorResponse({ status: 500 }));
      fixture.detectChanges();
      expect(component.childEntries()).toEqual([]);
      expect(component.entriesLoaded()).toBe(false);
      expect(
        fixture.nativeElement.querySelector('.govuk-summary-card'),
      ).toBeNull();
      expect(confirm().disabled).toBe(true);
      expect(
        fixture.nativeElement.querySelector('.govuk-error-summary').textContent,
      ).toContain('Could not load all');
      component.onDelete();
      expect(api.deleteApplicationList).not.toHaveBeenCalled();

      (entriesApi.getApplicationListEntries as jest.Mock).mockReturnValue(
        of(makePage()),
      );
      fixture.nativeElement.querySelector('#retry-entries').click();
      fixture.detectChanges();
      expect(confirm().disabled).toBe(false);
      expect(component.entriesLoadError()).toBe(false);
      expect(fixture.nativeElement.textContent).toContain(
        'This application list has no entries.',
      );
      (api.deleteApplicationList as jest.Mock).mockReturnValue(
        of(new HttpResponse({ status: 204 })),
      );
      confirm().click();
      expect(api.deleteApplicationList).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['duplicate', 'truncated', 'changed total'])(
    'blocks deletion for %s results',
    async (problem) => {
      await setup({
        navStateRow: makeRow(),
        entriesResponse: (page) =>
          of(
            makePage(
              problem === 'truncated'
                ? []
                : [problem === 'duplicate' ? 'same-entry' : `entry-${page}`],
              page,
              problem === 'changed total' && page === 1 ? 3 : 2,
            ),
          ),
      });
      expect(component.entriesLoadError()).toBe(true);
      expect(component.childEntries()).toEqual([]);
      component.onDelete();
      expect(api.deleteApplicationList).not.toHaveBeenCalled();
    },
  );

  it('should create', async () => {
    await setup({ navStateRow: makeRow() });
    expect(component).toBeTruthy();
  });

  it('ngOnInit: when no listRow but id exists -> navigates back', async () => {
    await setup({ navStateRow: undefined, routeId: 'abc-123' });
    expect(router.navigate).toHaveBeenCalledWith(['/applications-list']);
    expect(entriesApi.getApplicationListEntries).not.toHaveBeenCalled();
  });

  it('rejects navigation state for a different list', async () => {
    await setup({ navStateRow: makeRow({ id: 'other-list' }) });
    expect(entriesApi.getApplicationListEntries).not.toHaveBeenCalled();
    component.onDelete();
    expect(api.deleteApplicationList).not.toHaveBeenCalled();
  });

  it('prevents repeated deletion and reload while deleting', async () => {
    await setup({
      navStateRow: makeRow(),
      realTemplate: true,
      entriesResponse: () => of(makePage(['entry-0'])),
    });
    (api.deleteApplicationList as jest.Mock).mockReturnValue(new Subject());
    expect(
      fixture.nativeElement
        .querySelector('[role="status"]')
        .textContent.replace(/\s+/g, ' ')
        .trim(),
    ).toBe('1 application list entry will be deleted.');
    const confirm = fixture.nativeElement.querySelector(
      '.govuk-button--warning',
    ) as HTMLButtonElement;
    confirm.click();
    fixture.detectChanges();
    expect(confirm.disabled).toBe(true);
    confirm.click();
    component.onDelete();
    component.loadChildEntries();
    expect(api.deleteApplicationList).toHaveBeenCalledTimes(1);
    expect(entriesApi.getApplicationListEntries).toHaveBeenCalledTimes(1);
  });

  it('ngOnInit: when listRow exists -> does not navigate back', async () => {
    await setup({ navStateRow: makeRow(), routeId: 'abc-123' });
    expect(router.navigate).not.toHaveBeenCalledWith(['/applications-list']);
  });

  it('onDelete: when listRow is missing -> does nothing', async () => {
    await setup({ navStateRow: undefined });

    component.onDelete();

    expect(api.deleteApplicationList).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalledWith(
      ['/applications-list'],
      expect.objectContaining({ queryParams: expect.anything() }),
    );
  });

  it('onDelete: success -> passes HttpContext tokens and navigates with delete=success', async () => {
    const row = makeRow({ etag: 'W/"etag-val"', rowVersion: '42' });
    await setup({ navStateRow: row });

    let capturedOptions: { context?: HttpContext } | undefined;

    (api.deleteApplicationList as jest.Mock).mockImplementation(
      (
        _params: unknown,
        _observe: unknown,
        _reportProgress: unknown,
        options?: { context?: HttpContext },
      ) => {
        capturedOptions = options;
        return of(new HttpResponse({ status: 204 }));
      },
    );

    component.onDelete();

    expect(api.deleteApplicationList).toHaveBeenCalledTimes(1);

    // First call arg should include listId
    expect((api.deleteApplicationList as jest.Mock).mock.calls[0][0]).toEqual({
      listId: 'abc-123',
    });

    // Concurrency tokens set in HttpContext
    expect(capturedOptions?.context?.get(IF_MATCH)).toBe('W/"etag-val"');
    expect(capturedOptions?.context?.get(ROW_VERSION)).toBe('42');

    expect(router.navigate).toHaveBeenCalledWith(['/applications-list'], {
      queryParams: { delete: 'success' },
    });
  });

  it('onDelete: HttpErrorResponse -> navigates with delete=error and code=status', async () => {
    await setup({ navStateRow: makeRow() });

    (api.deleteApplicationList as jest.Mock).mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 412 })),
    );

    component.onDelete();

    expect(router.navigate).toHaveBeenCalledWith(['/applications-list'], {
      queryParams: { delete: 'error', code: 412 },
    });
  });

  it('onDelete: non-HttpErrorResponse -> navigates with code=500', async () => {
    await setup({ navStateRow: makeRow() });

    (api.deleteApplicationList as jest.Mock).mockReturnValueOnce(
      throwError(() => new Error('boom')),
    );

    component.onDelete();

    expect(router.navigate).toHaveBeenCalledWith(['/applications-list'], {
      queryParams: { delete: 'error', code: 500 },
    });
  });

  it('goBack: navigates to /applications-list', async () => {
    await setup({ navStateRow: makeRow() });

    (router.navigate as jest.Mock).mockClear();
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/applications-list']);
  });

  it('goBack: when opened from list details, returns to the list detail page', async () => {
    await setup({ navStateRow: makeRow() });
    component.isFromListDetails = true;

    (router.navigate as jest.Mock).mockClear();
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/applications-list', 'abc-123'],
      { fragment: 'list-details' },
    );
  });

  it('server platform: listRow is undefined even if state exists -> navigates back when id exists', async () => {
    await setup({
      platformId: 'server',
      navStateRow: makeRow(),
      routeId: 'abc-123',
    });

    expect(router.navigate).toHaveBeenCalledWith(['/applications-list']);
    expect(entriesApi.getApplicationListEntries).not.toHaveBeenCalled();
  });
});
