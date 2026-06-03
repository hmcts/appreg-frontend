import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import * as bannersUtil from '@components/applications-list-entry-detail/util/banners.util';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ResultSelected } from '@components/result-selected/result-selected.component';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import { ApplicationListEntryResultsApi, ResultGetDto } from '@openapi';
import {
  ApplicationListEntryResultsFacade,
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

  let mockApi: {
    bulkResultApplicationListEntries: jest.Mock;
    createApplicationListEntryResult: jest.Mock;
    deleteApplicationListEntryResult: jest.Mock;
    getApplicationListEntryResults: jest.Mock;
    updateApplicationListEntryResult: jest.Mock;
  };

  beforeEach(async () => {
    mockApi = {
      bulkResultApplicationListEntries: jest.fn().mockReturnValue(of(null)),
      createApplicationListEntryResult: jest.fn().mockReturnValue(of(null)),
      deleteApplicationListEntryResult: jest.fn().mockReturnValue(of(null)),
      getApplicationListEntryResults: jest
        .fn()
        .mockReturnValue(of({ content: [] })),
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

  it('ngOnInit should set rows from history.state when present', () => {
    const sampleRows = [
      { id: 'r1', sequenceNumber: '1' },
      { id: 'r2', sequenceNumber: '2' },
    ] as ApplicationEntriesResultContext[];

    history.replaceState(
      {
        resultingApplications: sampleRows,
      },
      '',
    );

    component.ngOnInit();

    expect(component.listId).toBe('73d0276f-42a3-4150-b2fd-d9b2d56b359c');
    expect(component.rows).toEqual(sampleRows);
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

  it('onSubmitResults sends one bulk request and shows success when it succeeds', () => {
    component.listId = 'list-success';
    const hydratedResult = {
      id: 'result-1',
      entryId: 'entry-1',
      resultCode: 'ADJ',
      wording: {
        template: 'Adjourned',
        'substitution-key-constraints': [],
      },
    } as ResultGetDto;
    mockApi.getApplicationListEntryResults
      .mockReturnValueOnce(
        of({
          content: [
            hydratedResult,
            {
              id: 'result-2',
              entryId: 'entry-1',
              resultCode: 'OTHER',
            },
          ],
        }),
      )
      .mockReturnValueOnce(of({ content: [] }));
    component.rows = [
      {
        id: 'entry-1',
        sequenceNumber: '10',
        applicant: 'A',
        respondent: 'R',
        title: 'T',
      },
      {
        id: 'entry-2',
        sequenceNumber: '20',
        applicant: 'B',
        respondent: 'S',
        title: 'U',
      },
    ] as ApplicationEntriesResultContext[];

    const focusSuccessSpy = jest
      .spyOn(bannersUtil, 'focusSuccessBanner')
      .mockImplementation(() => {});

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

    expect(mockApi.bulkResultApplicationListEntries).toHaveBeenCalledTimes(1);
    expect(mockApi.bulkResultApplicationListEntries).toHaveBeenCalledWith({
      listId: 'list-success',
      bulkResultDto: {
        entryIds: ['entry-1', 'entry-2'],
        result: {
          resultCode: 'ADJ',
          wordingFields: [],
        },
      },
    });
    expect(mockApi.createApplicationListEntryResult).not.toHaveBeenCalled();
    expect(mockApi.getApplicationListEntryResults).toHaveBeenCalledTimes(2);
    expect(component.createdEntryResults()).toEqual([hydratedResult]);
    expect(component.errorSummaryItems()).toEqual([]);
    expect(component.successBanner()).toEqual({
      heading: 'Result codes applied successfully',
      body: "Result code 'ADJ' applied successfully to application list entries",
    });
    expect(component.isSubmitting()).toBe(false);

    const injectedPlatformId = TestBed.inject(PLATFORM_ID);
    expect(focusSuccessSpy).toHaveBeenCalledTimes(1);
    expect(focusSuccessSpy).toHaveBeenCalledWith(injectedPlatformId);

    focusSuccessSpy.mockRestore();
  });

  it('onSubmitResults handles one bulk validation error and keeps pending data available', () => {
    component.listId = 'list-error';
    component.rows = [
      {
        id: 'entry-1',
        sequenceNumber: '10',
        applicant: 'A',
        respondent: 'R',
        title: 'T',
      },
    ] as ApplicationEntriesResultContext[];

    const pendingRow = {
      kind: 'pending',
      tempId: 'tmp_ebf79d63-080b-46fa-938a-f5d82874b234',
      resultCode: 'ADJ',
      display: 'ADJ - Adjourned',
      wordingFields: [{ key: 'Date', value: '2026-03-04' }],
      wording: '-',
    } as PendingResultRow;

    const facadeInstance = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;
    component.onPendingChange([pendingRow]);

    mockApi.bulkResultApplicationListEntries.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              title: 'Validation failed',
              errors: {
                resultCode: ['Result code is not valid for this list'],
              },
            },
          }),
      ),
    );

    const focusErrorSpy = jest
      .spyOn(errorClick, 'focusErrorSummary')
      .mockImplementation(() => {});

    component.onSubmitResults({
      pendingToCreate: [pendingRow],
      existingToUpdate: [],
    } as ResultSectionSubmitPayload);

    expect(mockApi.bulkResultApplicationListEntries).toHaveBeenCalledTimes(1);
    expect(mockApi.createApplicationListEntryResult).not.toHaveBeenCalled();
    expect(mockApi.getApplicationListEntryResults).not.toHaveBeenCalled();
    expect(component.successBanner()).toBeNull();
    expect(component.errorHint).toBe('Validation failed');
    expect(component.errorSummaryItems()).toEqual([
      { text: 'Result code is not valid for this list' },
    ]);
    expect(component.isSubmitting()).toBe(false);
    expect(facadeInstance.pendingRows()).toEqual([pendingRow]);

    expect(focusErrorSpy).toHaveBeenCalledWith(TestBed.inject(PLATFORM_ID));

    focusErrorSpy.mockRestore();
  });

  it('onSubmitResults ignores duplicate submissions while a bulk request is in flight', () => {
    component.listId = 'list-submitting';
    component.rows = [
      {
        id: 'entry-1',
        sequenceNumber: '10',
        applicant: 'A',
        respondent: 'R',
        title: 'T',
      },
    ] as ApplicationEntriesResultContext[];
    component.isSubmitting.set(true);

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

    expect(submitSpy).not.toHaveBeenCalled();
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
