import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';

import { ApplicationsListDetail } from '../../../../../src/app/pages/applications-list-detail/applications-list-detail';
import { MojButtonMenu } from '../../../../../src/app/shared/util/moj-button-menu';
import { ApplicationListsApi } from '../../../../../src/generated/openapi';

/** Minimal typed shape of the API response our component uses */
interface ApplicationListItemDto {
  uuid: string;
  sequenceNumber: number;
  accountNumber: string | null | undefined;
  applicant: string | null | undefined;
  respondent: string | null | undefined;
  postCode: string | null | undefined;
  applicationTitle: string;
  feeRequired: boolean;
  result: boolean;
}

interface ApplicationListResponse {
  body: {
    version: number;
    entriesCount: number;
    entriesSummary: ApplicationListItemDto[];
  };
  headers: { get: (h: string) => string | null };
}

/** Strongly-typed stub for the generated API */
type ApiStub = {
  getApplicationList: jest.Mock<
    Observable<ApplicationListResponse>,
    [
      { listId: string; page: number; size: number },
      'response',
      boolean,
      { transferCache: boolean },
    ]
  >;
};

describe('ApplicationsListDetail', () => {
  let fixture: ComponentFixture<ApplicationsListDetail>;
  let component: ApplicationsListDetail;
  let stateSpy: jest.SpyInstance;

  // Shared stubs
  const apiStub: ApiStub = {
    getApplicationList: jest.fn() as ApiStub['getApplicationList'],
  };

  const menuStub: { initAll: (root: Document | HTMLElement) => void } = {
    initAll: jest.fn(),
  };

  beforeEach(async () => {
    const row = {
      id: 'id-1',
      location: 'LOC1',
      description: '',
      status: 'OPEN' as const,
    };
    stateSpy = jest
      .spyOn(globalThis.history, 'state', 'get')
      .mockReturnValue({ row });

    const defaultResponse: ApplicationListResponse = {
      body: { version: 1, entriesCount: 0, entriesSummary: [] },
      headers: { get: (h: string) => (h === 'ETag' ? '"etag-v1"' : null) },
    };
    apiStub.getApplicationList.mockReturnValue(of(defaultResponse));

    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApplicationListsApi, useValue: apiStub },
        { provide: MojButtonMenu, useValue: menuStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    stateSpy?.mockRestore();
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

  it('shows success banner when updateDone is true', () => {
    component.updateDone = true;
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('app-success-banner')),
    ).toBeTruthy();
  });

  it('shows error summary when unpopulated fields exist', () => {
    component.unpopField = [{ href: '#x', text: 'Error' }];
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('app-error-summary')),
    ).toBeTruthy();
  });

  it('submits form and calls onUpdate', () => {
    const spy = jest.spyOn(component, 'onUpdate');
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(spy).toHaveBeenCalled();
  });

  it('disables Court suggestions when Other location or CJA is filled', () => {
    component.form.get('location')?.setValue('Town Hall');
    fixture.detectChanges();
    const courts = fixture.debugElement.queryAll(By.css('app-suggestions'));
    const courtSug = courts[0];
    if (courtSug?.componentInstance) {
      expect(courtSug.componentInstance.disabled).toBe(true);
    }
  });

  it('disables CJA suggestions when Court is chosen or courthouseSearch has text', () => {
    component.form.get('court')?.setValue('LOC123');
    fixture.detectChanges();
    const suggestions = fixture.debugElement.queryAll(
      By.css('app-suggestions'),
    );
    const cjaSug = suggestions[1];
    if (cjaSug?.componentInstance) {
      expect(cjaSug.componentInstance.disabled).toBe(true);
    }

    component.form.get('court')?.setValue('LOC123');
    fixture.detectChanges();
    expect(component.form.get('location')?.disabled).toBe(true);
    const otherLoc = fixture.debugElement.query(
      By.css('app-text-input[formControlName="location"]'),
    );
    if (otherLoc?.componentInstance) {
      expect(otherLoc.componentInstance.disabled).toBe(true);
    }
  });

  it('disables Other location when Court is chosen', () => {
    component.form.get('court')?.setValue('LOC123');
    fixture.detectChanges();
    const otherLoc = fixture.debugElement.query(
      By.css('app-text-input[formControlName="location"]'),
    );
    expect(component.form.get('location')?.disabled).toBe(true);
    if (otherLoc?.componentInstance) {
      expect(otherLoc.componentInstance.disabled).toBe(true);
    }
  });

  it('exposes pagination inputs and handles onPageChange', () => {
    const spy = jest
      .spyOn(component, 'loadApplicationsLists')
      .mockImplementation(() => {});
    component.selectedIds = new Set(['id1', 'id2']);

    component.onPageChange(3);

    expect(component.currentPage).toBe(3);
    expect(component.selectedIds.size).toBe(0);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  describe('noEntries', () => {
    it('is false while loading', () => {
      component.isLoading = true;
      component.updateInvalid = false;
      component.rows = [];
      expect(component.noEntries).toBe(false);
    });

    it('is false when updateInvalid is true', () => {
      component.isLoading = false;
      component.updateInvalid = true;
      component.rows = [];
      expect(component.noEntries).toBe(false);
    });

    it('is true when not loading, not invalid, and no rows', () => {
      component.isLoading = false;
      component.updateInvalid = false;
      component.rows = [];
      expect(component.noEntries).toBe(true);
    });
  });

  describe('loadApplicationsLists', () => {
    it('populates rows, clears errors, updates paging and selection', () => {
      component.id = 'list-123';
      component.pageSize = 10;
      component.currentPage = 1;

      // prove reconciliation removes stale selection
      component.selectedIds = new Set(['stale-id']);

      const successResponse: ApplicationListResponse = {
        body: {
          version: 2,
          entriesCount: 1,
          entriesSummary: [
            {
              uuid: 'abc',
              sequenceNumber: 7,
              accountNumber: '',
              applicant: null,
              respondent: 'Acme',
              postCode: undefined,
              applicationTitle: 'Land Registry Appeal',
              feeRequired: true,
              result: false,
            },
          ],
        },
        headers: { get: (h: string) => (h === 'ETag' ? '"etag-v2"' : null) },
      };

      apiStub.getApplicationList.mockReturnValueOnce(of(successResponse));

      component.loadApplicationsLists();

      expect(apiStub.getApplicationList).toHaveBeenCalledWith(
        { listId: 'list-123', page: 0, size: 10 },
        'response',
        false,
        { transferCache: false },
      );

      expect(component.isLoading).toBe(false);

      expect(component.rows).toEqual([
        {
          id: 'abc',
          sequenceNumber: 7,
          accountNumber: '—',
          applicant: '—',
          respondent: 'Acme',
          postCode: '—',
          title: 'Land Registry Appeal',
          feeReq: 'Yes',
          resulted: 'No',
        },
      ]);

      expect((component as unknown as { version: number }).version).toBe(2);
      expect((component as unknown as { etag: string | null }).etag).toBe(
        '"etag-v2"',
      );
      expect(component.totalPages).toBe(0);

      expect(component.updateInvalid).toBe(false);
      expect(component.errorHint).toBe('');

      expect(component.selectedIds.has('stale-id')).toBe(false);
    });

    it('sets error state on API failure', () => {
      component.id = 'list-123';
      const err = new Error('boom');

      // Emit an error Observable with the right type parameter
      const error$ = new Observable<ApplicationListResponse>((subscriber) => {
        subscriber.error(err);
      });

      apiStub.getApplicationList.mockReturnValueOnce(error$);

      component.selectedIds = new Set(['x', 'y']);
      component.loadApplicationsLists();

      expect(component.updateInvalid).toBe(true);
      expect(component.rows).toEqual([]);
      expect(component.totalPages).toBe(0);
      expect(component.selectedIds.size).toBe(0);
    });
  });

  it('openUpdate: navigates with state & queryParams', async () => {
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.id = 'list-9';
    await component.openUpdate('entry-123');

    expect(navSpy).toHaveBeenCalledWith(
      ['/applications-list', 'entry-123', 'update'],
      { state: { appListId: 'list-9' }, queryParams: { appListId: 'list-9' } },
    );
  });
});
