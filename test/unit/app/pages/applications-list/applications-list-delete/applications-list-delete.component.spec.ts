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
import { of, throwError } from 'rxjs';

import { ApplicationsListDeleteComponent } from '@components/applications-list/applications-list-delete/applications-list-delete.component';
import { IF_MATCH, ROW_VERSION } from '@context/concurrency-context';
import { ApplicationListStatus, ApplicationListsApi } from '@openapi';
import { ApplicationListRow } from '@util/types/application-list/types';

describe('ApplicationsListDeleteComponent', () => {
  let fixture: ComponentFixture<ApplicationsListDeleteComponent>;
  let component: ApplicationsListDeleteComponent;

  let api: Pick<ApplicationListsApi, 'deleteApplicationList'>;
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
  }) => {
    const platformId = opts?.platformId ?? 'browser';
    const navStateRow = opts?.navStateRow;
    const routeId = opts?.routeId ?? 'abc-123';

    api = {
      deleteApplicationList: jest.fn(),
    };

    router = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    location = {
      getState: jest.fn().mockReturnValue({ listToDelete: navStateRow }),
    };

    const snapshot = {
      paramMap: convertToParamMap({ id: routeId }),
    } as unknown as ActivatedRouteSnapshot;

    const routeStub: Partial<ActivatedRoute> = { snapshot };

    TestBed.resetTestingModule();

    TestBed.overrideComponent(ApplicationsListDeleteComponent, {
      set: { template: '' },
    });

    await TestBed.configureTestingModule({
      imports: [ApplicationsListDeleteComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: ApplicationListsApi, useValue: api },
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', async () => {
    await setup({ navStateRow: makeRow() });
    expect(component).toBeTruthy();
  });

  it('ngOnInit: when no listToDelete but id exists -> navigates back', async () => {
    await setup({ navStateRow: undefined, routeId: 'abc-123' });
    expect(router.navigate).toHaveBeenCalledWith(['/applications-list']);
  });

  it('ngOnInit: when listToDelete exists -> does not navigate back', async () => {
    await setup({ navStateRow: makeRow(), routeId: 'abc-123' });
    expect(router.navigate).not.toHaveBeenCalledWith(['/applications-list']);
  });

  it('onDelete: when listToDelete is missing -> does nothing', async () => {
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

  it('server platform: listToDelete is undefined even if state exists -> navigates back when id exists', async () => {
    await setup({
      platformId: 'server',
      navStateRow: makeRow(),
      routeId: 'abc-123',
    });

    expect(router.navigate).toHaveBeenCalledWith(['/applications-list']);
  });
});
