import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import * as bannersUtil from '@components/applications-list-entry-detail/util/banners.util';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ResultSelected } from '@components/result-selected/result-selected.component';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import { ApplicationListEntryResultsApi, ResultGetDto } from '@openapi';
import {
  ApplicationListEntryResultsFacade,
  BulkResultChange,
  BulkResultRemoval,
} from '@services/applications-list-entry/application-list-entry-results.facade';
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
    deleteApplicationListEntryResult: jest.Mock;
    updateApplicationListEntryResult: jest.Mock;
  };

  beforeEach(async () => {
    mockApi = {
      createApplicationListEntryResult: jest
        .fn()
        .mockReturnValue(of(makeResultDto('x', 1))),
      deleteApplicationListEntryResult: jest.fn().mockReturnValue(of(null)),
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

    const setErrorSummarySpy = jest.spyOn(component.errorSummaryItems, 'set');

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

    expect(setErrorSummarySpy).not.toHaveBeenCalled();

    setPendingSpy.mockRestore();
    setErrorSummarySpy.mockRestore();
  });

  it('onPendingChange should clear errorSummaryItems when passed an empty array', () => {
    const setPendingSpy = jest.spyOn(
      ApplicationListEntryResultsFacade.prototype,
      'setPending',
    );

    const setErrorSummarySpy = jest.spyOn(component.errorSummaryItems, 'set');

    component.onPendingChange([] as PendingResultRow[]);

    expect(setPendingSpy).toHaveBeenCalledTimes(1);
    expect(setPendingSpy).toHaveBeenCalledWith([]);

    expect(setErrorSummarySpy).toHaveBeenCalledTimes(1);
    expect(setErrorSummarySpy).toHaveBeenCalledWith([]);

    setPendingSpy.mockRestore();
    setErrorSummarySpy.mockRestore();
  });

  it('createdEntryResults exposes one representative card per logical result group', () => {
    const facadeInstance = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;

    facadeInstance.addCreatedEntryResults([
      {
        id: 'result-1',
        entryId: 'entry-1',
        resultCode: 'RC1',
        wording: {
          template: 'Same wording',
          'substitution-key-constraints': [],
        },
      } as ResultGetDto,
      {
        id: 'result-2',
        entryId: 'entry-2',
        resultCode: 'RC1',
        wording: {
          template: 'Same wording',
          'substitution-key-constraints': [],
        },
      } as ResultGetDto,
      {
        id: 'result-3',
        entryId: 'entry-3',
        resultCode: 'RC2',
        wording: {
          template: 'Different wording',
          'substitution-key-constraints': [],
        },
      } as ResultGetDto,
    ]);

    expect(component.createdEntryResults()).toHaveLength(2);
    expect(component.createdEntryResults().map((result) => result.id)).toEqual([
      'result-1',
      'result-3',
    ]);
  });

  it('onSubmitResults returns early if listId missing or rows empty (no API calls)', () => {
    component.listId = '';
    component.rows = [];

    const facadeInstance = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;
    const submitSpy = jest.spyOn(
      facadeInstance,
      'submitResultChangesForEntries',
    );

    component.onSubmitResults({
      pendingToCreate: [],
      pendingToRemove: [],
    } as unknown as ResultSectionSubmitPayload);

    expect(submitSpy).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
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

    const facadeInstance = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;
    const submitSpy = jest
      .spyOn(facadeInstance, 'submitResultChangesForEntries')
      .mockImplementation(
        (
          _listId,
          _entryIds,
          _payload,
          onSuccess?: (results: BulkResultChange[]) => void,
        ): void => {
          onSuccess?.([
            {
              action: 'create',
              entryId: 'ok',
              success: true,
              response: makeResultDto('ok-result', 10),
            },
            {
              action: 'create',
              entryId: 'bad',
              success: false,
              error: new HttpErrorResponse({
                status: 500,
                statusText: 'Server Error',
              }),
            },
          ]);
        },
      );

    const focusErrorSpy = jest
      .spyOn(errorClick, 'focusErrorSummary')
      .mockImplementation(() => {});
    const focusSuccessSpy = jest
      .spyOn(bannersUtil, 'focusSuccessBanner')
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

    expect(submitSpy).toHaveBeenCalledWith(
      'list-partial',
      ['ok', 'bad'],
      expect.any(Object),
      expect.any(Function),
      expect.any(Function),
    );
    expect(component.idToSequenceNumberMap).toEqual({ ok: '10', bad: '20' });

    const batchResults = component.batchResults;
    expect(batchResults).toHaveLength(2);

    const okResult = batchResults.find((r) => r.entryId === 'ok');
    const badResult = batchResults.find((r) => r.entryId === 'bad');

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
    expect(focusErrorSpy).toHaveBeenCalledTimes(1);
    expect(focusErrorSpy).toHaveBeenCalledWith(injectedPlatformId);

    expect(focusErrorSpy).toHaveBeenCalledTimes(1);
    expect(focusSuccessSpy).toHaveBeenCalledTimes(1);

    submitSpy.mockRestore();
    focusErrorSpy.mockRestore();
    focusSuccessSpy.mockRestore();
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

    const facadeInstance = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;
    const submitSpy = jest
      .spyOn(facadeInstance, 'submitResultChangesForEntries')
      .mockImplementation(
        (
          _listId,
          _entryIds,
          _payload,
          onSuccess?: (results: BulkResultChange[]) => void,
        ): void => {
          onSuccess?.([
            {
              action: 'update',
              entryId: 'r1',
              resultId: 'existing-result-123',
              success: true,
              response: makeResultDto('existing-result-123', 1),
            },
          ]);
        },
      );

    component.onSubmitResults(payload);

    expect(submitSpy).toHaveBeenCalledWith(
      'list-update',
      ['r1'],
      payload,
      expect.any(Function),
      expect.any(Function),
    );

    expect(component.successBanner()).toEqual({
      heading: 'Result codes applied successfully',
      body: "Result code 'UPD' applied successfully to application list entries",
    });

    expect(component.batchResults).toHaveLength(1);
    expect(component.batchResults[0].entryId).toBe('r1');
    expect(component.batchResults[0].success).toBe(true);

    submitSpy.mockRestore();
  });

  it('onRemoveResult returns early when listId is missing (no facade call)', () => {
    component.listId = '';

    const facadeInstance = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;

    const removeSpy = jest.spyOn(
      facadeInstance,
      'removeCreatedEntryResultGroup',
    );

    component.onRemoveResult('result-1');

    expect(removeSpy).not.toHaveBeenCalled();

    removeSpy.mockRestore();
  });

  it('onRemoveResult success path: calls facade.removeResult and sets success banner', () => {
    component.listId = 'list-123';
    const facade = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;

    const removeSpy = jest
      .spyOn(facade, 'removeCreatedEntryResultGroup')
      .mockImplementation(
        (
          _listId: string,
          _resultId: string,
          onSuccess?: (results: BulkResultRemoval[]) => void,
        ): void => {
          onSuccess?.([
            {
              entryId: '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
              resultId: 'result-xyz',
              success: true,
            },
            {
              entryId: 'different-entry',
              resultId: 'result-abc',
              success: true,
            },
          ]);
        },
      );

    const successBannerSpy = jest.spyOn(component.successBanner, 'set');

    component.onRemoveResult('result-xyz');

    expect(removeSpy).toHaveBeenCalledWith(
      'list-123',
      'result-xyz',
      expect.any(Function),
      expect.any(Function),
    );

    expect(successBannerSpy).toHaveBeenCalledWith(
      ENTRY_SUCCESS_MESSAGES.resultsRemoved,
    );

    successBannerSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('onRemoveResult error path: calls facade and applies mapped error', () => {
    component.listId = 'list-456';
    const facade = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;

    const error = new Error('fail');

    const removeSpy = jest
      .spyOn(facade, 'removeCreatedEntryResultGroup')
      .mockImplementation(
        (
          _listId: string,
          _resultId: string,
          onSuccess?: (results: BulkResultRemoval[]) => void,
        ): void => {
          onSuccess?.([
            {
              entryId: '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
              resultId: 'bad-id',
              success: false,
              error,
            },
          ]);
        },
      );

    const applyMappedErrorSpy = jest.spyOn(
      component as unknown as { applyMappedError: (e: unknown) => void },
      'applyMappedError',
    );

    component.onRemoveResult('bad-id');

    expect(applyMappedErrorSpy).toHaveBeenCalledWith(error);

    applyMappedErrorSpy.mockRestore();
    removeSpy.mockRestore();
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
});
