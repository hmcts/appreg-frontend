import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApplicationsResultSelectedComponent } from '@components/applications/applications-result-selected/applications-result-selected.component';
import * as bannersUtil from '@components/applications-list-entry-detail/util/banners.util';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import {
  ApplicationListEntryResultsApi,
  ResultCodePage,
  ResultCodesApi,
  ResultGetDto,
} from '@openapi';
import { ApplicationsSearchStateService } from '@services/applications/applications-search-state.service';
import {
  ApplicationListEntryResultsFacade,
  BulkResultRemoval,
} from '@services/applications-list-entry/application-list-entry-results.facade';
import * as errorClick from '@util/error-click';

describe('ApplicationsResultSelectedComponent', () => {
  let component: ApplicationsResultSelectedComponent;
  let fixture: ComponentFixture<ApplicationsResultSelectedComponent>;
  let applicationsSearchState: ApplicationsSearchStateService;

  let mockApi: {
    bulkResultApplicationListEntries: jest.Mock;
    bulkResultEntries: jest.Mock;
    createApplicationListEntryResult: jest.Mock;
    deleteApplicationListEntryResult: jest.Mock;
    getApplicationListEntryResults: jest.Mock;
    updateApplicationListEntryResult: jest.Mock;
  };
  let mockResultCodesApi: {
    getResultCodes: jest.Mock;
    getResultCodeByCodeAndDate: jest.Mock;
  };

  beforeEach(async () => {
    history.replaceState(
      {
        entriesToResult: [
          {
            id: 'entry-1',
            listId: 'list-1',
            date: '2026-06-12',
            applicant: 'Alice',
            respondent: 'Bob',
            title: 'Application A',
            fee: 'Yes',
            resulted: 'No',
            status: 'Open',
          },
          {
            id: 'entry-2',
            listId: 'list-2',
            date: '2026-06-12',
            applicant: 'Carol',
            respondent: 'Dave',
            title: 'Application B',
            fee: 'No',
            resulted: 'No',
            status: 'Open',
          },
        ],
      },
      '',
    );

    mockApi = {
      bulkResultApplicationListEntries: jest.fn().mockReturnValue(of([])),
      bulkResultEntries: jest.fn().mockReturnValue(of([])),
      createApplicationListEntryResult: jest.fn().mockReturnValue(of(null)),
      deleteApplicationListEntryResult: jest.fn().mockReturnValue(of(null)),
      getApplicationListEntryResults: jest
        .fn()
        .mockReturnValue(of({ content: [] })),
      updateApplicationListEntryResult: jest.fn().mockReturnValue(of(null)),
    };
    mockResultCodesApi = {
      getResultCodes: jest.fn(
        () => of({ content: [] } as unknown as ResultCodePage) as unknown,
      ),
      getResultCodeByCodeAndDate: jest.fn(() => of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationsResultSelectedComponent],
      providers: [
        { provide: ApplicationListEntryResultsApi, useValue: mockApi },
        { provide: ResultCodesApi, useValue: mockResultCodesApi },
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    applicationsSearchState = TestBed.inject(ApplicationsSearchStateService);
    applicationsSearchState.reset();

    fixture = TestBed.createComponent(ApplicationsResultSelectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create and read rows from history state', () => {
    expect(component).toBeTruthy();
    expect(component.rows).toEqual([
      expect.objectContaining({
        id: 'entry-1',
        listId: 'list-1',
      }),
      expect.objectContaining({
        id: 'entry-2',
        listId: 'list-2',
      }),
    ]);
  });

  it('omits actions, fees, status, and resulted columns from the table', () => {
    expect(component.columns.map((column) => column.field)).not.toEqual(
      expect.arrayContaining(['actions', 'fee', 'status', 'resulted']),
    );
  });

  it('onSubmitResults groups entries by listId and applies pending results via bulkResultEntries', () => {
    const createdResult = {
      id: 'result-1',
      entryId: 'entry-1',
      resultCode: 'ADJ',
      wording: {
        template: 'Adjourned',
        'substitution-key-constraints': [],
      },
    } as ResultGetDto;
    mockApi.bulkResultEntries.mockReturnValueOnce(of([createdResult]));

    const focusSuccessSpy = jest
      .spyOn(bannersUtil, 'focusSuccessBanner')
      .mockImplementation(() => {});

    component.onSubmitResults({
      pendingToCreate: [
        {
          kind: 'pending',
          tempId: 'tmp-1',
          resultCode: 'ADJ',
          display: 'ADJ - Adjourned',
          wordingFields: [],
          wording: '-',
        },
      ],
      existingToUpdate: [],
    });

    expect(mockApi.bulkResultEntries).toHaveBeenCalledWith({
      bulkResultDto: {
        entryIds: ['entry-1', 'entry-2'],
        result: {
          resultCode: 'ADJ',
          wordingFields: [],
        },
      },
    });
    expect(component.createdEntryResults()).toEqual([createdResult]);
    expect(component.successBanner()).toEqual({
      heading: 'Result codes applied successfully',
      body: "Result code(s) 'ADJ' applied successfully to application(s)",
    });
    expect(component.isSubmitting()).toBe(false);
    expect(applicationsSearchState.consumeRefreshOnRestore()).toBe(true);
    expect(focusSuccessSpy).toHaveBeenCalledWith(TestBed.inject(PLATFORM_ID));
  });

  it('onSubmitResults updates existing results across multiple listIds', () => {
    const facade = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;

    facade.addCreatedEntryResults([
      {
        id: 'result-1',
        entryId: 'entry-1',
        resultCode: 'RC1',
        wording: {
          template: 'Same wording',
          'substitution-key-constraints': [],
        },
      },
      {
        id: 'result-2',
        entryId: 'entry-2',
        resultCode: 'RC1',
        wording: {
          template: 'Same wording',
          'substitution-key-constraints': [],
        },
      },
    ]);
    mockApi.updateApplicationListEntryResult
      .mockReturnValueOnce(
        of({
          id: 'result-1',
          entryId: 'entry-1',
          resultCode: 'RC1',
        } as ResultGetDto),
      )
      .mockReturnValueOnce(
        of({
          id: 'result-2',
          entryId: 'entry-2',
          resultCode: 'RC1',
        } as ResultGetDto),
      );

    component.onSubmitResults({
      pendingToCreate: [],
      existingToUpdate: [
        {
          resultId: 'result-1',
          resultCode: 'RC1',
          wordingFields: [{ key: 'Date', value: '2026-03-04' }],
        },
      ],
    });

    expect(mockApi.updateApplicationListEntryResult).toHaveBeenNthCalledWith(
      1,
      {
        listId: 'list-1',
        entryId: 'entry-1',
        resultId: 'result-1',
        resultUpdateDto: {
          resultCode: 'RC1',
          wordingFields: [{ key: 'Date', value: '2026-03-04' }],
        },
      },
    );
    expect(mockApi.updateApplicationListEntryResult).toHaveBeenNthCalledWith(
      2,
      {
        listId: 'list-2',
        entryId: 'entry-2',
        resultId: 'result-2',
        resultUpdateDto: {
          resultCode: 'RC1',
          wordingFields: [{ key: 'Date', value: '2026-03-04' }],
        },
      },
    );
  });

  it('onSubmitResults maps API errors into the error summary', () => {
    mockApi.bulkResultEntries.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              title: 'Validation failed',
              errors: {
                resultCode: ['Result code is not valid for these applications'],
              },
            },
          }),
      ),
    );

    const focusErrorSpy = jest
      .spyOn(errorClick, 'focusErrorSummary')
      .mockImplementation(() => {});

    component.onSubmitResults({
      pendingToCreate: [
        {
          kind: 'pending',
          tempId: 'tmp-1',
          resultCode: 'ADJ',
          display: 'ADJ - Adjourned',
          wordingFields: [],
          wording: '-',
        },
      ],
      existingToUpdate: [],
    });

    expect(component.successBanner()).toBeNull();
    expect(component.errorSummaryItems()).toEqual([
      { text: 'Result code is not valid for these applications' },
    ]);
    expect(component.isSubmitting()).toBe(false);
    expect(focusErrorSpy).toHaveBeenCalledWith(TestBed.inject(PLATFORM_ID));
  });

  it('onRemoveResult removes matching created results across multiple lists', () => {
    const facade = (
      component as unknown as {
        resultsFacade: ApplicationListEntryResultsFacade;
      }
    ).resultsFacade;

    facade.addCreatedEntryResults([
      {
        id: 'result-1',
        entryId: 'entry-1',
        resultCode: 'RC1',
        wording: {
          template: 'Same wording',
          'substitution-key-constraints': [],
        },
      },
      {
        id: 'result-2',
        entryId: 'entry-2',
        resultCode: 'RC1',
        wording: {
          template: 'Same wording',
          'substitution-key-constraints': [],
        },
      },
    ]);

    const removeSpy = jest
      .spyOn(facade, 'removeCreatedEntryResults')
      .mockImplementation(
        (
          _listId: string,
          _resultIds: string[],
          onSuccess?: (results: BulkResultRemoval[]) => void,
        ) => {
          onSuccess?.([
            {
              entryId: 'entry-1',
              resultId: 'result-1',
              success: true,
            },
          ]);
        },
      )
      .mockImplementationOnce(
        (
          _listId: string,
          _resultIds: string[],
          onSuccess?: (results: BulkResultRemoval[]) => void,
        ) => {
          onSuccess?.([
            {
              entryId: 'entry-1',
              resultId: 'result-1',
              success: true,
            },
          ]);
        },
      )
      .mockImplementationOnce(
        (
          _listId: string,
          _resultIds: string[],
          onSuccess?: (results: BulkResultRemoval[]) => void,
        ) => {
          onSuccess?.([
            {
              entryId: 'entry-2',
              resultId: 'result-2',
              success: true,
            },
          ]);
        },
      );

    const focusSuccessSpy = jest
      .spyOn(bannersUtil, 'focusSuccessBanner')
      .mockImplementation(() => {});

    component.onRemoveResult('result-1');

    expect(removeSpy).toHaveBeenNthCalledWith(
      1,
      'list-1',
      ['result-1'],
      expect.any(Function),
      expect.any(Function),
    );
    expect(removeSpy).toHaveBeenNthCalledWith(
      2,
      'list-2',
      ['result-2'],
      expect.any(Function),
      expect.any(Function),
    );
    expect(component.successBanner()).toEqual(
      ENTRY_SUCCESS_MESSAGES.resultsRemoved,
    );
    expect(applicationsSearchState.consumeRefreshOnRestore()).toBe(true);
    expect(focusSuccessSpy).toHaveBeenCalledWith(TestBed.inject(PLATFORM_ID));
  });
});
