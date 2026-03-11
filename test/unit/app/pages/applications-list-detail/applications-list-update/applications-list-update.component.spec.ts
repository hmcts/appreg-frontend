import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import {
  ApplicationsListUpdateComponent,
  closeValidationEntries,
} from '@components/applications-list-detail/applications-list-update/applications-list-update.component';
import { ApplicationsListDetailState } from '@components/applications-list-detail/util/applications-list-detail.state';
import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { CLOSE_MESSAGES } from '@constants/application-list-detail-update/error-messages';
import {
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  ApplicationListStatus,
  Official,
  PaymentStatus,
  TemplateDetail,
} from '@openapi';
import { AppListNavState } from '@shared-types/applications-list/applications-list-form';
import * as buildPayloadUtil from '@util/build-payload';
import { PlaceFieldsState } from '@util/place-fields.base';

describe('ApplicationsListUpdateComponent', () => {
  let component: ApplicationsListUpdateComponent;
  let fixture: ComponentFixture<ApplicationsListUpdateComponent>;
  let router: Pick<Router, 'navigate'>;
  let setUpdateRequest: jest.Mock;
  let patchStateMock: jest.Mock;
  let setUpdateRequestMock: jest.Mock;
  let entryApiMock: { getApplicationListEntry: jest.Mock };
  let codeApiMock: { getApplicationCodeByCodeAndDate: jest.Mock };

  const mkForm = () =>
    new FormGroup({
      date: new FormControl<string | null>(null),
      time: new FormControl(null),
      description: new FormControl<string>(''),
      status: new FormControl<string | null>(null),
      court: new FormControl<string | null>(null),
      location: new FormControl<string | null>(null),
      cja: new FormControl<string | null>(null),
      duration: new FormControl(null),
    });

  const mkVm = (): ApplicationsListDetailState => ({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    rows: [],
    selectedIds: new Set<string>(),
    selectedRows: [],
    entriesDetails: [],
    entryCodeDetails: {},
    isLoading: false,
    updateDone: false,
    updateInvalid: false,
    errorHint: '',
    errorSummary: [],
    hasPrefilledFromApi: false,
    allEntryIds: [],
    allEntriesSummary: [],
    createDone: false,
    closeSummaryStatus: 'error',
    closeEntryDetailsStatus: 'error',
    closeCodeDetailsStatus: 'error',
  });

  const mkPlaceState = (): PlaceFieldsState => ({
    courthouseSearch: '',
    cjaSearch: '',
    courtLocations: [],
    cja: [],
    filteredCourthouses: [],
    filteredCja: [],
  });

  const mkSuggestionsFacade = (): SuggestionsFacade => ({
    courthouseSearch: () => '',
    setCourthouseSearch: jest.fn(),
    filteredCourthouses: () => [],
    onCourthouseInputChange: jest.fn(),
    selectCourthouse: jest.fn(),
    cjaSearch: () => '',
    setCjaSearch: jest.fn(),
    filteredCja: () => [],
    onCjaInputChange: jest.fn(),
    selectCja: jest.fn(),
  });

  const flushEffects = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    router = {
      navigate: jest.fn().mockResolvedValue(true),
    };
    setUpdateRequest = jest.fn();

    entryApiMock = { getApplicationListEntry: jest.fn() };
    codeApiMock = { getApplicationCodeByCodeAndDate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ApplicationsListUpdateComponent],
      providers: [
        {
          provide: ApplicationListEntriesApi,
          useValue: entryApiMock,
        },
        {
          provide: ApplicationCodesApi,
          useValue: codeApiMock,
        },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListUpdateComponent);
    component = fixture.componentInstance;
    patchStateMock = jest.fn();
    setUpdateRequestMock = jest.fn();
    fixture.componentRef.setInput('form', mkForm());
    fixture.componentRef.setInput('statusOptions', []);
    fixture.componentRef.setInput('placeState', mkPlaceState());
    fixture.componentRef.setInput('id', 'list-1');
    fixture.componentRef.setInput('etag', null);
    fixture.componentRef.setInput('entryIds', []);
    fixture.componentRef.setInput('patchState', patchStateMock);
    fixture.componentRef.setInput('vm', mkVm());
    fixture.componentRef.setInput('setUpdateRequest', setUpdateRequest);
    fixture.componentRef.setInput('suggestionsFacade', mkSuggestionsFacade());
    entryApiMock.getApplicationListEntry.mockReturnValue(
      of({
        id: 'e-default',
        applicationCode: '',
        lodgementDate: null,
      } as never),
    );
    codeApiMock.getApplicationCodeByCodeAndDate.mockReturnValue(of(null));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('detects close errors', () => {
    component.form().setErrors({
      closeNotPermitted: { noClose: ['missing'] },
    });

    expect(component.hasCloseErrors()).toBe(true);
    expect(component.closeErrorText()).toBe(
      'You cannot close this list. See the error summary for details.',
    );
  });

  it('detects duration close errors and text', () => {
    component.form().get('duration')?.setErrors({
      closeDurationMissing: true,
      durationErrorText: 'Duration required',
    });

    expect(component.hasDurationCloseError()).toBe(true);
    expect(component.durationCloseErrorText()).toBe('Duration required');
  });

  it('returns empty duration error text when non-string', () => {
    component.form().get('duration')?.setErrors({
      durationErrorText: true,
    });

    expect(component.durationCloseErrorText()).toBe('');
  });

  it('onUpdate: when not closing, submits update request directly', () => {
    component.form().patchValue({
      date: '2026-02-10',
      time: { hours: 10, minutes: 30 },
      description: 'updated list',
      status: ApplicationListStatus.OPEN,
      court: 'ABC',
      location: '',
      cja: '',
    });

    component.onUpdate();

    expect(setUpdateRequest).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('onUpdate: when closing, navigates to close confirmation with state and does not submit immediately', () => {
    component.form().patchValue({
      date: '2026-02-10',
      time: { hours: 10, minutes: 30 },
      description: 'updated list',
      status: ApplicationListStatus.CLOSED,
      court: 'ABC',
      location: '',
      cja: '',
    });

    component.onUpdate();

    expect(setUpdateRequest).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledTimes(1);

    const [commands, extras] = (router.navigate as jest.Mock).mock.calls[0] as [
      string[],
      { state?: AppListNavState },
    ];
    expect(commands).toEqual(['/applications-list', 'list-1', 'close']);
    expect(extras.state?.closeRequest?.id).toBe('list-1');
    expect(extras.state?.closeRequest?.etag).toBeNull();
    expect(extras.state?.closeRequest?.payload.status).toBe(
      ApplicationListStatus.CLOSED,
    );
  });

  it('finalizeUpdate sets update request for a valid form payload', () => {
    component.form().patchValue({
      date: '2026-03-10',
      time: { hours: 9, minutes: 30 },
      description: 'Updated list',
      status: 'open',
      court: 'LOC1',
      duration: null,
    });

    const summarySpy = jest
      .spyOn(
        component as unknown as {
          buildUpdateErrorSummary(): { id?: string; text: string }[];
        },
        'buildUpdateErrorSummary',
      )
      .mockReturnValue([]);
    const payloadSpy = jest
      .spyOn(buildPayloadUtil, 'buildNormalizedPayload')
      .mockReturnValue({
        date: '2026-03-10',
        time: '09:30',
        description: 'Updated list',
        status: ApplicationListStatus.OPEN,
        courtLocationCode: 'LOC1',
      });

    (
      component as unknown as {
        finalizeUpdate(): void;
      }
    ).finalizeUpdate();

    expect(setUpdateRequestMock).toHaveBeenCalledWith({
      id: 'list-1',
      payload: expect.objectContaining({
        date: '2026-03-10',
        time: '09:30',
        description: 'Updated list',
        status: 'OPEN',
        courtLocationCode: 'LOC1',
      }),
      etag: null,
    });

    summarySpy.mockRestore();
    payloadSpy.mockRestore();
  });

  it('finalizeUpdate patches validation errors when required time is missing', () => {
    component.form().patchValue({
      date: '2026-03-10',
      time: null,
      status: 'open',
      court: 'LOC1',
    });

    (
      component as unknown as {
        finalizeUpdate(): void;
      }
    ).finalizeUpdate();

    expect(setUpdateRequestMock).not.toHaveBeenCalled();
    expect(patchStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        updateInvalid: true,
        errorHint: 'There is a problem',
      }),
    );
  });

  it('finalizeUpdate patches message when payload creation throws', () => {
    const summarySpy = jest
      .spyOn(
        component as unknown as {
          buildUpdateErrorSummary(): { id?: string; text: string }[];
        },
        'buildUpdateErrorSummary',
      )
      .mockReturnValue([]);
    const payloadSpy = jest
      .spyOn(buildPayloadUtil, 'buildNormalizedPayload')
      .mockImplementation(() => {
        throw new Error('payload failure');
      });

    (
      component as unknown as {
        finalizeUpdate(): void;
      }
    ).finalizeUpdate();

    expect(setUpdateRequestMock).not.toHaveBeenCalled();
    expect(patchStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        updateInvalid: true,
        errorHint: 'payload failure',
      }),
    );

    summarySpy.mockRestore();
    payloadSpy.mockRestore();
  });

  it('onUpdate closing emits request for all entry ids when summary is not ready', () => {
    fixture.componentRef.setInput('vm', {
      ...mkVm(),
      closeSummaryStatus: 'loading',
      closeEntryDetailsStatus: 'idle',
      closeCodeDetailsStatus: 'idle',
    });
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.requestAllEntryIds, 'emit');

    component.form().patchValue({
      date: '2026-03-10',
      time: { hours: 9, minutes: 30 },
      description: 'Close list',
      status: 'closed',
      court: 'LOC1',
    });

    component.onUpdate();

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(setUpdateRequestMock).not.toHaveBeenCalled();
  });

  it('onUpdate closing waits for detail/code readiness before finalizing', () => {
    fixture.componentRef.setInput('vm', {
      ...mkVm(),
      closeSummaryStatus: 'ready',
      closeEntryDetailsStatus: 'loading',
      closeCodeDetailsStatus: 'idle',
    });
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.requestAllEntryIds, 'emit');

    component.form().patchValue({
      date: '2026-03-10',
      time: { hours: 9, minutes: 30 },
      description: 'Close list',
      status: 'closed',
      court: 'LOC1',
    });

    component.onUpdate();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(setUpdateRequestMock).not.toHaveBeenCalled();
  });

  it('onUpdate closing finalizes when all close validation statuses are ready', () => {
    fixture.componentRef.setInput('vm', {
      ...mkVm(),
      closeSummaryStatus: 'ready',
      closeEntryDetailsStatus: 'ready',
      closeCodeDetailsStatus: 'ready',
    });
    fixture.detectChanges();

    component.form().patchValue({
      date: '2026-03-10',
      time: { hours: 9, minutes: 30 },
      description: 'Close list',
      status: 'closed',
      court: 'LOC1',
      duration: { hours: 1, minutes: 0 },
    });

    component.onUpdate();

    expect(setUpdateRequestMock).toHaveBeenCalledTimes(1);
    expect(setUpdateRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          status: 'CLOSED',
          durationHours: 1,
          durationMinutes: 0,
        }),
      }),
    );
  });

  it('onUpdate non-closing resets close statuses to idle', () => {
    component.form().patchValue({
      status: 'open',
      date: '2026-03-10',
      time: { hours: 9, minutes: 30 },
      court: 'LOC1',
    });

    component.onUpdate();

    expect(patchStateMock).toHaveBeenCalledWith({
      closeEntryDetailsStatus: 'idle',
      closeCodeDetailsStatus: 'idle',
    });
  });

  it('builds close validation error summary without duplicate duration close reason', () => {
    component.form().setErrors({
      closeNotPermitted: {
        noClose: [CLOSE_MESSAGES.durationMissing, 'Some other close reason'],
      },
    });
    component.form().get('duration')?.setErrors({
      closeDurationMissing: true,
      durationErrorText: 'Duration required before closing',
    });

    const summary = (
      component as unknown as {
        buildUpdateErrorSummary(): { id?: string; text: string }[];
      }
    ).buildUpdateErrorSummary();

    expect(summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'duration-hours',
          text: 'Duration required before closing',
        }),
        expect.objectContaining({
          id: 'status-close-2',
          text: 'Some other close reason',
        }),
      ]),
    );
    expect(summary).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: CLOSE_MESSAGES.durationMissing,
        }),
      ]),
    );
  });

  it('buildCodeDetailRequests keeps only entries with code and date', () => {
    const out = (
      component as unknown as {
        buildCodeDetailRequests(
          entries: Array<{
            id: string;
            applicationCode?: string | null;
            lodgementDate?: string | null;
          }>,
        ): Array<{ entryId: string; params: { code: string; date: string } }>;
      }
    ).buildCodeDetailRequests([
      { id: 'e1', applicationCode: 'A1', lodgementDate: '2026-03-10T10:00:00' },
      { id: 'e2', applicationCode: '', lodgementDate: '2026-03-10' },
      { id: 'e3', applicationCode: 'A3', lodgementDate: null },
    ]);

    expect(out).toEqual([
      {
        entryId: 'e1',
        params: { code: 'A1', date: '2026-03-10' },
      },
    ]);
  });

  describe('syncEntryIds', () => {
    it('marks close detail statuses ready when closing and entryIds are empty', async () => {
      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.componentRef.setInput('entryIds', []);
      fixture.detectChanges();

      component.form().patchValue({
        status: 'closed',
        date: '2026-03-10',
        time: { hours: 9, minutes: 30 },
        court: 'LOC1',
      });

      component.onUpdate();
      await flushEffects();

      expect(patchStateMock).toHaveBeenCalledWith({
        closeEntryDetailsStatus: 'ready',
        closeCodeDetailsStatus: 'ready',
      });
    });

    it('loads entry details once per key and avoids duplicate request for same ids', async () => {
      entryApiMock.getApplicationListEntry.mockReturnValue(
        of({
          id: 'e1',
          applicationCode: '',
          lodgementDate: null,
          officials: [],
          feeStatuses: [],
        } as never),
      );

      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.componentRef.setInput('entryIds', ['e1']);
      component.form().patchValue({
        status: 'closed',
        date: '2026-03-10',
        time: { hours: 9, minutes: 30 },
        court: 'LOC1',
      });

      component.onUpdate();
      await flushEffects();

      expect(entryApiMock.getApplicationListEntry).toHaveBeenCalledTimes(1);

      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.componentRef.setInput('entryIds', ['e1']);
      await flushEffects();

      expect(entryApiMock.getApplicationListEntry).toHaveBeenCalledTimes(1);
    });
  });

  describe('maybeFinalizePendingCloseSubmit', () => {
    it('does not finalize when pending close submit exists but status is no longer closed', async () => {
      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'loading',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.detectChanges();

      component.form().patchValue({
        status: 'closed',
        date: '2026-03-10',
        time: { hours: 9, minutes: 30 },
        court: 'LOC1',
      });
      component.onUpdate();

      component.form().patchValue({ status: 'open' });
      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'ready',
        closeCodeDetailsStatus: 'ready',
      });
      await flushEffects();

      expect(setUpdateRequestMock).not.toHaveBeenCalled();
    });

    it('finalizes once pending close submit transitions to fully ready', async () => {
      const summarySpy = jest
        .spyOn(
          component as unknown as {
            buildUpdateErrorSummary(): { id?: string; text: string }[];
          },
          'buildUpdateErrorSummary',
        )
        .mockReturnValue([]);
      const payloadSpy = jest
        .spyOn(buildPayloadUtil, 'buildNormalizedPayload')
        .mockReturnValue({
          date: '2026-03-10',
          time: '09:30',
          description: 'Closed list',
          status: ApplicationListStatus.CLOSED,
          courtLocationCode: 'LOC1',
        });

      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'loading',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.detectChanges();

      component.form().patchValue({
        status: 'closed',
        date: '2026-03-10',
        time: { hours: 9, minutes: 30 },
        description: 'Closed list',
        court: 'LOC1',
      });
      component.onUpdate();

      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'ready',
        closeCodeDetailsStatus: 'ready',
      });
      await flushEffects();

      expect(setUpdateRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ status: 'CLOSED' }),
        }),
      );

      summarySpy.mockRestore();
      payloadSpy.mockRestore();
    });

    it('does not finalize when pending close submit moves to summary error', async () => {
      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'loading',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.detectChanges();

      component.form().patchValue({
        status: 'closed',
        date: '2026-03-10',
        time: { hours: 9, minutes: 30 },
        court: 'LOC1',
      });
      component.onUpdate();

      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'error',
        closeEntryDetailsStatus: 'ready',
        closeCodeDetailsStatus: 'ready',
      });
      await flushEffects();

      expect(setUpdateRequestMock).not.toHaveBeenCalled();
    });

    it('clears pending close submit when form status is not closed', async () => {
      component.form().patchValue({ status: 'open' });

      (
        component as unknown as {
          pendingCloseSubmit: { set(v: boolean): void; (): boolean };
        }
      ).pendingCloseSubmit.set(true);
      await flushEffects();

      expect(
        (
          component as unknown as {
            pendingCloseSubmit: () => boolean;
          }
        ).pendingCloseSubmit(),
      ).toBe(false);
      expect(setUpdateRequestMock).not.toHaveBeenCalled();
    });

    it('clears pending close submit when close entry details status is error', async () => {
      component.form().patchValue({ status: 'closed' });
      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'error',
        closeCodeDetailsStatus: 'ready',
      });

      (
        component as unknown as {
          pendingCloseSubmit: { set(v: boolean): void; (): boolean };
        }
      ).pendingCloseSubmit.set(true);
      await flushEffects();

      expect(
        (
          component as unknown as {
            pendingCloseSubmit: () => boolean;
          }
        ).pendingCloseSubmit(),
      ).toBe(false);
      expect(setUpdateRequestMock).not.toHaveBeenCalled();
    });

    it('clears pending close submit when close code details status is error', async () => {
      component.form().patchValue({ status: 'closed' });
      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'ready',
        closeCodeDetailsStatus: 'error',
      });

      (
        component as unknown as {
          pendingCloseSubmit: { set(v: boolean): void; (): boolean };
        }
      ).pendingCloseSubmit.set(true);
      await flushEffects();

      expect(
        (
          component as unknown as {
            pendingCloseSubmit: () => boolean;
          }
        ).pendingCloseSubmit(),
      ).toBe(false);
      expect(setUpdateRequestMock).not.toHaveBeenCalled();
    });
  });

  describe('ngOnInit load effects', () => {
    it('handles entry detail load success with no code detail requests', async () => {
      entryApiMock.getApplicationListEntry.mockReturnValue(
        of({
          id: 'e1',
          applicationCode: '',
          lodgementDate: null,
          officials: [],
          feeStatuses: [],
        } as never),
      );

      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.componentRef.setInput('entryIds', ['e1']);
      component.form().patchValue({
        status: 'closed',
        date: '2026-03-10',
        time: { hours: 9, minutes: 30 },
        court: 'LOC1',
      });

      component.onUpdate();
      await flushEffects();

      expect(patchStateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          entriesDetails: expect.any(Array),
          closeEntryDetailsStatus: 'ready',
        }),
      );
      expect(patchStateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          closeCodeDetailsStatus: 'ready',
          entryCodeDetails: {},
        }),
      );
    });

    it('handles entry + code detail load success and maps code details by entry id', async () => {
      entryApiMock.getApplicationListEntry.mockReturnValue(
        of({
          id: 'e1',
          applicationCode: 'A1',
          lodgementDate: '2026-03-10T00:00:00',
          officials: [],
          feeStatuses: [],
        } as never),
      );
      codeApiMock.getApplicationCodeByCodeAndDate.mockReturnValue(
        of({
          applicationCode: 'A1',
          requiresRespondent: true,
        } as never),
      );

      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.componentRef.setInput('entryIds', ['e1']);
      component.form().patchValue({
        status: 'closed',
        date: '2026-03-10',
        time: { hours: 9, minutes: 30 },
        court: 'LOC1',
      });

      component.onUpdate();
      await flushEffects();

      expect(codeApiMock.getApplicationCodeByCodeAndDate).toHaveBeenCalledWith(
        { code: 'A1', date: '2026-03-10' },
        'body',
        false,
        { transferCache: true },
      );
      expect(patchStateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          entryCodeDetails: expect.objectContaining({
            e1: expect.objectContaining({ applicationCode: 'A1' }),
          }),
          closeCodeDetailsStatus: 'ready',
        }),
      );
    });

    it('handles entry detail load error', async () => {
      entryApiMock.getApplicationListEntry.mockReturnValue(
        throwError(() => new Error('entry-load-error')),
      );

      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.componentRef.setInput('entryIds', ['e1']);
      component.form().patchValue({
        status: 'closed',
        date: '2026-03-10',
        time: { hours: 9, minutes: 30 },
        court: 'LOC1',
      });

      component.onUpdate();
      await flushEffects();

      expect(patchStateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          closeEntryDetailsStatus: 'error',
        }),
      );
    });

    it('swallows code detail API errors and still marks code detail status ready', async () => {
      entryApiMock.getApplicationListEntry.mockReturnValue(
        of({
          id: 'e1',
          applicationCode: 'A1',
          lodgementDate: '2026-03-10T00:00:00',
          officials: [],
          feeStatuses: [],
        } as never),
      );
      codeApiMock.getApplicationCodeByCodeAndDate.mockReturnValue(
        throwError(() => new Error('code-load-error')),
      );

      fixture.componentRef.setInput('vm', {
        ...mkVm(),
        closeSummaryStatus: 'ready',
        closeEntryDetailsStatus: 'idle',
        closeCodeDetailsStatus: 'idle',
      });
      fixture.componentRef.setInput('entryIds', ['e1']);
      component.form().patchValue({
        status: 'closed',
        date: '2026-03-10',
        time: { hours: 9, minutes: 30 },
        court: 'LOC1',
      });

      component.onUpdate();
      await flushEffects();

      expect(patchStateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          closeCodeDetailsStatus: 'ready',
          entryCodeDetails: {},
        }),
      );
    });
  });
});

