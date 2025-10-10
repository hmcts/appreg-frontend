import { HttpContext, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApplicationsList } from '../../../../../src/app/pages/applications-list/applications-list';
import { IF_MATCH, ROW_VERSION } from '../../../../../src/app/shared/context/concurrency-context';
import { ApplicationListsApi } from '../../../../../src/generated/openapi';

describe('ApplicationsList – delete flow (server platform: no confirm)', () => {
  let fixture: ComponentFixture<ApplicationsList>;
  let component: ApplicationsList;
  let api: { deleteApplicationList: jest.Mock };

  beforeEach(async () => {
    api = {
      deleteApplicationList: jest.fn().mockReturnValue(of({ status: 204 } as HttpResponse<unknown>)),
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationsList],            // standalone component
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'server' }, // skip confirm() path by default
        { provide: ApplicationListsApi, useValue: api },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsList);
    component = fixture.componentInstance;
    // avoid ngOnInit’s demo data; set our own rows
    component.rows = [
      {
        id: 'abc-123',
        date: '2025-10-01',
        time: '09:30',
        location: 'X',
        description: 'Y',
        entries: 0,
        status: 'Open',
        deletable: true,
        etag: 'W/"etag-val"',
        rowVersion: '42',
      },
      { id: 'keep-me', date: '', time: '', location: '', description: '', entries: 0, status: 'Open' },
    ];
  });

  it('guards when row.deletable === false: sets error and does NOT call API', async () => {
    const row = {
      id: 'nope',
      date: '', time: '', location: '', description: '', entries: 0, status: 'Open' as const,
      deletable: false,
    };
    await component.onDelete(row);

    expect(component.deleteInvalid).toBe(true);
    expect(component.errorHint).toBe('There is a problem');
    expect(component.errorSummary).toEqual([{ text: 'This list cannot be deleted.' }]);
    expect(api.deleteApplicationList).not.toHaveBeenCalled();
    expect(component.deletingId).toBeNull();
  });

  it('on success (204) removes row and sets deleteDone=true; passes ETag/RowVersion via HttpContext', async () => {
    const row = component.rows[0]; // abc-123

    // capture call args to inspect HttpContext values
    let capturedOptions: { context?: HttpContext } | undefined;

    api.deleteApplicationList.mockImplementation(
      (_params, _observe, _progress, options?: { context?: HttpContext }) => {
        capturedOptions = options;
        return of({ status: 204 } as HttpResponse<unknown>);
      },
    );

    await component.onDelete(row);

    expect(api.deleteApplicationList).toHaveBeenCalledTimes(1);
    expect(api.deleteApplicationList.mock.calls[0][0]).toEqual({ id: 'abc-123' });

    // Concurrency tokens from context
    expect(capturedOptions?.context?.get(IF_MATCH)).toBe('W/"etag-val"');
    expect(capturedOptions?.context?.get(ROW_VERSION)).toBe('42');

    // Row removed, banner flag set, deletingId reset
    expect(component.rows.find(r => r.id === 'abc-123')).toBeUndefined();
    expect(component.rows).toHaveLength(1);
    expect(component.rows[0].id).toBe('keep-me');
    expect(component.deleteDone).toBe(true);
    expect(component.deleteInvalid).toBe(false);
    expect(component.errorSummary).toEqual([]);
    expect(component.deletingId).toBeNull();
  });

  describe('error mapping -> inline error summary', () => {
    const cases: Array<{ status: number; firstText: string }> = [
      { status: 401, firstText: 'You are not signed in. Please sign in and try again.' },
      { status: 403, firstText: 'You do not have permission to delete this list.' },
      { status: 404, firstText: 'Application List not found. Return to the Lists view.' },
      { status: 409, firstText: 'This list has entries or is in a non-deletable state.' },
      { status: 412, firstText: 'The list has changed. Refresh the page and try again.' },
      { status: 500, firstText: 'Unable to delete list. Please try again later.' }, // default branch
    ];

    it.each(cases)('status %s -> shows correct inline error', async ({ status, firstText }) => {
      api.deleteApplicationList.mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status })),
      );

      const row = {
        id: 'abc-123',
        date: '', time: '', location: '', description: '', entries: 0, status: 'Open' as const,
        deletable: true,
      };

      // keep a couple of rows to confirm list remains intact on error
      component.rows = [
        { ...row },
        { id: 'keep-me', date: '', time: '', location: '', description: '', entries: 0, status: 'Open' as const },
      ];

      await component.onDelete(row);

      // API was called
      expect(api.deleteApplicationList).toHaveBeenCalled();

      // Error flags and message mapping
      expect(component.deleteDone).toBe(false);
      expect(component.deleteInvalid).toBe(true);
      expect(component.errorHint).toBe('There is a problem');
      expect(component.errorSummary[0].text).toBe(firstText);

      // Row NOT removed on error; deletingId reset
      expect(component.rows).toHaveLength(2);
      expect(component.deletingId).toBeNull();
    });
  });
});

describe('ApplicationsList – delete flow (browser platform: confirm cancel)', () => {
  let fixture: ComponentFixture<ApplicationsList>;
  let component: ApplicationsList;
  let api: { deleteApplicationList: jest.Mock };

  beforeEach(async () => {
    api = { deleteApplicationList: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ApplicationsList],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' }, // will hit window.confirm
        { provide: ApplicationListsApi, useValue: api },
      ],
    }).compileComponents();

    // Important: stub confirm BEFORE component method runs
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    fixture = TestBed.createComponent(ApplicationsList);
    component = fixture.componentInstance;

    component.rows = [
      {
        id: 'abc-123',
        date: '2025-10-01',
        time: '09:30',
        location: 'X',
        description: 'Y',
        entries: 0,
        status: 'Open',
        deletable: true,
      },
    ];
  });

  afterEach(() => {
    (window.confirm as jest.Mock)?.mockRestore?.();
  });

  it('when user cancels confirmation, does NOT call API and leaves state unchanged', async () => {
    await component.onDelete(component.rows[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(api.deleteApplicationList).not.toHaveBeenCalled();

    // no flags set, no removal, deletingId stays null
    expect(component.deleteDone).toBe(false);
    expect(component.deleteInvalid).toBe(false);
    expect(component.errorSummary).toEqual([]);
    expect(component.rows).toHaveLength(1);
    expect(component.deletingId).toBeNull();
  });
});
