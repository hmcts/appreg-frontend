import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { ApplicationsListUpdateComponent } from '@components/applications-list-detail/applications-list-update/applications-list-update.component';
import { ApplicationsListDetailState } from '@components/applications-list-detail/util/applications-list-detail.state';
import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { DETAIL_ERROR_ANCHORS } from '@constants/application-list-detail-update/error-hrefs';
import {
  CLOSE_MESSAGES,
  DETAIL_FIELD_MESSAGES,
} from '@constants/application-list-detail-update/error-messages';
import {
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  ApplicationListStatus,
} from '@openapi';
import { AppListNavState } from '@shared-types/applications-list/applications-list-form';
import * as buildPayload from '@util/build-payload';
import { PlaceFieldsState } from '@util/place-fields.base';

describe('ApplicationsListUpdateComponent', () => {
  let component: ApplicationsListUpdateComponent;
  let fixture: ComponentFixture<ApplicationsListUpdateComponent>;
  let router: Pick<Router, 'navigate'>;
  let patchState: jest.Mock;
  let setUpdateRequest: jest.Mock;

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
    totalEntries: 0,
    sortField: { key: 'sequenceNumber', direction: 'asc' },
    rows: [],
    selectedIds: new Set<string>(),
    selectedRows: [],
    allMatchingSelected: false,
    isLoading: false,
    isSelectingAll: false,
    updateDone: false,
    updateInvalid: false,
    errorHint: '',
    errorSummary: [],
    preserveErrorSummaryOnLoad: false,
    hasPrefilledFromApi: false,
    createDone: false,
    moveDone: false,
    getFilters: {},
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

  const setValidUpdateFormValues = () => {
    component.form().patchValue({
      date: '2026-02-10',
      time: { hours: 10, minutes: 30 },
      description: 'updated list',
      status: ApplicationListStatus.OPEN,
      court: 'ABC',
      location: '',
      cja: '',
      duration: null,
    });
  };

  const lastPatch = (): Partial<ApplicationsListDetailState> =>
    patchState.mock.calls[patchState.mock.calls.length - 1][0] as Partial<
      ApplicationsListDetailState
    >;

  beforeEach(async () => {
    router = {
      navigate: jest.fn().mockResolvedValue(true),
    };
    patchState = jest.fn();
    setUpdateRequest = jest.fn();

    await TestBed.configureTestingModule({
      imports: [ApplicationsListUpdateComponent],
      providers: [
        {
          provide: ApplicationListEntriesApi,
          useValue: { getApplicationListEntry: jest.fn() },
        },
        {
          provide: ApplicationCodesApi,
          useValue: { getApplicationCodeByCodeAndDate: jest.fn() },
        },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListUpdateComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('form', mkForm());
    fixture.componentRef.setInput('statusOptions', []);
    fixture.componentRef.setInput('placeState', mkPlaceState());
    fixture.componentRef.setInput('id', 'list-1');
    fixture.componentRef.setInput('etag', null);
    fixture.componentRef.setInput('patchState', patchState);
    fixture.componentRef.setInput('vm', mkVm());
    fixture.componentRef.setInput('setUpdateRequest', setUpdateRequest);
    fixture.componentRef.setInput('suggestionsFacade', mkSuggestionsFacade());
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

  it('uses returned close error text from the detail page state', () => {
    fixture.componentRef.setInput('vm', {
      ...mkVm(),
      updateInvalid: true,
      errorSummary: [
        {
          id: 'status-close',
          href: '#status',
          text: 'List cannot be closed.',
        },
      ],
    });
    fixture.detectChanges();

    expect(component.hasCloseErrors()).toBe(true);
    expect(component.closeErrorText()).toBe('List cannot be closed.');
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
    setValidUpdateFormValues();

    component.onUpdate();

    expect(setUpdateRequest).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('onUpdate: when closing, navigates to close confirmation with state and does not submit immediately', () => {
    setValidUpdateFormValues();
    component.form().controls.status.setValue(ApplicationListStatus.CLOSED);

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

  it('onUpdate: patches invalid state and error summary when validation errors exist', () => {
    setValidUpdateFormValues();
    component.form().controls.date.setErrors({
      required: true,
      dateInvalid: true,
    });

    component.onUpdate();

    expect(setUpdateRequest).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(lastPatch()).toEqual({
      updateInvalid: true,
      errorHint: 'There is a problem',
      errorSummary: [
        {
          id: 'date',
          href: `#${DETAIL_ERROR_ANCHORS.date}`,
          text: DETAIL_FIELD_MESSAGES.date.dateInvalid,
        },
      ],
    });
  });

  it('onUpdate: patches the payload build error when normalization throws', () => {
    setValidUpdateFormValues();
    component.form().controls.status.setValue('not-a-status');

    component.onUpdate();

    expect(setUpdateRequest).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(lastPatch()).toEqual({
      updateInvalid: true,
      errorHint: 'status invalid',
    });
  });

  it('onUpdate: stringifies non-Error payload build failures', () => {
    setValidUpdateFormValues();
    const buildPayloadSpy = jest
      .spyOn(buildPayload, 'buildNormalizedPayload')
      .mockImplementation(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- exercises defensive non-Error catch branch
        throw new Error('payload failed');
      });

    component.onUpdate();

    expect(setUpdateRequest).not.toHaveBeenCalled();
    expect(lastPatch()).toEqual({
      updateInvalid: true,
      errorHint: 'payload failed',
    });

    buildPayloadSpy.mockRestore();
  });

  it('onUpdate: includes finite numeric duration values in the update request', () => {
    setValidUpdateFormValues();
    component.form().controls.duration.setValue({ hours: 2, minutes: 45 });

    component.onUpdate();

    expect(setUpdateRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          durationHours: 2,
          durationMinutes: 45,
        }),
      }),
    );
  });

  it('coerces numeric duration strings and ignores blank or invalid strings', () => {
    const toNum = (
      component as unknown as {
        toNum(v: string | number | null | undefined): number | undefined;
      }
    ).toNum.bind(component);

    expect(toNum(' 4 ')).toBe(4);
    expect(toNum(' ')).toBeUndefined();
    expect(toNum('not-a-number')).toBeUndefined();
  });

  it('ignores non-finite numeric duration values', () => {
    const toNum = (
      component as unknown as {
        toNum(v: string | number | null | undefined): number | undefined;
      }
    ).toNum.bind(component);

    expect(toNum(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(toNum(Number.NaN)).toBeUndefined();
  });

  it('onUpdate: replaces generic duration errors with hours and minutes errors', () => {
    setValidUpdateFormValues();
    component.form().controls.duration.setErrors({
      durationInvalid: true,
      hoursErrorText: 'Enter valid hours',
      minutesErrorText: 'Enter valid minutes',
      durationErrorText: 'Enter valid hours',
    });

    component.onUpdate();

    expect(lastPatch().errorSummary).toEqual([
      {
        id: DETAIL_ERROR_ANCHORS.duration_hours,
        href: `#${DETAIL_ERROR_ANCHORS.duration_hours}`,
        text: 'Enter valid hours',
      },
      {
        id: DETAIL_ERROR_ANCHORS.duration_minutes,
        href: `#${DETAIL_ERROR_ANCHORS.duration_minutes}`,
        text: 'Enter valid minutes',
      },
    ]);
  });

  it('onUpdate: uses duration-level close validation text when part-specific duration messages are absent', () => {
    setValidUpdateFormValues();
    component.form().controls.status.setValue(ApplicationListStatus.CLOSED);
    component.form().controls.duration.setErrors({
      closeDurationMissing: true,
      durationErrorText: CLOSE_MESSAGES.durationMissing,
    });

    component.onUpdate();

    expect(lastPatch().errorSummary).toEqual([
      {
        id: DETAIL_ERROR_ANCHORS.duration_hours,
        href: `#${DETAIL_ERROR_ANCHORS.duration_hours}`,
        text: CLOSE_MESSAGES.durationMissing,
      },
    ]);
  });

  it('onUpdate: falls back to the default duration invalid message when no custom duration text is present', () => {
    setValidUpdateFormValues();
    component.form().controls.duration.setErrors({
      durationInvalid: true,
      hoursErrorText: '   ',
      minutesErrorText: true,
    });

    component.onUpdate();

    expect(lastPatch().errorSummary).toEqual([
      {
        id: DETAIL_ERROR_ANCHORS.duration_hours,
        href: `#${DETAIL_ERROR_ANCHORS.duration_hours}`,
        text: DETAIL_FIELD_MESSAGES.duration.durationInvalid,
      },
    ]);
  });

  it('onUpdate: skips duplicate close duration reasons when duration has its own close error', () => {
    setValidUpdateFormValues();
    component.form().controls.status.setValue(ApplicationListStatus.CLOSED);
    component.form().controls.duration.setErrors({
      closeDurationMissing: true,
      durationErrorText: CLOSE_MESSAGES.durationMissing,
    });
    component.form().setValidators(() => ({
      closeNotPermitted: {
        noClose: [
          CLOSE_MESSAGES.durationMissing,
          CLOSE_MESSAGES.durationNonPositive,
          'There are unresolved applications.',
        ],
      },
    }));

    component.onUpdate();

    expect(lastPatch().errorSummary).toEqual([
      {
        id: DETAIL_ERROR_ANCHORS.duration_hours,
        href: `#${DETAIL_ERROR_ANCHORS.duration_hours}`,
        text: CLOSE_MESSAGES.durationMissing,
      },
      {
        id: 'status-close-3',
        href: '#status',
        text: 'There are unresolved applications.',
      },
    ]);
  });

  it('deduplicates error summary items by id and drops items without an id', () => {
    const result = (
      component as unknown as {
        dedupeById(items: ErrorItem[]): ErrorItem[];
      }
    ).dedupeById([
      { text: 'Missing id' },
      { id: 'date', href: '#date-day', text: 'First date error' },
      { id: 'date', href: '#date-month', text: 'Second date error' },
      { id: 'time', href: '#time-hours', text: 'Time error' },
    ]);

    expect(result).toEqual([
      { id: 'date', href: '#date-day', text: 'First date error' },
      { id: 'time', href: '#time-hours', text: 'Time error' },
    ]);
  });
});
