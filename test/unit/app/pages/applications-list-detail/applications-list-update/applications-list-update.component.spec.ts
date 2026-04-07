import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { ApplicationsListUpdateComponent } from '@components/applications-list-detail/applications-list-update/applications-list-update.component';
import { ApplicationsListDetailState } from '@components/applications-list-detail/util/applications-list-detail.state';
import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import {
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  ApplicationListStatus,
} from '@openapi';
import { AppListNavState } from '@shared-types/applications-list/applications-list-form';
import { PlaceFieldsState } from '@util/place-fields.base';

describe('ApplicationsListUpdateComponent', () => {
  let component: ApplicationsListUpdateComponent;
  let fixture: ComponentFixture<ApplicationsListUpdateComponent>;
  let router: Pick<Router, 'navigate'>;
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
    rows: [],
    selectedIds: new Set<string>(),
    selectedRows: [],
    isLoading: false,
    updateDone: false,
    updateInvalid: false,
    errorHint: '',
    errorSummary: [],
    preserveErrorSummaryOnLoad: false,
    hasPrefilledFromApi: false,
    createDone: false,
    moveDone: false,
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

  beforeEach(async () => {
    router = {
      navigate: jest.fn().mockResolvedValue(true),
    };
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
    fixture.componentRef.setInput('patchState', jest.fn());
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
});
