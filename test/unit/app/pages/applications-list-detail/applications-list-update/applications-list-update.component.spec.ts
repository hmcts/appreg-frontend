import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ApplicationsListUpdateComponent,
  closeValidationEntries,
} from '@components/applications-list-detail/applications-list-update/applications-list-update.component';
import { ApplicationsListDetailState } from '@components/applications-list-detail/util/applications-list-detail.state';
import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import {
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  ApplicationListStatus,
  Official,
  PaymentStatus,
  TemplateDetail,
} from '@openapi';
import { AppListCloseNavState } from '@shared-types/applications-list/applications-list-form';
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
    createDone: false
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
    fixture.componentRef.setInput('entryIds', []);
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
      { state?: AppListCloseNavState },
    ];
    expect(commands).toEqual(['/applications-list', 'list-1', 'close']);
    expect(extras.state?.closeRequest?.id).toBe('list-1');
    expect(extras.state?.closeRequest?.etag).toBeNull();
    expect(extras.state?.closeRequest?.payload.status).toBe(
      ApplicationListStatus.CLOSED,
    );
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
      createDone: false
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
});
