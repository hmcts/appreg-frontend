// applications-list-entry-detail.spec.ts

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { Observable, of } from 'rxjs';

import {
  ApplicationsListEntryDetail,
  ERROR_HREFS,
} from '@components/applications-list-entry-detail/applications-list-entry-detail.component';
import {
  buildOfficialsFromFormValue,
  officialsToFormPatch,
} from '@components/applications-list-entry-detail/util/entry-detail.form';
import * as routingStateUtil from '@components/applications-list-entry-detail/util/routing-state-util';
import {
  ApplicationCodeGetDetailDto,
  ApplicationCodePage,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  FeeStatus,
  GetApplicationCodesRequestParams,
  OfficialType,
  PaymentStatus,
  StandardApplicantGetDetailDto,
  StandardApplicantPage,
  StandardApplicantsApi,
  TemplateConstraintTypeEnum,
  UpdateApplicationListEntryRequestParams,
} from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import { ApplicationsListEntryFormValue } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import type { AddFeeDetailsPayload } from '@shared-types/civil-fee/civil-fee';
import * as civilFeeUtils from '@util/civil-fee-utils';

type GetCodesFn = (
  params: GetApplicationCodesRequestParams,
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<ApplicationCodePage>;

type GetEntryFn = (
  params: { listId: string; entryId: string },
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<EntryGetDetailDto>;

type UpdateEntryFn = (
  params: UpdateApplicationListEntryRequestParams,
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<unknown>;

type GetCodeDetailFn = (
  params: { code: string; date: string },
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<ApplicationCodeGetDetailDto>;

type GetStandardApplicantDetailFn = (
  params: { code: string; date: string },
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<StandardApplicantGetDetailDto>;

type GetStandardApplicantsFn = (
  params?: {
    code?: string;
    name?: string;
    pageNumber?: number;
    pageSize?: number;
    sort?: string[];
  },
  observe?: 'body',
  reportProgress?: boolean,
  options?: { transferCache?: boolean; context?: unknown },
) => Observable<StandardApplicantPage>;

type PaymentRefApplier = {
  applyPaymentRefReturn: (updatedRowId: string, newRef: string) => void;
};

type EntryDetailWithWordingSnapshot = EntryGetDetailDto & {
  wordingFields?: string[];
};

describe('ApplicationsListEntryDetail', () => {
  let fixture: ComponentFixture<ApplicationsListEntryDetail>;
  let component: ApplicationsListEntryDetail;

  let mockGetApplicationCodes: jest.MockedFunction<GetCodesFn>;
  let mockGetApplicationCodeByCodeAndDate: jest.MockedFunction<GetCodeDetailFn>;
  let mockGetStandardApplicants: jest.MockedFunction<GetStandardApplicantsFn>;
  let mockGetStandardApplicantByCodeAndDate: jest.MockedFunction<GetStandardApplicantDetailFn>;
  let mockGetApplicationListEntry: jest.MockedFunction<GetEntryFn>;
  let mockUpdateApplicationListEntry: jest.MockedFunction<UpdateEntryFn>;

  const routeStub: ActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({
        listId: 'AL-1',
        entryId: 'EN-1',
        id: 'AL-1',
      }),
      queryParamMap: convertToParamMap({ entryId: 'EN-1', appListId: 'AL-1' }),
    },
  } as ActivatedRoute;

  beforeEach(async () => {
    jest.resetAllMocks();

    (
      routeStub.snapshot as unknown as {
        paramMap: ReturnType<typeof convertToParamMap>;
      }
    ).paramMap = convertToParamMap({
      listId: 'AL-1',
      entryId: 'EN-1',
      id: 'AL-1',
    });
    (
      routeStub.snapshot as unknown as {
        queryParamMap: ReturnType<typeof convertToParamMap>;
      }
    ).queryParamMap = convertToParamMap({
      entryId: 'EN-1',
      appListId: 'AL-1',
    });

    mockGetApplicationCodes = jest.fn();
    mockGetApplicationCodeByCodeAndDate = jest.fn();
    mockGetStandardApplicants = jest.fn();
    mockGetStandardApplicantByCodeAndDate = jest.fn();
    mockGetApplicationListEntry = jest.fn();
    mockUpdateApplicationListEntry = jest.fn();

    mockGetApplicationListEntry.mockReturnValue(
      of({
        lodgementDate: '2025-11-01',
        applicationCode: 'APP-100',
        standardApplicantCode: null,
        wording: {
          template: 'At {{Court}} for {{Date}}',
          'substitution-key-constraints': [
            {
              key: 'Court',
              value: 'Court A',
              constraint: { length: 20 },
            },
            {
              key: 'Date',
              value: '2026-04-13',
              constraint: { length: 10 },
            },
          ],
        },
      } as unknown as EntryGetDetailDto),
    );

    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-100',
        title: 'Loaded title',
        wording: { template: '' },
        bulkRespondentAllowed: false,
        isFeeDue: false,
        requiresRespondent: false,
        feeReference: undefined,
        startDate: '2025-01-01',
        endDate: null,
      } as ApplicationCodeGetDetailDto),
    );

    mockGetStandardApplicants.mockReturnValue(
      of({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        elementsOnPage: 0,
        content: [],
      }),
    );

    mockUpdateApplicationListEntry.mockReturnValue(of({}));

    const codesApiMock = {
      getApplicationCodes: mockGetApplicationCodes,
      getApplicationCodeByCodeAndDate: mockGetApplicationCodeByCodeAndDate,
    } as unknown as ApplicationCodesApi;

    const entriesApiMock = {
      getApplicationListEntry: mockGetApplicationListEntry,
      updateApplicationListEntry: mockUpdateApplicationListEntry,
    } as unknown as ApplicationListEntriesApi;

    const standardApplicantsApiMock = {
      getStandardApplicants: mockGetStandardApplicants,
      getStandardApplicantByCodeAndDate: mockGetStandardApplicantByCodeAndDate,
    } as unknown as StandardApplicantsApi;

    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryDetail],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ApplicationCodesApi, useValue: codesApiMock },
        { provide: ApplicationListEntriesApi, useValue: entriesApiMock },
        { provide: StandardApplicantsApi, useValue: standardApplicantsApiMock },
        { provide: ActivatedRoute, useValue: routeStub },
        ApplicationListEntryFormService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListEntryDetail);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('maps lodgementDate error summary links to the date input day field', () => {
    expect(ERROR_HREFS.lodgementDate).toBe('#lodgement-date-day');
  });

  it('ngOnInit loads entry and application code and patches form', () => {
    const freshFixture = TestBed.createComponent(ApplicationsListEntryDetail);
    const freshComponent = freshFixture.componentInstance;

    freshComponent.ngOnInit();

    const raw = freshComponent['form'].getRawValue();

    expect(raw.lodgementDate).toBe('2025-11-01');
    expect(freshComponent['form'].controls.applicationCode.value).toBe(
      'APP-100',
    );
    expect(freshComponent['form'].controls.applicationTitle?.value).toBe(
      'Loaded title',
    );

    expect(mockGetApplicationListEntry).toHaveBeenCalledWith(
      { listId: 'AL-1', entryId: 'EN-1' },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );

    expect(mockGetApplicationCodeByCodeAndDate).toHaveBeenCalledWith(
      { code: 'APP-100', date: '2025-11-01' },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );
  });

  it('hydrates codes section on init: patches lodgementDate, applicationCode, and resolves applicationTitle', () => {
    const raw = component['form'].getRawValue();

    expect(raw.lodgementDate).toBe('2025-11-01');
    expect(component['form'].controls.applicationCode.value).toBe('APP-100');
    expect(component['form'].controls.applicationTitle?.value).toBe(
      'Loaded title',
    );

    expect(mockGetApplicationListEntry).toHaveBeenCalledWith(
      { listId: 'AL-1', entryId: 'EN-1' },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );

    expect(mockGetApplicationCodeByCodeAndDate).toHaveBeenCalledWith(
      { code: 'APP-100', date: '2025-11-01' },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );
  });

  it('hydrates wordingFields from entry wording on init', () => {
    expect(component['form'].controls.wordingFields.value).toEqual([
      { key: 'Court', value: 'Court A' },
      { key: 'Date', value: '2026-04-13' },
    ]);
  });

  it('hydrates saved standard applicant name via exact code and lodgement date lookup', () => {
    mockGetApplicationListEntry.mockReturnValueOnce(
      of({
        lodgementDate: '2025-11-01T12:34:56Z',
        applicationCode: 'APP-100',
        standardApplicantCode: 'SA-123',
      } as unknown as EntryGetDetailDto),
    );
    mockGetStandardApplicantByCodeAndDate.mockReturnValueOnce(
      of({
        code: 'SA-123',
        name: 'Exact Applicant Name',
        startDate: '2025-01-01',
        endDate: null,
      }),
    );

    const freshFixture = TestBed.createComponent(ApplicationsListEntryDetail);
    const freshComponent = freshFixture.componentInstance;

    freshFixture.detectChanges();

    expect(mockGetStandardApplicantByCodeAndDate).toHaveBeenCalledWith(
      { code: 'SA-123', date: '2025-11-01' },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );
    expect(freshComponent.savedStandardApplicantName).toBe(
      'Exact Applicant Name',
    );
  });

  it('hydrates saved standard applicant name from applicant details when top-level name is absent', () => {
    mockGetApplicationListEntry.mockReturnValueOnce(
      of({
        lodgementDate: '2025-11-01T12:34:56Z',
        applicationCode: 'APP-100',
        standardApplicantCode: 'SA-123',
      } as unknown as EntryGetDetailDto),
    );
    mockGetStandardApplicantByCodeAndDate.mockReturnValueOnce(
      of({
        code: 'SA-123',
        applicant: {
          organisation: {
            name: 'Fallback Organisation Name',
            contactDetails: {},
          },
        },
        startDate: '2025-01-01',
        endDate: null,
      } as unknown as StandardApplicantGetDetailDto),
    );

    const freshFixture = TestBed.createComponent(ApplicationsListEntryDetail);
    const freshComponent = freshFixture.componentInstance;

    freshFixture.detectChanges();

    expect(freshComponent.savedStandardApplicantName).toBe(
      'Fallback Organisation Name',
    );
  });

  it('includes relayed standard applicant search errors in the parent summary', () => {
    component['form'].patchValue({ applicantType: 'standard' });
    (
      component as unknown as {
        appListEntryDetailPatch: (patch: Record<string, unknown>) => void;
      }
    ).appListEntryDetailPatch({ formSubmitted: true });

    component.onChildErrors('applicant', [
      {
        id: 'standard-applicant-code',
        text: 'Code must be 10 characters or fewer',
        href: '#standard-applicant-code',
      },
    ]);

    expect(component.applicantErrorItems).toEqual([
      {
        id: 'standard-applicant-code',
        text: 'Code must be 10 characters or fewer',
        href: '#standard-applicant-code',
      },
    ]);
    expect(component['appListEntryDetailState']().summaryErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'standard-applicant-code',
          text: 'Code must be 10 characters or fewer',
        }),
      ]),
    );
  });

  it('includes relayed application code search errors in the parent summary', () => {
    component.onChildErrors('codes', [
      {
        id: 'code',
        text: 'Application code must be 10 characters or fewer',
        href: '#applicationCode',
      },
    ]);

    expect(component['appListEntryDetailState']().summaryErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'code',
          text: 'Application code must be 10 characters or fewer',
        }),
      ]),
    );
  });

  it('isUpdateDisabled true when entryDetail is not set', () => {
    component['entryDetail'] = null;

    expect(component.isUpdateDisabled).toBe(true);
  });

  it('isUpdateDisabled for standard applicant requires selectedStandardApplicantCode (uses full EntryGetDetailDto shape)', () => {
    component['entryDetail'] = {
      id: 'EN-1',
      listId: 'AL-1',
      applicationCode: 'APP-100',
      numberOfRespondents: 0,
      lodgementDate: '2025-11-01',
    };

    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged(null);
    expect(component.isUpdateDisabled).toBe(true);

    component.onStandardApplicantCodeChanged('SA-123');
    component['form'].controls.standardApplicantCode.setValue('SA-123', {
      emitEvent: false,
    });
    expect(component.isUpdateDisabled).toBe(false);
  });

  it('submitEntryUpdate sets errorFound + summaryErrors when entryDetail is missing (EntryUpdateDto-aware)', () => {
    component['entryDetail'] = null;

    const dummyDto = {
      applicationCode: 'APP-1',
      lodgementDate: '2026-01-01',
    };

    const dummyBanner = {
      heading: 'X',
      body: 'Y',
    };

    component['submitEntryUpdate'](dummyDto, dummyBanner);

    const state = component['appListEntryDetailState']();
    expect(state.errorFound).toBe(true);
    expect(Array.isArray(state.summaryErrors)).toBe(true);
    expect(state.summaryErrors.length).toBeGreaterThan(0);

    const found = state.summaryErrors.some((s) =>
      /Entry is not loaded/i.test(s.text),
    );
    expect(found).toBe(true);
  });

  it('runFullSubmitValidation returns true and sets errorFound when person name fields blank', () => {
    component['form'].controls.applicantType.setValue('person');

    const personForm = component.personGroup;
    const base = personForm.getRawValue();
    personForm.reset(
      { ...base, firstName: '', middleNames: '', surname: '' },
      { emitEvent: false },
    );

    const result = component['runFullSubmitValidation']();

    expect(result).toBe(true);
    expect(component['appListEntryDetailState']().errorFound).toBe(true);
  });

  it('runFullSubmitValidation includes civil fee child validation errors', () => {
    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged('SA-123');
    component['form'].controls.standardApplicantCode.setValue('SA-123', {
      emitEvent: false,
    });

    (component as never)['wordingSection'] = {
      validateForSubmit: () => [],
    } as never;
    (component as never)['civilFeeSection'] = {
      validateForSubmit: () => [
        { id: 'feeStatus', text: 'Select a fee status' },
      ],
    } as never;

    const result = component['runFullSubmitValidation']();

    expect(result).toBe(true);
    expect(component['appListEntryDetailState']().errorFound).toBe(true);
    expect(component['appListEntryDetailState']().summaryErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'feeStatus',
          text: 'Select a fee status',
        }),
      ]),
    );
  });

  it('persistHasOffsiteFee keeps isolated fee saves scoped to current app code only', () => {
    component['entryDetail'] = {
      id: 'EN-1',
      listId: 'AL-1',
      applicationCode: 'APP-100',
      notes: 'persisted note',
      numberOfRespondents: 0,
      lodgementDate: '2025-11-01',
    };

    component['appListEntryDetailPatch']({ appListId: 'AL-1' });
    component['form'].controls.applicationCode.setValue('APP-200', {
      emitEvent: false,
    });
    component['form'].controls.applicationNotes.controls.notes.setValue(
      'draft note',
      { emitEvent: false },
    );

    mockUpdateApplicationListEntry.mockClear();
    mockUpdateApplicationListEntry.mockReturnValueOnce(of({}));

    component['form'].controls.hasOffsiteFee.setValue(false, {
      emitEvent: false,
    });

    component['persistHasOffsiteFee'](true, false);

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);
    const callArgs = mockUpdateApplicationListEntry.mock.calls[0];
    const params = callArgs[0];

    expect(params.listId).toBe('AL-1');
    expect(params.entryId).toBe('EN-1');
    expect(params.entryUpdateDto).toBeDefined();
    expect(params.entryUpdateDto.applicationCode).toBe('APP-200');
    expect(params.entryUpdateDto.notes).toBe('persisted note');
    expect(params.entryUpdateDto.hasOffsiteFee).toBe(true);

    expect(component['persistedHasOffsiteFee']).toBe(true);
    expect(component['form'].controls.hasOffsiteFee.pristine).toBe(true);

    const state = component['appListEntryDetailState']();
    expect(state.successBanner).toBeTruthy();
  });

  it('onRemoveResult sets successBanner when removeResult succeeds', () => {
    component['appListEntryDetailPatch']({ appListId: 'AL-1' });

    const removeSpy = jest
      .spyOn(component.resultsFacade, 'removeResult')
      .mockImplementation((listId, entryId, resultId, onSuccess) => {
        if (onSuccess) {
          onSuccess();
        }
      });

    component.onRemoveResult('R-1');

    expect(removeSpy).toHaveBeenCalledTimes(1);

    const [listId, entryId, resultId] = removeSpy.mock.calls[0];
    expect(listId).toBe('AL-1');
    expect(entryId).toBe('EN-1');
    expect(resultId).toBe('R-1');

    const state = component['appListEntryDetailState']();
    expect(state.successBanner).toBeTruthy();
    expect(state.successBanner?.heading).toBe('Result removed');

    removeSpy.mockRestore();
  });

  it('onRemoveResult calls applyMappedError when removeResult errors', () => {
    component['appListEntryDetailPatch']({ appListId: 'AL-1' });

    const error = new Error('boom');

    component['applyMappedError'] = jest.fn();

    const removeSpy = jest
      .spyOn(component.resultsFacade, 'removeResult')
      .mockImplementation(
        (_listId, _entryId, _resultId, _onSuccess, onError) => {
          if (onError) {
            onError(error);
          }
        },
      );

    component.onRemoveResult('R-1');

    const calls = (component['applyMappedError'] as jest.Mock).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe(error);

    removeSpy.mockRestore();
  });

  it('onOffsiteFeeChanged does nothing when value has not changed', () => {
    component['persistedHasOffsiteFee'] = true;

    const spy = jest.spyOn(component as never, 'persistHasOffsiteFee');

    component.onOffsiteFeeChanged(true);

    expect(spy).not.toHaveBeenCalled();
  });

  it('onOffsiteFeeChanged calls persistHasOffsiteFee when value changes', () => {
    component['persistedHasOffsiteFee'] = false;

    const spy = jest.spyOn(component as never, 'persistHasOffsiteFee');

    component.onOffsiteFeeChanged(true);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(true, false);
  });

  it('onUpdateApplication returns early when validation fails (no submit called)', () => {
    component['form'].controls.applicantType.setValue('person');

    const personForm = component.personGroup;
    const base = personForm.getRawValue();
    personForm.reset(
      { ...base, firstName: '', middleNames: '', surname: '' },
      { emitEvent: false },
    );

    component['submitEntryUpdate'] = jest.fn();

    component.onUpdateApplication();

    expect(component['appListEntryDetailState']().formSubmitted).toBe(true);

    expect(component['submitEntryUpdate']).not.toHaveBeenCalled();
  });

  it('onUpdateApplication calls submitEntryUpdate when validation passes', () => {
    component['entryDetail'] = {
      id: 'EN-1',
      listId: 'AL-1',
      applicationCode: 'APP-100',
      numberOfRespondents: 0,
      lodgementDate: '2025-11-01',
    };

    const expectedDto = {
      applicationCode: 'APP-1',
      lodgementDate: '2026-01-01',
    };
    component['buildEntryUpdateDto'] = () => expectedDto;

    const submitMock = jest.fn();
    component['submitEntryUpdate'] = submitMock;

    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged('SA-123');
    component['form'].controls.standardApplicantCode.setValue('SA-123', {
      emitEvent: false,
    });

    component.onUpdateApplication();

    expect(submitMock).toHaveBeenCalledTimes(1);
    const callArgs = submitMock.mock.calls[0];
    expect(callArgs[0]).toEqual(expectedDto);
    expect(callArgs[1]).toBeTruthy();
  });

  it('onUpdateApplication returns early when validation fails (does not call submitEntryUpdate)', () => {
    component['form'].controls.applicantType.setValue('person');

    const personForm = component.personGroup;
    const base = personForm.getRawValue();
    personForm.reset(
      { ...base, firstName: '', middleNames: '', surname: '' },
      { emitEvent: false },
    );

    component['submitEntryUpdate'] = jest.fn();

    component.onUpdateApplication();

    expect(component['appListEntryDetailState']().formSubmitted).toBe(true);

    expect(component['submitEntryUpdate']).not.toHaveBeenCalled();
  });

  it('onUpdateApplication builds dto and calls submitEntryUpdate when validation passes', () => {
    component['entryDetail'] = {
      id: 'EN-1',
      listId: 'AL-1',
      applicationCode: 'APP-100',
      numberOfRespondents: 0,
      lodgementDate: '2025-11-01',
    };

    const expectedDto = {
      applicationCode: 'APP-1',
      lodgementDate: '2026-01-01',
    };
    component['buildEntryUpdateDto'] = () => expectedDto;

    const submitMock = jest.fn();
    component['submitEntryUpdate'] = submitMock;

    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged('SA-123');
    component['form'].controls.standardApplicantCode.setValue('SA-123', {
      emitEvent: false,
    });

    component.onUpdateApplication();

    expect(submitMock).toHaveBeenCalledTimes(1);
    const callArgs = submitMock.mock.calls[0];
    expect(callArgs[0]).toEqual(expectedDto);

    const bannerArg = callArgs[1];
    expect(bannerArg).toBeTruthy();
    expect(typeof bannerArg.heading).toBe('string');
  });

  it('persistHasOffsiteFee rolls back form value on API error', () => {
    // ensure we have a loaded entry and appListId set in state
    component['entryDetail'] = {
      id: 'EN-1',
      listId: 'AL-1',
      applicationCode: 'APP-100',
      numberOfRespondents: 0,
      lodgementDate: '2025-11-01',
    };
    component['appListEntryDetailPatch']({ appListId: 'AL-1' });

    // prepare API mock to error (use Observable that emits error)
    mockUpdateApplicationListEntry.mockClear();
    mockUpdateApplicationListEntry.mockReturnValueOnce(
      new Observable((subscriber) => {
        subscriber.error(new Error('boom'));
      }),
    );

    // set form control to nextValue initially true (we'll attempt to change to false but error should rollback to prevValue)
    component['form'].controls.hasOffsiteFee.setValue(true, {
      emitEvent: false,
    });
    // call method attempting to set nextValue = false, prevValue = true
    component['persistHasOffsiteFee'](false, true);

    // update API was attempted
    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);

    // After the API error, the control should have been rolled back to prevValue and marked pristine
    expect(component['form'].controls.hasOffsiteFee.value).toBe(true);
    expect(component['form'].controls.hasOffsiteFee.pristine).toBe(true);

    // Ensure error state is set on the component state (applyMappedError sets summaryErrors / errorHint)
    const state = component['appListEntryDetailState']();
    // We don't assert specific messages here; just that an error mapping produced summaryErrors or errorHint
    expect(
      state.errorFound || state.summaryErrors.length > 0 || state.errorHint,
    ).toBeTruthy();
  });

  it('persistHasOffsiteFee blocks the partial save when wording is invalid', () => {
    component['entryDetail'] = {
      id: 'EN-1',
      listId: 'AL-1',
      applicationCode: 'APP-100',
      numberOfRespondents: 0,
      lodgementDate: '2025-11-01',
    };
    component['appListEntryDetailPatch']({ appListId: 'AL-1' });
    component['form'].controls.hasOffsiteFee.setValue(true, {
      emitEvent: false,
    });

    (component as never)['wordingSection'] = {
      validateForSubmit: () => [
        { text: 'Enter a Court in the wording section', href: '#Court' },
      ],
    } as never;

    mockUpdateApplicationListEntry.mockClear();

    component['persistHasOffsiteFee'](false, true);

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();
    expect(component['form'].controls.hasOffsiteFee.value).toBe(true);
    expect(component['form'].controls.hasOffsiteFee.pristine).toBe(true);
    expect(component['appListEntryDetailState']().summaryErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Enter a Court in the wording section',
        }),
      ]),
    );
  });

  it('shows list-created success banner when listCreated=true query param is present', () => {
    (
      routeStub.snapshot as unknown as {
        queryParamMap: ReturnType<typeof convertToParamMap>;
      }
    ).queryParamMap = convertToParamMap({
      entryId: 'EN-1',
      appListId: 'AL-1',
      listCreated: 'true',
    });

    const freshFixture = TestBed.createComponent(ApplicationsListEntryDetail);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(
      freshComponent['appListEntryDetailState']().successBanner?.heading,
    ).toBe('Application list entry created');

    expect(
      freshComponent['appListEntryDetailState']().successBanner?.body,
    ).toBe('The application list entry has been created successfully.');
  });

  it('clearPaymentRefNavigationStateOnly removes payment reference nav state and preserves other keys', () => {
    history.replaceState(
      {
        paymentRefReturn: { updatedRowId: 'ROW-1', newPaymentReference: 'REF' },
        entryDetailSnapshot: { form: { wordingFields: [] } },
        keep: 'KEEP_ME',
      },
      '',
    );

    const replaceSpy = jest.spyOn(history, 'replaceState');

    const subject = component as unknown as {
      clearPaymentRefNavigationStateOnly: () => void;
    };

    subject.clearPaymentRefNavigationStateOnly();

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith({ keep: 'KEEP_ME' }, '');

    replaceSpy.mockRestore();
  });

  it('restores staged snapshot before applying payment reference update', () => {
    const readNavStateSpy = jest
      .spyOn(routingStateUtil, 'readNavState')
      .mockReturnValue({
        entryDetailSnapshot: {
          form: {
            applicantType: 'person',
            applicationCode: 'APP-200',
            lodgementDate: '2025-11-01',
            wordingFields: [
              { key: 'Court', value: 'New Court' },
              { key: 'Date', value: '2026-04-14' },
            ],
            feeStatuses: [
              {
                paymentStatus: 'Paid',
                statusDate: '2025-11-01',
                paymentReference: 'OLD',
              },
            ],
          },
          personForm: { firstName: 'Jane', surname: 'Doe' },
          organisationForm: { name: '' },
          respondentPersonForm: { firstName: '', surname: '' },
          respondentOrganisationForm: { name: '' },
          appCodeDetail: {
            applicationCode: 'APP-200',
            title: 'Staged title',
            wording: {
              template: 'At {{Court}} for {{Date}}',
              'substitution-key-constraints': [
                {
                  key: 'Court',
                  value: '',
                  constraint: {
                    length: 20,
                    type: TemplateConstraintTypeEnum.TEXT,
                  },
                },
                {
                  key: 'Date',
                  value: '',
                  constraint: {
                    length: 10,
                    type: TemplateConstraintTypeEnum.TEXT,
                  },
                },
              ],
            },
            bulkRespondentAllowed: false,
            isFeeDue: false,
            requiresRespondent: false,
            feeReference: undefined,
            startDate: '2025-01-01',
            endDate: null,
          },
          feeMeta: null,
          isFeeRequired: false,
          bulkApplicationsAllowed: false,
        },
        paymentRefReturn: {
          updatedRowId: 'Paid|2025-11-01',
          newPaymentReference: 'NEW',
        },
      });
    const updatePaymentReferenceSpy = jest
      .spyOn(civilFeeUtils, 'updatePaymentReferenceInFeeStatusesControl')
      .mockReturnValue({
        next: [
          {
            paymentStatus: 'Paid',
            statusDate: '2025-11-01',
            paymentReference: 'NEW',
          } as unknown as FeeStatus,
        ],
        changed: true,
      });

    mockUpdateApplicationListEntry.mockClear();

    const freshFixture = TestBed.createComponent(ApplicationsListEntryDetail);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(freshComponent['form'].controls.wordingFields.value).toEqual([
      { key: 'Court', value: 'New Court' },
      { key: 'Date', value: '2026-04-14' },
    ]);

    expect(mockUpdateApplicationListEntry).toHaveBeenCalled();
    expect(
      mockUpdateApplicationListEntry.mock.calls[0][0].entryUpdateDto
        .wordingFields,
    ).toEqual([
      { key: 'Court', value: 'New Court' },
      { key: 'Date', value: '2026-04-14' },
    ]);
    expect(
      mockUpdateApplicationListEntry.mock.calls[0][0].entryUpdateDto
        .applicationCode,
    ).toBe('APP-200');

    updatePaymentReferenceSpy.mockRestore();
    readNavStateSpy.mockRestore();
  });

  it('persistFeeStatus does not call update API when fee details are added but entryDetail is missing', () => {
    component['entryDetail'] = null;

    const payload: AddFeeDetailsPayload = {
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF1',
    };

    jest.spyOn(civilFeeUtils, 'updateFeeStatusesControl').mockReturnValue({
      next: [
        {
          paymentStatus: 'Paid',
          statusDate: '2026-01-10',
          paymentReference: 'REF1',
        } as unknown as FeeStatus,
      ],
      changed: true,
    });

    component.onAddFeeDetails(payload);

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();
  });

  it('onCodeSelected calls codes API and patches form when date is provided', () => {
    component['form'].patchValue({ lodgementDate: '' });

    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-1',
        title: 'Title for APP-1',
        wording: { template: '...' },
        bulkRespondentAllowed: false,
        isFeeDue: false,
        requiresRespondent: false,
        feeReference: undefined,
        startDate: '2025-01-01',
        endDate: null,
      } as ApplicationCodeGetDetailDto),
    );

    mockGetApplicationCodeByCodeAndDate.mockClear();

    component.onCodeSelected({ code: 'APP-1', date: '2025-11-01' });

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();

    expect(mockGetApplicationCodeByCodeAndDate).toHaveBeenCalledTimes(1);
    expect(mockGetApplicationCodeByCodeAndDate).toHaveBeenCalledWith(
      { code: 'APP-1', date: '2025-11-01' },
      'body',
      false,
      { transferCache: true },
    );

    expect(component['form'].controls.applicationCode.value).toBe('APP-1');
    expect(component['form'].controls.lodgementDate.value).toBe('2025-11-01');

    expect(component['appListEntryDetailState']().errorFound).toBe(false);
  });

  it('onCodeSelected fetches code detail, sets appCodeDetail and resets sections when code changed', () => {
    const resetSectionsSpy = jest.spyOn(
      component['formSvc'],
      'resetSectionsOnApplicationCodeChange',
    );

    component['appListEntryDetailPatch']({
      appCodeDetail: {
        applicationCode: 'OLD-CODE',
      } as ApplicationCodeGetDetailDto,
    });

    component['form'].patchValue({
      respondent: {
        person: {
          name: { firstForename: 'Old', surname: 'Respondent' },
          contactDetails: { addressLine1: '1 Street' },
        },
      },
      numberOfRespondents: 2,
    });
    component['form'].patchValue({ lodgementDate: '2025-11-01' });

    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-7',
        title: 'After update title',
        wording: { template: '... {test} ...' },
        bulkRespondentAllowed: false,
        isFeeDue: true,
        requiresRespondent: false,
        feeReference: 'CO7.2',
        feeDescription: 'Main fee description',
        feeAmount: { value: 2500, currency: 'GBP' },
        offsiteFeeReference: 'CO1.1',
        offsiteFeeDescription: 'Offsite fee description',
        offsiteFeeAmount: { value: 3000, currency: 'GBP' },
        startDate: '2025-01-01',
        endDate: null,
      } as ApplicationCodeGetDetailDto),
    );

    component.onCodeSelected({ code: 'APP-7', date: '2025-11-01' });

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();

    expect(component['form'].controls.applicationCode.value).toBe('APP-7');

    expect(
      component['appListEntryDetailState']().appCodeDetail?.applicationCode,
    ).toBe('APP-7');
    expect(component.feeMeta).toEqual({
      feeReference: 'CO7.2',
      feeDescription: 'Main fee description',
      feeAmount: { value: 2500, currency: 'GBP' },
      offsiteFeeReference: 'CO1.1',
      offsiteFeeDescription: 'Offsite fee description',
      offsiteFeeAmount: { value: 3000, currency: 'GBP' },
    });
    expect(component['appListEntryDetailState']().isFeeRequired).toBe(true);

    expect(resetSectionsSpy).toHaveBeenCalledWith(component.forms);
  });

  it('onCodeSelected preserves the existing lodgement date when clearing the code selection', () => {
    component['form'].patchValue({
      applicationCode: 'APP-7',
      lodgementDate: '2025-11-01',
    });

    mockGetApplicationCodeByCodeAndDate.mockClear();

    component.onCodeSelected({ code: '', date: '' });

    expect(component['form'].controls.applicationCode.value).toBe('');
    expect(component['form'].controls.lodgementDate.value).toBe('2025-11-01');
    expect(mockGetApplicationCodeByCodeAndDate).not.toHaveBeenCalled();
  });

  it('updateApplicantErrors validates person applicant: produces first name and last name errors', () => {
    component['form'].controls.applicantType.setValue('person');

    const personForm = component.personGroup;
    const base = personForm.getRawValue();
    personForm.reset(
      {
        ...base,
        firstName: '',
        middleNames: '',
        surname: '',
        addressLine1: '24 Walton Lane', // keep address so only names fail
      },
      { emitEvent: false },
    );

    component.onUpdateApplicant();

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();

    expect(component['appListEntryDetailState']().errorFound).toBe(true);

    const applicantErrors = component.applicantErrorItems;
    expect(Array.isArray(applicantErrors)).toBe(true);
    expect(applicantErrors.length).toBeGreaterThan(0);

    const hasFirstNameError = applicantErrors.some((e) =>
      /Enter a first name/i.test(e.text),
    );
    const hasSurnameError = applicantErrors.some((e) =>
      /Enter a last name/i.test(e.text),
    );

    expect(hasFirstNameError).toBe(true);
    expect(hasSurnameError).toBe(true);
  });

  it('onUpdateApplicant uses form service buildUpdateDto and calls update API', () => {
    const formSvc = TestBed.inject(ApplicationListEntryFormService);

    const dto: EntryUpdateDto = {
      lodgementDate: '2025-11-01',
      applicationCode: 'APP-100',
      standardApplicantCode: 'SA-999',
      applicant: undefined,
    } as unknown as EntryUpdateDto;

    jest.spyOn(formSvc, 'buildUpdateDto').mockReturnValue(dto);

    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged('SA-999');
    component['form'].controls.standardApplicantCode.setValue('SA-999', {
      emitEvent: false,
    });

    component.onUpdateApplicant();

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);

    const [params, observe, reportProgress, options] =
      mockUpdateApplicationListEntry.mock.calls[0];

    expect(params).toEqual(
      expect.objectContaining({
        listId: 'AL-1',
        entryId: 'EN-1',
        entryUpdateDto: dto,
      }),
    );

    expect(observe).toBe('body');
    expect(reportProgress).toBe(false);
    expect(options).toEqual(expect.objectContaining({ transferCache: false }));

    expect(component['appListEntryDetailState']().successBanner?.heading).toBe(
      'Applicant updated',
    );
  });

  it('onUpdateApplicant (standard) blocks submit when no standard applicant selected (validator-driven)', () => {
    // Make it “standard” but keep selection empty
    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged(null);

    component.onUpdateApplicant();

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();
    expect(component['appListEntryDetailState']().errorFound).toBe(true);

    expect(
      component['appListEntryDetailState']().summaryErrors.some((e) =>
        /standard applicant/i.test(e.text),
      ),
    ).toBe(true);
  });

  it('onUpdateApplicant blocks submit when respondent organisation is invalid', () => {
    component['appListEntryDetailPatch']({
      appCodeDetail: {
        requiresRespondent: true,
      } as ApplicationCodeGetDetailDto,
    });

    const formSvc = TestBed.inject(ApplicationListEntryFormService);
    jest.spyOn(formSvc, 'buildUpdateDto').mockReturnValue({} as EntryUpdateDto);

    component['form'].patchValue({ respondentEntryType: 'organisation' });
    const orgForm = component['forms'].respondentOrganisationForm;
    const base = orgForm.getRawValue();

    orgForm.reset(
      {
        ...base,
        name: '',
        addressLine1: '',
      },
      { emitEvent: false },
    );

    orgForm.markAllAsTouched();
    orgForm.updateValueAndValidity({ emitEvent: false });

    component['form'].controls.applicantType.setValue('standard');
    component.onStandardApplicantCodeChanged('SA-999');

    component.onUpdateApplicant();

    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();
    expect(component['appListEntryDetailState']().errorFound).toBe(true);

    expect(
      component['appListEntryDetailState']().summaryErrors.some((e) =>
        /organisation name/i.test(e.text),
      ),
    ).toBe(true);
  });

  it('toEntryDetailPatch maps wordingFields to values and preserves other fields', () => {
    component['entryDetail'] = {
      wording: {
        template: 'At {{courtName}} for {{organisationName}}',
        'substitution-key-constraints': [
          { key: 'courtName', value: 'Old Court', constraint: { length: 20 } },
          {
            key: 'organisationName',
            value: 'Old Org',
            constraint: { length: 20 },
          },
        ],
      },
    } as EntryGetDetailDto;

    const entryUpdateDto = {
      applicationCode: 'APP-200',
      lodgementDate: '2026-01-01',
      wordingFields: [
        { key: 'courtName', value: 'Court A' },
        { key: 'organisationName', value: 'Org B' },
      ],
    } as unknown as EntryUpdateDto;

    const patch = (
      component as unknown as {
        toEntryDetailPatch: (
          dto: EntryUpdateDto,
        ) => Partial<EntryGetDetailDto> & { wordingFields?: string[] };
      }
    ).toEntryDetailPatch(entryUpdateDto);

    expect(patch).toEqual(
      expect.objectContaining({
        applicationCode: 'APP-200',
        lodgementDate: '2026-01-01',
        wordingFields: ['Court A', 'Org B'],
        wording: {
          template: 'At {{courtName}} for {{organisationName}}',
          'substitution-key-constraints': [
            {
              key: 'courtName',
              value: 'Court A',
              constraint: { length: 20 },
            },
            {
              key: 'organisationName',
              value: 'Org B',
              constraint: { length: 20 },
            },
          ],
        },
      }),
    );
  });

  it('getWordingObjectValues prefers staged form wording over entry detail wording', () => {
    component['form'].controls.wordingFields.setValue([
      { key: 'Court', value: 'Court B' },
      { key: 'Date', value: '2026-05-01' },
    ]);

    expect(
      component.getWordingObjectValues({
        template: 'At {{Court}} for {{Date}}',
        'substitution-key-constraints': [
          {
            key: 'Court',
            value: 'Court A',
            constraint: {
              length: 20,
              type: TemplateConstraintTypeEnum.TEXT,
            },
          },
          {
            key: 'Date',
            value: '2026-04-13',
            constraint: {
              length: 10,
              type: TemplateConstraintTypeEnum.DATE,
            },
          },
        ],
      }),
    ).toEqual({
      template: 'At {{Court}} for {{Date}}',
      'substitution-key-constraints': [
        {
          key: 'Court',
          value: 'Court B',
          constraint: { length: 20, type: TemplateConstraintTypeEnum.TEXT },
        },
        {
          key: 'Date',
          value: '2026-05-01',
          constraint: { length: 10, type: TemplateConstraintTypeEnum.DATE },
        },
      ],
    });
  });

  it('mergeEntryDetailUpdate applies patch and lets response override', () => {
    component['entryDetail'] = {
      applicationCode: 'APP-100',
      lodgementDate: '2025-11-01',
      wordingFields: ['Old wording'],
      feeStatuses: [],
    } as unknown as EntryDetailWithWordingSnapshot;

    const entryUpdateDto = {
      applicationCode: 'APP-200',
      wordingFields: [{ key: 'courtName', value: 'Court A' }],
      feeStatuses: [],
    } as unknown as EntryUpdateDto;

    const res = {
      applicationCode: 'APP-300',
      respondent: { organisation: { name: 'Org X' } },
    } as Partial<EntryGetDetailDto>;

    (
      component as unknown as {
        mergeEntryDetailUpdate: (
          dto: EntryUpdateDto,
          res: Partial<EntryGetDetailDto> | null | undefined,
        ) => void;
      }
    ).mergeEntryDetailUpdate(entryUpdateDto, res);

    expect(component['entryDetail']?.applicationCode).toBe('APP-300');
    expect(
      (component['entryDetail'] as EntryDetailWithWordingSnapshot)
        ?.wordingFields,
    ).toEqual(['Court A']);
    expect(component['entryDetail']?.respondent).toEqual(res.respondent);
  });

  it('mergeEntryDetailUpdate uses patch when response is empty', () => {
    component['entryDetail'] = {
      applicationCode: 'APP-100',
      wordingFields: ['Old wording'],
      feeStatuses: [],
    } as unknown as EntryDetailWithWordingSnapshot;

    const entryUpdateDto = {
      applicationCode: 'APP-200',
      wordingFields: [{ key: 'courtName', value: 'Court A' }],
      feeStatuses: [],
    } as unknown as EntryUpdateDto;

    (
      component as unknown as {
        mergeEntryDetailUpdate: (
          dto: EntryUpdateDto,
          res: Partial<EntryGetDetailDto> | null | undefined,
        ) => void;
      }
    ).mergeEntryDetailUpdate(entryUpdateDto, {});

    expect(component['entryDetail']?.applicationCode).toBe('APP-200');
    expect(
      (component['entryDetail'] as EntryDetailWithWordingSnapshot)
        ?.wordingFields,
    ).toEqual(['Court A']);
  });

  it('onCodeSelected sets isFeeRequired from app-code response isFeeDue', () => {
    component['form'].patchValue({ lodgementDate: '2025-11-01' });

    mockGetApplicationCodeByCodeAndDate.mockReturnValue(
      of({
        applicationCode: 'APP-1',
        title: 'Title for APP-1',
        wording: { template: '...' },
        bulkRespondentAllowed: false,
        isFeeDue: true,
        requiresRespondent: false,
        feeReference: undefined,
        startDate: '2025-01-01',
        endDate: null,
      } as ApplicationCodeGetDetailDto),
    );

    component.onCodeSelected({ code: 'APP-1', date: '2025-11-01' });

    expect(component['appListEntryDetailState']().isFeeRequired).toBe(true);
  });

  it('onAddFeeDetails: when helper returns changed=false, does not call update API', () => {
    const spy = jest
      .spyOn(civilFeeUtils, 'updateFeeStatusesControl')
      .mockReturnValue({ next: [], changed: false });

    const payload: AddFeeDetailsPayload = {
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF1',
    };

    component.onAddFeeDetails(payload);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('onAddFeeDetails: when helper returns changed=true, uses current app code without persisting unrelated drafts', () => {
    const next: FeeStatus[] = [
      {
        paymentStatus: 'Paid',
        statusDate: '2026-01-10',
        paymentReference: 'REF1',
      } as unknown as FeeStatus,
    ];

    const spy = jest
      .spyOn(civilFeeUtils, 'updateFeeStatusesControl')
      .mockReturnValue({ next, changed: true });

    const payload: AddFeeDetailsPayload = {
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF1',
    };

    component['entryDetail'] = {
      id: 'EN-1',
      listId: 'AL-1',
      applicationCode: 'APP-100',
      notes: 'persisted note',
      numberOfRespondents: 0,
      lodgementDate: '2025-11-01',
    };
    component['form'].controls.applicationCode.setValue('APP-200', {
      emitEvent: false,
    });
    component['form'].controls.applicationNotes.controls.notes.setValue(
      'draft note',
      { emitEvent: false },
    );

    component.onAddFeeDetails(payload);

    expect(spy).toHaveBeenCalledTimes(1);

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);
    const call = mockUpdateApplicationListEntry.mock.calls[0];
    const params = call[0];

    expect(params.listId).toBe('AL-1');
    expect(params.entryId).toBe('EN-1');
    expect(params.entryUpdateDto).toEqual(
      expect.objectContaining({
        applicationCode: 'APP-200',
        notes: 'persisted note',
        feeStatuses: next,
      }),
    );

    spy.mockRestore();
  });

  it('onAddFeeDetails rolls back feeStatuses when update API errors', () => {
    const previous: FeeStatus[] = [
      {
        paymentStatus: 'UNDERTAKEN',
        statusDate: '2026-01-09',
        paymentReference: 'OLD',
      } as unknown as FeeStatus,
    ];
    const next: FeeStatus[] = [
      ...previous,
      {
        paymentStatus: 'PAID',
        statusDate: '2026-01-10',
        paymentReference: 'NEW',
      } as unknown as FeeStatus,
    ];

    component.form.controls.feeStatuses.setValue(previous, {
      emitEvent: false,
    });

    const helperSpy = jest
      .spyOn(civilFeeUtils, 'updateFeeStatusesControl')
      .mockReturnValue({ next, changed: true });

    mockUpdateApplicationListEntry.mockClear();
    mockUpdateApplicationListEntry.mockReturnValueOnce(
      new Observable((subscriber) => {
        subscriber.error(new Error('boom'));
      }),
    );

    const payload: AddFeeDetailsPayload = {
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'NEW',
    };

    component.onAddFeeDetails(payload);

    expect(component.form.controls.feeStatuses.value).toEqual(previous);
    expect(component.form.controls.feeStatuses.pristine).toBe(true);

    helperSpy.mockRestore();
  });

  it('applyPaymentRefReturn: when helper returns changed=false, does not call update API', () => {
    const spy = jest
      .spyOn(civilFeeUtils, 'updatePaymentReferenceInFeeStatusesControl')
      .mockReturnValue({ next: [], changed: false });

    const subject = component as unknown as PaymentRefApplier;

    subject.applyPaymentRefReturn('ROW-1', 'NEW');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(mockUpdateApplicationListEntry).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('applyPaymentRefReturn: when helper returns changed=true, persists feeStatuses via update API', () => {
    const next: FeeStatus[] = [
      {
        paymentStatus: 'Paid',
        statusDate: '2026-01-10',
        paymentReference: 'NEW',
      } as unknown as FeeStatus,
    ];

    const spy = jest
      .spyOn(civilFeeUtils, 'updatePaymentReferenceInFeeStatusesControl')
      .mockReturnValue({ next, changed: true });

    const subject = component as unknown as PaymentRefApplier;
    subject.applyPaymentRefReturn('ROW-1', '  NEW  ');

    expect(spy).toHaveBeenCalledTimes(1);

    expect(mockUpdateApplicationListEntry).toHaveBeenCalledTimes(1);
    const call = mockUpdateApplicationListEntry.mock.calls[0];
    const params = call[0];

    expect(params.listId).toBe('AL-1');
    expect(params.entryId).toBe('EN-1');
    expect(params.entryUpdateDto).toEqual(
      expect.objectContaining({
        feeStatuses: next,
      }),
    );

    spy.mockRestore();
  });

  it('applyPaymentRefReturn rolls back feeStatuses when update API errors', () => {
    const previous: FeeStatus[] = [
      {
        paymentStatus: 'UNDERTAKEN',
        statusDate: '2026-01-10',
        paymentReference: 'OLD',
      } as unknown as FeeStatus,
    ];
    const next: FeeStatus[] = [
      {
        paymentStatus: 'UNDERTAKEN',
        statusDate: '2026-01-10',
        paymentReference: 'NEW',
      } as unknown as FeeStatus,
    ];

    component.form.controls.feeStatuses.setValue(previous, {
      emitEvent: false,
    });

    const helperSpy = jest
      .spyOn(civilFeeUtils, 'updatePaymentReferenceInFeeStatusesControl')
      .mockReturnValue({ next, changed: true });

    mockUpdateApplicationListEntry.mockClear();
    mockUpdateApplicationListEntry.mockReturnValueOnce(
      new Observable((subscriber) => {
        subscriber.error(new Error('boom'));
      }),
    );

    const subject = component as unknown as PaymentRefApplier;
    subject.applyPaymentRefReturn('ROW-1', 'NEW');

    expect(component.form.controls.feeStatuses.value).toEqual(previous);
    expect(component.form.controls.feeStatuses.pristine).toBe(true);

    helperSpy.mockRestore();
  });

  it('onChildErrors stores resultWording child errors', () => {
    const errors = [{ text: 'Enter a Date in the result wording section' }];

    component.onChildErrors('resultWording', errors);

    expect(component['childErrors'].resultWording).toEqual(errors);
  });

  it('onSubmitResults calls results facade submitResultChanges', () => {
    const updateSpy = jest
      .spyOn(component.resultsFacade, 'submitResultChanges')
      .mockImplementation();

    component.onSubmitResults({
      pendingToCreate: [],
      existingToUpdate: [
        {
          resultId: 'R-1',
          resultCode: 'RC1',
          wordingFields: [{ key: 'Date', value: '2026-03-04' }],
        },
      ],
    });

    expect(updateSpy).toHaveBeenCalledWith(
      'AL-1',
      'EN-1',
      {
        pendingToCreate: [],
        existingToUpdate: [
          {
            resultId: 'R-1',
            resultCode: 'RC1',
            wordingFields: [{ key: 'Date', value: '2026-03-04' }],
          },
        ],
      },
      expect.any(Function),
      expect.any(Function),
    );
  });
});

describe('officials mapping', () => {
  const createFormValue = (
    overrides: Partial<ApplicationsListEntryFormValue> = {},
  ): ApplicationsListEntryFormValue =>
    ({
      applicationTitle: null,
      applicantType: 'person',
      applicant: null,
      standardApplicantCode: null,
      applicationCode: null,
      respondentEntryType: 'person',
      respondent: null,
      numberOfRespondents: null,
      wordingFields: null,
      feeStatuses: null,
      hasOffsiteFee: null,
      feeStatus: null,
      feeStatusDate: null,
      paymentRef: null,
      applicationNotes: {
        notes: null,
        caseReference: null,
        accountReference: null,
      },
      lodgementDate: null,
      courtName: null,
      organisationName: null,
      accountReference: null,
      applicationDetails: null,
      resultCode: null,
      mags1Title: null,
      mags1FirstName: null,
      mags1Surname: null,
      mags2Title: null,
      mags2FirstName: null,
      mags2Surname: null,
      mags3Title: null,
      mags3FirstName: null,
      mags3Surname: null,
      officialTitle: null,
      officialFirstName: null,
      officialSurname: null,
      ...overrides,
    }) as ApplicationsListEntryFormValue;

  describe('buildOfficialsFromFormValue', () => {
    it('returns empty object when no magistrate or official names are filled', () => {
      const result = buildOfficialsFromFormValue(createFormValue());

      expect(result).toEqual({});
    });

    it('builds magistrate officials when first name and surname are filled and trims values', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          mags1Title: ' mr ',
          mags1FirstName: ' John ',
          mags1Surname: ' Smith ',
          mags2Title: 'dr',
          mags2FirstName: ' Jane ',
          mags2Surname: ' Doe ',
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.MAGISTRATE,
            title: 'mr',
            forename: 'John',
            surname: 'Smith',
          },
          {
            type: OfficialType.MAGISTRATE,
            title: 'dr',
            forename: 'Jane',
            surname: 'Doe',
          },
        ],
      });
    });

    it('includes a magistrate when only first name is filled', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          mags1FirstName: 'OnlyFirst',
          mags1Surname: null,
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.MAGISTRATE,
            title: undefined,
            forename: 'OnlyFirst',
            surname: undefined,
          },
        ],
      });
    });

    it('includes a magistrate when only surname is filled', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          mags1FirstName: '   ',
          mags1Surname: 'OnlySurname',
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.MAGISTRATE,
            title: undefined,
            forename: undefined,
            surname: 'OnlySurname',
          },
        ],
      });
    });

    it('builds clerk official when official names are filled', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          officialTitle: ' ms ',
          officialFirstName: ' Alice ',
          officialSurname: ' Brown ',
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.CLERK,
            title: 'ms',
            forename: 'Alice',
            surname: 'Brown',
          },
        ],
      });
    });

    it('returns magistrates first and clerk last when both exist', () => {
      const result = buildOfficialsFromFormValue(
        createFormValue({
          mags1FirstName: 'Mag',
          mags1Surname: 'One',
          officialFirstName: 'Clerk',
          officialSurname: 'User',
        }),
      );

      expect(result).toEqual({
        officials: [
          {
            type: OfficialType.MAGISTRATE,
            title: undefined,
            forename: 'Mag',
            surname: 'One',
          },
          {
            type: OfficialType.CLERK,
            title: undefined,
            forename: 'Clerk',
            surname: 'User',
          },
        ],
      });
    });
  });

  describe('officialsToFormPatch', () => {
    it('returns empty object when officials is undefined', () => {
      expect(officialsToFormPatch(undefined)).toEqual({});
    });

    it('returns empty object when officials is null', () => {
      expect(officialsToFormPatch(null)).toEqual({});
    });

    it('returns empty object when officials is empty', () => {
      expect(officialsToFormPatch([])).toEqual({});
    });

    it('maps magistrates into form slots in order', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.MAGISTRATE,
          title: 'Mr',
          forename: 'John',
          surname: 'Smith',
        },
        {
          type: OfficialType.MAGISTRATE,
          title: 'Mrs',
          forename: 'Jane',
          surname: 'Doe',
        },
      ]);

      expect(result).toEqual(
        expect.objectContaining({
          mags1Title: 'mr',
          mags1FirstName: 'John',
          mags1Surname: 'Smith',
          mags2Title: 'mrs',
          mags2FirstName: 'Jane',
          mags2Surname: 'Doe',
        }),
      );
    });

    it('maps clerk into official fields', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.CLERK,
          title: 'Dr',
          forename: 'Alex',
          surname: 'Taylor',
        },
      ]);

      expect(result).toEqual({
        officialTitle: 'dr',
        officialFirstName: 'Alex',
        officialSurname: 'Taylor',
      });
    });

    it('maps null clerk names back to empty string', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.CLERK,
          title: undefined,
          forename: undefined,
          surname: undefined,
        },
      ]);

      expect(result).toEqual({
        officialTitle: '',
        officialFirstName: null,
        officialSurname: null,
      });
    });

    it('only maps the first three magistrates', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.MAGISTRATE,
          title: 'Mr',
          forename: 'One',
          surname: 'A',
        },
        {
          type: OfficialType.MAGISTRATE,
          title: 'Mrs',
          forename: 'Two',
          surname: 'B',
        },
        {
          type: OfficialType.MAGISTRATE,
          title: 'Miss',
          forename: 'Three',
          surname: 'C',
        },
        {
          type: OfficialType.MAGISTRATE,
          title: 'Dr',
          forename: 'Four',
          surname: 'D',
        },
      ]);

      expect(result).toEqual(
        expect.objectContaining({
          mags1Title: 'mr',
          mags1FirstName: 'One',
          mags1Surname: 'A',
          mags2Title: 'mrs',
          mags2FirstName: 'Two',
          mags2Surname: 'B',
          mags3Title: 'miss',
          mags3FirstName: 'Three',
          mags3Surname: 'C',
        }),
      );

      expect(result).not.toEqual(
        expect.objectContaining({
          mags4Title: expect.anything(),
        }),
      );
    });

    it('maps both magistrates and clerk in one patch', () => {
      const result = officialsToFormPatch([
        {
          type: OfficialType.MAGISTRATE,
          title: 'mr',
          forename: 'John',
          surname: 'Smith',
        },
        {
          type: OfficialType.CLERK,
          title: 'other',
          forename: 'Clara',
          surname: 'Jones',
        },
      ]);

      expect(result).toEqual({
        mags1Title: 'mr',
        mags1FirstName: 'John',
        mags1Surname: 'Smith',
        officialTitle: 'other',
        officialFirstName: 'Clara',
        officialSurname: 'Jones',
      });
    });
  });
});
