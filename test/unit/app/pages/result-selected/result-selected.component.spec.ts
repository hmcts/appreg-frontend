import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ResultSelected } from '@components/result-selected/result-selected.component';
import {
  ApplicationListEntryResultsApi,
  CreateApplicationListEntryResultRequestParams,
  ResultGetDto,
} from '@openapi';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';

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
  };

  beforeEach(async () => {
    mockApi = {
      createApplicationListEntryResult: jest
        .fn()
        .mockReturnValue(of(makeResultDto('x', 1))),
    };

    await TestBed.configureTestingModule({
      imports: [ResultSelected],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ApplicationListEntryResultsApi, useValue: mockApi },
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

  it('onSubmitResults - all-success path: populates batchResults and sets success state', () => {
    component.listId = 'list-success';
    component.rows = [
      {
        id: 'r1',
        sequenceNumber: '1',
        applicant: 'A',
        respondent: 'R',
        title: 'T1',
      },
      {
        id: 'r2',
        sequenceNumber: '2',
        applicant: 'B',
        respondent: 'S',
        title: 'T2',
      },
    ] as ApplicationEntriesResultContext[];

    const payload: ResultSectionSubmitPayload = {
      pendingToCreate: [
        {
          kind: 'pending',
          tempId: 'tmp_ebf79d63-080b-46fa-938a-f5d82874b234',
          resultCode: 'ADJ',
          display: 'ADJ - Adjourned',
          wordingFields: [],
          wording: '-',
        },
      ] as PendingResultRow[],
      existingToUpdate: [],
    };

    const expectedParamsForR1: CreateApplicationListEntryResultRequestParams = {
      listId: component.listId,
      entryId: 'r1',
      resultCreateDto: { resultCode: 'ADJ', wordingFields: [] },
    };
    const expectedParamsForR2: CreateApplicationListEntryResultRequestParams = {
      listId: component.listId,
      entryId: 'r2',
      resultCreateDto: { resultCode: 'ADJ', wordingFields: [] },
    };

    mockApi.createApplicationListEntryResult.mockImplementation(
      (params: CreateApplicationListEntryResultRequestParams) =>
        of(makeResultDto(params.entryId, params.entryId === 'r1' ? 1 : 2)),
    );

    component.onSubmitResults(payload);

    expect(mockApi.createApplicationListEntryResult).toHaveBeenCalledTimes(2);
    expect(mockApi.createApplicationListEntryResult).toHaveBeenCalledWith(
      expectedParamsForR1,
    );
    expect(mockApi.createApplicationListEntryResult).toHaveBeenCalledWith(
      expectedParamsForR2,
    );
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

    const errorSummarySetSpy = jest.spyOn(component.errorSummaryItems, 'set');
    const resultCodeApplySuccessSetSpy = jest.spyOn(
      component.resultCodeApplySuccess,
      'set',
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

    expect(resultCodeApplySuccessSetSpy).toHaveBeenCalledWith(false);
    expect(component.isSubmitting()).toBe(false);
  });
});