describe('closeValidationEntries', () => {
  it('maps row and detail data into close validation entries', () => {
    const vm: ApplicationsListDetailState = {
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      rows: [
        {
          id: 'e1',
          sequenceNumber: 1,
          accountNumber: null,
          applicant: null,
          respondent: 'Respondent A',
          postCode: null,
          title: 'Title',
          feeReq: 'Yes',
          resulted: 'Yes',
        },
        {
          id: 'e2',
          sequenceNumber: 2,
          accountNumber: null,
          applicant: null,
          respondent: null,
          postCode: null,
          title: 'Title 2',
          feeReq: 'No',
          resulted: 'No',
        },
      ],
      selectedIds: new Set<string>(),
      selectedRows: [],
      entriesDetails: [
        {
          id: 'e1',
          listId: 'list',
          applicationCode: 'A1',
          numberOfRespondents: 1,
          lodgementDate: '2024-01-01',
          officials: [{ forename: 'Alex', surname: 'One' } as Official],
          feeStatuses: [
            { paymentStatus: PaymentStatus.PAID, statusDate: '2024-01-02' },
          ],
        },
        {
          id: 'e2',
          listId: 'list',
          applicationCode: 'A2',
          numberOfRespondents: 0,
          lodgementDate: '2024-01-01',
          officials: [{ forename: 'Alex', surname: 'Two' } as Official],
          feeStatuses: [
            { paymentStatus: PaymentStatus.DUE, statusDate: '2024-01-02' },
          ],
        },
      ],
      entryCodeDetails: {
        e1: {
          applicationCode: 'A1',
          title: 'Title',
          wording: { template: 'T' } as TemplateDetail,
          isFeeDue: true,
          requiresRespondent: true,
          bulkRespondentAllowed: false,
          startDate: '2024-01-01',
          endDate: null,
        },
        e2: {
          applicationCode: 'A2',
          title: 'Title',
          wording: { template: 'T' } as TemplateDetail,
          isFeeDue: false,
          requiresRespondent: false,
          bulkRespondentAllowed: false,
          startDate: '2024-01-01',
          endDate: null,
        },
      },
      isLoading: false,
      updateDone: false,
      updateInvalid: false,
      errorHint: '',
      errorSummary: [],
      hasPrefilledFromApi: false,
      allEntryIds: [],
      allEntriesSummary: [],
      createDone: false,
      closeSummaryStatus: 'error',
      closeEntryDetailsStatus: 'error',
      closeCodeDetailsStatus: 'error',
    };

    const out = closeValidationEntries(vm);

    expect(out).toEqual([
      {
        id: 'e1',
        hasResult: true,
        hasFees: true,
        hasPaidFee: true,
        requiresRespondent: true,
        hasRespondent: true,
        hasOfficials: true,
      },
      {
        id: 'e2',
        hasResult: false,
        hasFees: false,
        hasPaidFee: false,
        requiresRespondent: false,
        hasRespondent: false,
        hasOfficials: true,
      },
    ]);
  });

  it('maps summary entries using isResulted/isFeeRequired fields', () => {
    const vm: ApplicationsListDetailState = {
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      rows: [],
      selectedIds: new Set<string>(),
      selectedRows: [],
      entriesDetails: [
        {
          id: 'e-summary-1',
          listId: 'list',
          applicationCode: 'A1',
          numberOfRespondents: 1,
          lodgementDate: '2024-01-01',
          officials: [{ forename: 'Alex', surname: 'One' } as Official],
          feeStatuses: [
            { paymentStatus: PaymentStatus.PAID, statusDate: '2024-01-02' },
          ],
        },
        {
          id: 'e-summary-2',
          listId: 'list',
          applicationCode: 'A2',
          numberOfRespondents: 0,
          lodgementDate: '2024-01-01',
          officials: [],
          feeStatuses: [
            { paymentStatus: PaymentStatus.DUE, statusDate: '2024-01-02' },
          ],
        },
      ],
      entryCodeDetails: {
        'e-summary-1': {
          applicationCode: 'A1',
          title: 'Title',
          wording: { template: 'T' } as TemplateDetail,
          isFeeDue: true,
          requiresRespondent: true,
          bulkRespondentAllowed: false,
          startDate: '2024-01-01',
          endDate: null,
        },
        'e-summary-2': {
          applicationCode: 'A2',
          title: 'Title',
          wording: { template: 'T' } as TemplateDetail,
          isFeeDue: false,
          requiresRespondent: false,
          bulkRespondentAllowed: false,
          startDate: '2024-01-01',
          endDate: null,
        },
      },
      isLoading: false,
      updateDone: false,
      updateInvalid: false,
      errorHint: '',
      errorSummary: [],
      hasPrefilledFromApi: false,
      allEntryIds: ['e-summary-1', 'e-summary-2'],
      allEntriesSummary: [
        {
          id: 'e-summary-1',
          applicationTitle: 'Title 1',
          isFeeRequired: true,
          isResulted: false,
          status: ApplicationListStatus.OPEN,
          respondent: {
            person: {
              name: { firstForename: 'John', surname: 'Smith' },
              contactDetails: { addressLine1: 'address' },
            },
          },
        },
        {
          id: 'e-summary-2',
          applicationTitle: 'Title 2',
          isFeeRequired: false,
          isResulted: true,
          status: ApplicationListStatus.OPEN,
        },
      ],
      closeSummaryStatus: 'ready',
      closeEntryDetailsStatus: 'ready',
      closeCodeDetailsStatus: 'ready',
      createDone: false,
    };

    const out = closeValidationEntries(vm);

    expect(out).toEqual([
      {
        id: 'e-summary-1',
        hasResult: false,
        hasFees: true,
        hasPaidFee: true,
        requiresRespondent: true,
        hasRespondent: true,
        hasOfficials: true,
      },
      {
        id: 'e-summary-2',
        hasResult: true,
        hasFees: false,
        hasPaidFee: false,
        requiresRespondent: false,
        hasRespondent: false,
        hasOfficials: false,
      },
    ]);
  });

  it('does not fallback to rows when summaries are not ready and no summary error', () => {
    const vm: ApplicationsListDetailState = {
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      rows: [
        {
          id: 'row-only',
          sequenceNumber: 1,
          accountNumber: null,
          applicant: null,
          respondent: null,
          postCode: null,
          title: 'Row Only',
          feeReq: 'Yes',
          resulted: 'No',
        },
      ],
      selectedIds: new Set<string>(),
      selectedRows: [],
      entriesDetails: [],
      entryCodeDetails: {},
      isLoading: false,
      updateDone: false,
      updateInvalid: false,
      errorHint: '',
      errorSummary: [],
      hasPrefilledFromApi: false,
      allEntryIds: [],
      allEntriesSummary: [],
      closeSummaryStatus: 'loading',
      closeEntryDetailsStatus: 'idle',
      closeCodeDetailsStatus: 'idle',
      createDone: false,
    };

    const out = closeValidationEntries(vm);

    expect(out).toEqual([]);
  });
});
