import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApplicationsListEntryDeleteComponent } from '@components/applications-list-detail/applications-list-entry-delete/applications-list-entry-delete.component';
import { ApplicationListEntriesApi } from '@openapi';

describe('ApplicationsListEntryDeleteComponent', () => {
  let component: ApplicationsListEntryDeleteComponent;
  let fixture: ComponentFixture<ApplicationsListEntryDeleteComponent>;

  const routeStub: Partial<ActivatedRoute> = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'list-id' }),
    } as ActivatedRoute['snapshot'],
  };

  const locationStub: Pick<Location, 'getState'> = {
    getState: () => ({ row: { id: 'entry-id' } }),
  };

  const routerStub: Pick<Router, 'navigate'> = {
    navigate: jest.fn().mockResolvedValue(true),
  };

  const apiStub: Pick<ApplicationListEntriesApi, 'deleteApplicationListEntry'> =
    {
      deleteApplicationListEntry: jest.fn(),
    };

  beforeEach(async () => {
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes listId and entryRow from the route and browser navigation state', () => {
    expect(component.listId).toBe('list-id');
    expect(component.entryRow).toEqual({ id: 'entry-id' });
  });

  it('ngOnInit: redirects to the list when the entry row is missing', () => {
    (routerStub.navigate as jest.Mock).mockClear();
    component.entryRow = undefined;

    component.ngOnInit();

    expect(routerStub.navigate).toHaveBeenCalledWith([
      '/applications-list',
      'list-id',
    ]);
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
