import { Location } from '@angular/common';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
  convertToParamMap,
} from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApplicationsListCloseComponent } from '@components/applications-list-detail/applications-list-close/applications-list-close.component';
import { HeaderService } from '@core/services/header.service';
import { ApplicationListStatus, ApplicationListsApi } from '@openapi';
import { AppListNavState } from '@shared-types/applications-list/applications-list-form';
import { ApplicationListRow } from '@util/types/application-list/types';

describe('ApplicationsListCloseComponent', () => {
  let fixture: ComponentFixture<ApplicationsListCloseComponent>;
  let component: ApplicationsListCloseComponent;

  let router: Pick<Router, 'navigate'>;
  let location: Pick<Location, 'getState'>;
  let appListsApi: Pick<ApplicationListsApi, 'updateApplicationList'>;

  const makeRow = (
    overrides: Partial<ApplicationListRow> = {},
  ): ApplicationListRow => ({
    id: 'list-123',
    date: '2026-02-10',
    time: '10:30',
    location: 'ABC',
    description: 'test',
    status: ApplicationListStatus.OPEN,
    entries: 3,
    deletable: false,
    etag: 'W/"123"',
    rowVersion: '1',
    ...overrides,
  });

  const closeState: AppListNavState = {
    listRow: makeRow(),
    closeRequest: {
      id: 'list-123',
      etag: 'W/"123"',
      payload: {
        date: '2026-02-10',
        time: '10:30',
        description: 'test',
        status: ApplicationListStatus.CLOSED,
        courtLocationCode: 'ABC',
      },
    },
  };

  const setup = async (opts?: {
    routeId?: string | null;
    navState: AppListNavState | undefined;
  }) => {
    router = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    location = {
      getState: jest.fn().mockReturnValue(opts?.navState),
    };

    appListsApi = {
      updateApplicationList: jest
        .fn()
        .mockReturnValue(of(new HttpResponse({ status: 200 }))),
    };

    const routeSnapshot = {
      paramMap: convertToParamMap(opts?.routeId ? { id: opts.routeId } : {}),
    } as unknown as ActivatedRouteSnapshot;

    const routeStub: Partial<ActivatedRoute> = {
      snapshot: routeSnapshot,
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationsListCloseComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Location, useValue: location },
        { provide: ApplicationListsApi, useValue: appListsApi },
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: HeaderService,
          useValue: {
            hideNavigation: jest.fn(),
            showNavigation: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListCloseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', async () => {
    await setup({ routeId: 'list-123', navState: closeState });
    expect(component).toBeTruthy();
  });

  it('ngOnInit: with no id in route, redirects back to applications list', async () => {
    await setup({ routeId: null, navState: closeState });

    expect(router.navigate).toHaveBeenCalledWith(['/applications-list']);
  });

  it('ngOnInit: with no close request in state, goes back to applications list', async () => {
    await setup({ routeId: 'list-123', navState: undefined });

    expect(router.navigate).toHaveBeenCalledWith(['/applications-list']);
  });

  it('goBack navigates to list detail route', async () => {
    await setup({ routeId: 'list-123', navState: closeState });

    (router.navigate as jest.Mock).mockClear();
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-123'],
      { state: { row: closeState.listRow }, fragment: 'list-details' },
    );
  });

  it('renders expected close warning message', async () => {
    await setup({ routeId: 'list-123', navState: closeState });

    const warningText = fixture.nativeElement.querySelector(
      '.moj-alert__content',
    ) as HTMLElement;

    expect(warningText?.textContent?.replaceAll(/\s+/g, ' ').trim()).toBe(
      'This action will close the list, and no further updates to the applications will be allowed',
    );
  });

  it('clicking continue sends close update and navigates to home page on success', async () => {
    await setup({ routeId: 'list-123', navState: closeState });

    const continueButton = fixture.nativeElement.querySelector(
      'button.govuk-button',
    ) as HTMLButtonElement;

    continueButton.click();

    expect(appListsApi.updateApplicationList).toHaveBeenCalledTimes(1);
    expect(
      (appListsApi.updateApplicationList as jest.Mock).mock.calls[0][0],
    ).toEqual({
      listId: 'list-123',
      applicationListUpdateDto: closeState.closeRequest?.payload,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/applications-list'], {
      queryParams: { isCloseSuccess: true },
    });
  });

  it('clicking continue navigates with close=error query on api error', async () => {
    await setup({ routeId: 'list-123', navState: closeState });

    (appListsApi.updateApplicationList as jest.Mock).mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 412 })),
    );

    const continueButton = fixture.nativeElement.querySelector(
      'button.govuk-button',
    ) as HTMLButtonElement;

    continueButton.click();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-123'],
      {
        queryParams: { close: 'error', code: 412 },
        state: { row: closeState.listRow, closeError: undefined },
        fragment: 'list-details',
      },
    );
  });

  it('clicking continue passes 400 problem details back to the detail page', async () => {
    await setup({ routeId: 'list-123', navState: closeState });

    (appListsApi.updateApplicationList as jest.Mock).mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              status: 400,
              title: 'List cannot be closed',
              detail:
                'All applications must have a Paid or Remitted Fee status.',
            },
          }),
      ),
    );

    const continueButton = fixture.nativeElement.querySelector(
      'button.govuk-button',
    ) as HTMLButtonElement;

    continueButton.click();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-123'],
      {
        queryParams: { close: 'error', code: 400 },
        state: {
          row: closeState.listRow,
          closeError: {
            status: 400,
            title: 'List cannot be closed',
            detail: 'All applications must have a Paid or Remitted Fee status.',
          },
        },
        fragment: 'list-details',
      },
    );
  });
});
