import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ApplicationsListEntryDeleteComponent } from '@components/applications-list-detail/applications-list-entry-delete/applications-list-entry-delete.component';
import {
  ApplicationListEntriesApi,
  ApplicationListStatus,
  EntryPage1,
} from '@openapi';

describe('ApplicationsListEntryDeleteComponent', () => {
  let component: ApplicationsListEntryDeleteComponent;
  let fixture: ComponentFixture<ApplicationsListEntryDeleteComponent>;

  const routeStub: Partial<ActivatedRoute> = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'list-id', entryId: 'entry-id' }),
    } as ActivatedRoute['snapshot'],
  };

  const locationStub: Pick<Location, 'getState'> = {
    getState: () => ({ row: { id: 'entry-id' } }),
  };

  const routerStub: Pick<Router, 'navigate'> = {
    navigate: jest.fn().mockResolvedValue(true),
  };

  const apiStub: Pick<
    ApplicationListEntriesApi,
    'deleteApplicationListEntry' | 'getApplicationListEntries'
  > = {
    deleteApplicationListEntry: jest.fn(),
    getApplicationListEntries: jest
      .fn()
      .mockReturnValue(throwError(() => new Error('Load failed'))),
  };

  beforeEach(async () => {
    (apiStub.getApplicationListEntries as jest.Mock).mockReturnValue(
      throwError(() => new Error('Load failed')),
    );
    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryDeleteComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Location, useValue: locationStub },
        { provide: Router, useValue: routerStub },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ApplicationListEntriesApi, useValue: apiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListEntryDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the matching entry from a later page without navigation state', () => {
    const response = new Subject<EntryPage1>();
    (apiStub.getApplicationListEntries as jest.Mock).mockImplementation(
      ({ pageNumber }) =>
        pageNumber === 0
          ? of({
              pageNumber: 0,
              pageSize: 1,
              totalElements: 2,
              content: [{ id: 'other-entry' }],
            })
          : response,
    );
    component.entryRow = undefined;
    component.ngOnInit();
    expect(component.loading()).toBe(true);
    (apiStub.deleteApplicationListEntry as jest.Mock).mockClear();
    component.onDelete();
    expect(apiStub.deleteApplicationListEntry).not.toHaveBeenCalled();
    response.next({
      pageNumber: 1,
      pageSize: 1,
      totalElements: 2,
      elementsOnPage: 1,
      content: [
        {
          id: 'entry-id',
          applicationTitle: 'Synthetic application',
          status: ApplicationListStatus.OPEN,
          isFeeRequired: false,
          isResulted: false,
        },
      ],
    });
    response.complete();
    expect(component.entryRow?.id).toBe('entry-id');
    expect(component.entryRow?.title).toBe('Synthetic application');
    expect(component.loading()).toBe(false);
    expect(component.loadError()).toBe(false);
  });

  it.each([
    ['missing', []],
    ['closed', [{ id: 'entry-id', status: ApplicationListStatus.CLOSED }]],
    ['different', [{ id: 'other-entry', status: ApplicationListStatus.OPEN }]],
  ])(
    'blocks deletion for a %s entry and discards mismatched navigation state',
    (_case, content) => {
      (apiStub.getApplicationListEntries as jest.Mock).mockReturnValue(
        of({
          pageNumber: 0,
          pageSize: 100,
          totalElements: content.length,
          content,
        }),
      );
      component.entryRow = { ...component.entryRow!, id: 'stale-entry' };
      component.ngOnInit();
      (apiStub.deleteApplicationListEntry as jest.Mock).mockClear();
      component.onDelete();
      expect(component.entryRow).toBeUndefined();
      expect(component.loadError()).toBe(true);
      expect(apiStub.deleteApplicationListEntry).not.toHaveBeenCalled();
    },
  );

  it('allows retry after a direct entry load fails', () => {
    component.entryRow = undefined;
    component.ngOnInit();
    expect(component.loadError()).toBe(true);
    (apiStub.getApplicationListEntries as jest.Mock).mockReturnValue(
      of({
        pageNumber: 0,
        pageSize: 100,
        totalElements: 1,
        content: [
          {
            id: 'entry-id',
            status: ApplicationListStatus.OPEN,
            applicationTitle: 'Synthetic application',
          },
        ],
      }),
    );
    component.loadEntry();
    expect(component.loadError()).toBe(false);
    expect(component.entryRow?.id).toBe('entry-id');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes listId and entryRow from the route and browser navigation state', () => {
    expect(component.listId).toBe('list-id');
    expect(component.entryRow).toEqual({ id: 'entry-id' });
  });

  it('blocks deletion when the entry cannot be loaded', () => {
    (routerStub.navigate as jest.Mock).mockClear();
    component.entryRow = undefined;

    component.ngOnInit();

    expect(component.loadError()).toBe(true);
    expect(component.entryRow).toBeUndefined();
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('ngOnInit: redirects to applications list when the list id is missing', () => {
    (routerStub.navigate as jest.Mock).mockClear();
    component.listId = null;

    component.ngOnInit();

    expect(routerStub.navigate).toHaveBeenCalledWith(['/applications-list']);
  });

  it('onDelete: navigates back with a success query param when deletion succeeds', () => {
    (apiStub.deleteApplicationListEntry as jest.Mock).mockReturnValue(
      of(undefined),
    );

    component.onDelete();

    expect(apiStub.deleteApplicationListEntry).toHaveBeenCalledWith({
      listId: 'list-id',
      entryId: 'entry-id',
    });
    expect(routerStub.navigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-id'],
      { queryParams: { deleteSuccess: true } },
    );
  });

  it('onDelete: navigates back with the problem detail when deletion fails', () => {
    (apiStub.deleteApplicationListEntry as jest.Mock).mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 412,
            error: { detail: 'The application could not be deleted.' },
          }),
      ),
    );

    component.onDelete();

    expect(routerStub.navigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-id'],
      {
        queryParams: {
          deleteSuccess: false,
        },
        state: { deleteError: 'The application could not be deleted.' },
      },
    );
  });

  it('goBack: navigates to the list detail page when listId exists', () => {
    (routerStub.navigate as jest.Mock).mockClear();

    component.goBack();

    expect(routerStub.navigate).toHaveBeenCalledWith([
      '/applications-list',
      'list-id',
    ]);
  });

  it('goBack: navigates to applications list when listId is missing', () => {
    (routerStub.navigate as jest.Mock).mockClear();
    component.listId = null;

    component.goBack();

    expect(routerStub.navigate).toHaveBeenCalledWith(['/applications-list']);
  });
});
