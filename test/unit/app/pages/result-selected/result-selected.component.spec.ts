import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ResultSelected } from '@components/result-selected/result-selected.component';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import {
  ApplicationListEntryResultsApi,
  CreateApplicationListEntryResultRequestParams,
  ResultGetDto,
  UpdateApplicationListEntryResultRequestParams,
} from '@openapi';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';
import * as errorClick from '@util/error-click';

describe('ResultSelectedComponent', () => {
  let component: ResultSelected;
  let fixture: ComponentFixture<ResultSelected>;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({
        id: '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
      }),
    },
  };

  const makeResultDto = (id: string, seq?: number): ResultGetDto =>
    ({
      id,
      sequenceNumber: seq,
    }) as unknown as ResultGetDto;

  let mockApi: {
    createApplicationListEntryResult: jest.Mock;
    updateApplicationListEntryResult: jest.Mock;
  };

  beforeEach(async () => {
    mockApi = {
      createApplicationListEntryResult: jest
        .fn()
        .mockReturnValue(of(makeResultDto('x', 1))),
      updateApplicationListEntryResult: jest.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [ResultSelected],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ApplicationListEntryResultsApi, useValue: mockApi },
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultSelected);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should set rows and mixed flag from history.state when present', () => {
    const sampleRows = [
      { id: 'r1', sequenceNumber: '1' },
      { id: 'r2', sequenceNumber: '2' },
    ] as ApplicationEntriesResultContext[];

    history.replaceState(
      {
        resultingApplications: sampleRows,
        mixedResultedAndUnresultedApplications: true,
      },
      '',
    );

    component.ngOnInit();

    expect(component.listId).toBe('73d0276f-42a3-4150-b2fd-d9b2d56b359c');
    expect(component.rows).toEqual(sampleRows);
    expect(component.mixedResultedAndUnresultedApplications).toBeTruthy();
  });

  it('onPendingChange should call facade.setPending with provided rows', () => {
    const setPendingSpy = jest.spyOn(
      ApplicationListEntryResultsFacade.prototype,
      'setPending',
    );

    const pendingRows: PendingResultRow[] = [
      {
        kind: 'pending',
        tempId: 'temp-001',
        resultCode: 'RC001',
        display: 'Sample Result Display',
        wordingFields: [
          {
            key: 'Applicant officer',
            value: '12345678',
          },
          {
            key: 'date',
            value: '31/12/2026',
          },
        ],
        wording: 'This is a test 12345678 with a 31/12/2026',
      } as PendingResultRow,
    ];

    component.onPendingChange(pendingRows);

    expect(setPendingSpy).toHaveBeenCalledTimes(1);
    expect(setPendingSpy).toHaveBeenCalledWith(pendingRows);
  });

  it('onSubmitResults returns early if listId missing or rows empty (no API calls)', () => {
    component.listId = '';
    component.rows = [];

    mockApi.createApplicationListEntryResult.mockClear();

    component.onSubmitResults({
      pendingToCreate: [],
      pendingToRemove: [],
    } as unknown as ResultSectionSubmitPayload);

    expect(mockApi.createApplicationListEntryResult).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('onRemoveResult success path: calls facade.removeResult and sets success banner', () => {
    component.listId = 'list-123';

    // get the exact facade instance used by the component
    const facadeInstance = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;

    // narrow interface for what we interact with in this test
    type FacadeShape = {
      newlyCreatedEntryResults: () => ResultGetDto[];
      removeResult: (
        listId: string,
        entryId: string,
        resultId: string,
        onSuccess?: () => void,
        onError?: (err: unknown) => void,
      ) => void;
      clearCreatedEntryResults: () => void;
    };

    const facade = facadeInstance as unknown as FacadeShape;

    const createdResult: ResultGetDto = {
      id: 'result-xyz',
      entryId: '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
    } as ResultGetDto;

    // 1) Ensure the facade reports the created result (so entryMap is non-empty)
    const newlyCreatedSpy = jest
      .spyOn(facade, 'newlyCreatedEntryResults')
      .mockReturnValue([createdResult]);

    // 2) Stub clearCreatedEntryResults on the same instance so it doesn't call the real .set()
    const clearCreatedSpy = jest
      .spyOn(facade, 'clearCreatedEntryResults')
      .mockImplementation(() => {});

    // 3) Spy removeResult and simulate a successful removal by invoking onSuccess()
    const removeSpy = jest
      .spyOn(facade, 'removeResult')
      .mockImplementation(
        (
          _listId: string,
          _entryId: string,
          _resultId: string,
          onSuccess?: () => void,
        ): void => {
          onSuccess?.();
        },
      );

    // spy the component's success banner setter
    const successBannerSpy = jest.spyOn(component.successBanner, 'set');

    // Act
    component.onRemoveResult('result-xyz');

    // Assert
    expect(removeSpy).toHaveBeenCalledWith(
      'list-123',
      '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
      'result-xyz',
      expect.any(Function),
      expect.any(Function),
    );

    expect(successBannerSpy).toHaveBeenCalledWith(
      ENTRY_SUCCESS_MESSAGES.resultsRemoved,
    );

    // cleanup
    successBannerSpy.mockRestore();
    removeSpy.mockRestore();
    clearCreatedSpy.mockRestore();
    newlyCreatedSpy.mockRestore();
  });

  it('onSubmitResults - partial-failure path: mixed results, error summary contains failing sequence, sets failure flag', () => {
    component.listId = 'list-partial';
    component.rows = [
      {
        id: 'ok',
        sequenceNumber: '10',
        applicant: 'A',
        respondent: 'R',
        title: 'T',
      },
      {
        id: 'bad',
        sequenceNumber: '20',
        applicant: 'B',
        respondent: 'S',
        title: 'U',
      },
    ] as ApplicationEntriesResultContext[];

    mockApi.createApplicationListEntryResult.mockImplementation(
      (params: CreateApplicationListEntryResultRequestParams) => {
        if (params.entryId === 'ok') {
          return of(makeResultDto('ok', 10));
        }
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              statusText: 'Server Error',
            }),
        );
      },
    );

    const focusSpy = jest
      .spyOn(errorClick, 'focusErrorSummary')
      .mockImplementation(() => {});
    const errorSummarySetSpy = jest.spyOn(component.errorSummaryItems, 'set');
    const successBannerSetSpy = jest.spyOn(component.successBanner, 'set');

    component.onSubmitResults({
      pendingToCreate: [
        {
          kind: 'pending',
          tempId: 'tmp_ebf79d63-080b-46fa-938a-f5d82874b234',
          resultCode: 'ADJ',
          display: 'ADJ - Adjourned',
          wordingFields: [],
          wording: '-',
        },
      ],
      existingToUpdate: [],
    } as ResultSectionSubmitPayload);

    expect(mockApi.createApplicationListEntryResult).toHaveBeenCalledTimes(2);
    expect(component.idToSequenceNumberMap).toEqual({ ok: '10', bad: '20' });

    const batchResults = component.batchResults;
    expect(batchResults).toHaveLength(2);

    const okResult = batchResults.find((r) => r.id === 'ok');
    const badResult = batchResults.find((r) => r.id === 'bad');

    expect(okResult).toBeDefined();
    expect(okResult?.success).toBe(true);

    expect(badResult).toBeDefined();
    expect(badResult?.success).toBe(false);

    if (badResult && 'error' in badResult) {
      expect(badResult.error).toBeInstanceOf(HttpErrorResponse);
    } else {
      fail('Expected failing BatchResult to contain an error property');
    }

    expect(errorSummarySetSpy).toHaveBeenCalledTimes(1);
    const errorItemsArg = errorSummarySetSpy.mock.calls[0][0];
    expect(errorItemsArg).toHaveLength(1);
    expect(errorItemsArg[0].text).toContain(
      'Sequence number 20 failed to update',
    );

    expect(successBannerSetSpy).toHaveBeenCalledWith(null);
    expect(component.isSubmitting()).toBe(false);

    const injectedPlatformId = TestBed.inject(PLATFORM_ID);
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(focusSpy).toHaveBeenCalledWith(injectedPlatformId);

    focusSpy.mockRestore();
  });

  it('onSubmitResults - when an existing result for an entry exists it calls update API and treats response as success', () => {
    component.listId = 'list-update';
    component.rows = [
      {
        id: 'r1',
        sequenceNumber: '1',
        applicant: 'Applicant 1',
        respondent: 'Respondent 1',
        title: 'Title 1',
      },
    ] as ApplicationEntriesResultContext[];

    const existingToUpdateItem = {
      kind: 'existing',
      id: 'real-result-id',
      resultCode: 'UPD',
      display: 'UPD - Updated',
      wordingFields: [{ key: 'k-upd', value: 'v-upd' }],
      wording: 'w-upd',
    };

    const payload: ResultSectionSubmitPayload = {
      pendingToCreate: [],
      existingToUpdate: [existingToUpdateItem],
    } as unknown as ResultSectionSubmitPayload;

    const existingResultDto: ResultGetDto = {
      id: 'existing-result-123',
      entryId: 'r1',
      sequenceNumber: 1,
    } as unknown as ResultGetDto;

    const facadeInstance = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;
    jest
      .spyOn(facadeInstance, 'newlyCreatedEntryResults')
      .mockReturnValue([existingResultDto]);

    mockApi.updateApplicationListEntryResult = jest
      .fn()
      .mockImplementation(
        (requestParameters: UpdateApplicationListEntryResultRequestParams) =>
          of(makeResultDto(requestParameters.entryId, 1)),
      );

    component.onSubmitResults(payload);

    expect(mockApi.updateApplicationListEntryResult).toHaveBeenCalledTimes(1);

    const calledWith =
      mockApi.updateApplicationListEntryResult.mock.calls[0][0];
    expect(calledWith.listId).toBe('list-update');
    expect(calledWith.entryId).toBe('r1');
    expect(calledWith.resultId).toBe('existing-result-123');
    expect(calledWith.resultUpdateDto.resultCode).toBe('UPD');
    expect(calledWith.resultUpdateDto.wordingFields).toEqual([
      { key: 'k-upd', value: 'v-upd' },
    ]);

    expect(component.successBanner()).toEqual({
      heading: 'Result codes applied successfully',
      body: "Result code 'UPD' applied successfully to application list entries",
    });

    expect(component.batchResults).toHaveLength(1);
    expect(component.batchResults[0].id).toBe('r1');
    expect(component.batchResults[0].success).toBe(true);
  });

  it('onRemoveResult returns early when listId is missing (no facade call)', () => {
    component.listId = '';

    const facadeInstance = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;

    const removeSpy = jest.spyOn(facadeInstance, 'removeResult');

    component.onRemoveResult('result-1');

    expect(removeSpy).not.toHaveBeenCalled();

    removeSpy.mockRestore();
  });

  it('onRemoveResult success path: calls facade.removeResult and sets success banner', () => {
    component.listId = 'list-123';

    type FacadeShape = {
      newlyCreatedEntryResults: () => ResultGetDto[];
      removeResult: (
        listId: string,
        entryId: string,
        resultId: string,
        onSuccess?: () => void,
        onError?: (err: unknown) => void,
      ) => void;
    };

    const facade = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade as unknown as FacadeShape;

    const createdResult: ResultGetDto = {
      id: 'result-xyz',
      entryId: '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
    } as ResultGetDto;

    const newlyCreatedSpy = jest
      .spyOn(facade, 'newlyCreatedEntryResults')
      .mockReturnValue([createdResult]);

    const removeSpy = jest
      .spyOn(facade, 'removeResult')
      .mockImplementation(
        (
          _listId: string,
          _entryId: string,
          _resultId: string,
          onSuccess?: () => void,
        ): void => {
          onSuccess?.();
        },
      );

    const successBannerSpy = jest.spyOn(component.successBanner, 'set');

    component.onRemoveResult('result-xyz');

    expect(removeSpy).toHaveBeenCalledWith(
      'list-123',
      '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
      'result-xyz',
      expect.any(Function),
      expect.any(Function),
    );

    expect(successBannerSpy).toHaveBeenCalledWith(
      ENTRY_SUCCESS_MESSAGES.resultsRemoved,
    );

    // cleanup
    successBannerSpy.mockRestore();
    removeSpy.mockRestore();
    newlyCreatedSpy.mockRestore();
  });

  it('onRemoveResult error path: calls facade and applies mapped error', () => {
    component.listId = 'list-456';

    type FacadeShape = {
      newlyCreatedEntryResults: () => ResultGetDto[];
      removeResult: (
        listId: string,
        entryId: string,
        resultId: string,
        onSuccess?: () => void,
        onError?: (err: unknown) => void,
      ) => void;
    };

    const facade = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade as unknown as FacadeShape;

    const error = new Error('fail');

    const createdResult: ResultGetDto = {
      id: 'bad-id',
      entryId: '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
    } as ResultGetDto;

    const newlyCreatedSpy = jest
      .spyOn(facade, 'newlyCreatedEntryResults')
      .mockReturnValue([createdResult]);

    const removeSpy = jest
      .spyOn(facade, 'removeResult')
      .mockImplementation(
        (
          _listId: string,
          _entryId: string,
          _resultId: string,
          _onSuccess?: () => void,
          onError?: (err: unknown) => void,
        ): void => {
          onError?.(error);
        },
      );

    const applyMappedErrorSpy = jest.spyOn(
      component as unknown as { applyMappedError: (e: unknown) => void },
      'applyMappedError',
    );

    component.onRemoveResult('bad-id');

    expect(applyMappedErrorSpy).toHaveBeenCalledWith(error);

    // cleanup
    applyMappedErrorSpy.mockRestore();
    removeSpy.mockRestore();
    newlyCreatedSpy.mockRestore();
  });

  it('onError should set errorSummaryItems and call focusErrorSummary with platformId', () => {
    const errors = [
      { text: 'Error 1', href: '#field1' },
    ] as unknown as ErrorItem[];

    const setSpy = jest.spyOn(component.errorSummaryItems, 'set');

    const focusSpy = jest
      .spyOn(errorClick, 'focusErrorSummary')
      .mockImplementation(() => {});

    component.onError(errors);

    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledWith(errors);

    const injectedPlatformId = TestBed.inject(PLATFORM_ID);
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(focusSpy).toHaveBeenCalledWith(injectedPlatformId);

    focusSpy.mockRestore();
    setSpy.mockRestore();
  });

  it('buildResultRequestForRow - uses pendingToCreate when present', () => {
    const row = {
      id: 'entry-1',
      sequenceNumber: '1',
      applicant: 'A',
      respondent: 'R',
      title: 'T',
    } as ApplicationEntriesResultContext;

    const pending: PendingResultRow = {
      kind: 'pending',
      tempId: 'tmp-1',
      resultCode: 'P_CODE',
      display: 'P_CODE - Title',
      wordingFields: [{ key: 'k1', value: 'v1' }],
      wording: 'w',
    };

    component.listId = 'list-x';

    const payload = {
      pendingToCreate: [pending],
      existingToUpdate: [],
    } as unknown as ResultSectionSubmitPayload;

    const accessor = component as unknown as {
      buildResultRequestForRow: (
        row: ApplicationEntriesResultContext,
        payload: ResultSectionSubmitPayload,
      ) => CreateApplicationListEntryResultRequestParams;
    };

    const result = accessor.buildResultRequestForRow(row, payload);

    expect(result).toEqual({
      listId: 'list-x',
      entryId: 'entry-1',
      resultCreateDto: {
        resultCode: 'P_CODE',
        wordingFields: [{ key: 'k1', value: 'v1' }],
      },
    });
  });

  it('buildResultRequestForRow - falls back to existingToUpdate when pending empty (no any)', () => {
    const row = {
      id: 'entry-2',
      sequenceNumber: '2',
      applicant: 'A2',
      respondent: 'R2',
      title: 'T2',
    } as ApplicationEntriesResultContext;

    const existing = {
      kind: 'existing',
      id: 'real-id',
      resultCode: 'E_CODE',
      display: 'E_CODE - Title',
      wordingFields: [{ key: 'ke', value: 've' }],
      wording: 'we',
    };

    component.listId = 'list-y';

    const payload = {
      pendingToCreate: [],
      existingToUpdate: [existing],
    } as unknown as ResultSectionSubmitPayload;

    const accessor = component as unknown as {
      buildResultRequestForRow: (
        row: ApplicationEntriesResultContext,
        payload: ResultSectionSubmitPayload,
      ) => CreateApplicationListEntryResultRequestParams;
    };

    const result = accessor.buildResultRequestForRow(row, payload);

    expect(result).toEqual({
      listId: 'list-y',
      entryId: 'entry-2',
      resultCreateDto: {
        resultCode: 'E_CODE',
        wordingFields: [{ key: 'ke', value: 've' }],
      },
    });
  });
});
