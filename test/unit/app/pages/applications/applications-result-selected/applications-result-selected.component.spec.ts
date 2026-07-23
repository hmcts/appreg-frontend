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
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';

describe('ApplicationsResultSelectedComponent', () => {
  let component: ApplicationsResultSelectedComponent;
  let fixture: ComponentFixture<ApplicationsResultSelectedComponent>;

  let mockApi: {
    bulkDeleteResultEntries: jest.Mock;
    bulkResultApplicationListEntries: jest.Mock;
    bulkResultEntries: jest.Mock;
    createApplicationListEntryResult: jest.Mock;
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
      bulkDeleteResultEntries: jest.fn().mockReturnValue(of(null)),
      bulkResultApplicationListEntries: jest.fn().mockReturnValue(of([])),
      bulkResultEntries: jest.fn().mockReturnValue(of([])),
      createApplicationListEntryResult: jest.fn().mockReturnValue(of(null)),
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

  it('sorts all rows before applying the page size and resets to the first page', () => {
    component.rows = Array.from({ length: 11 }, (_, index) => ({
      id: `entry-${index}`,
      listId: `list-${index}`,
      date: '2026-06-12',
      applicant: `Applicant ${String(11 - index).padStart(2, '0')}`,
      respondent: 'Respondent',
      title: `Application ${index}`,
    }));
    component.onPageChange(1);

    component.onSortChange({ key: 'applicant', direction: 'asc' });

    expect(component.currentPage()).toBe(0);
    expect(component.totalPages()).toBe(2);
    expect(component.paginatedRows().map((row) => row.applicant)).toEqual(
      Array.from(
        { length: 10 },
        (_, index) => `Applicant ${String(index + 1).padStart(2, '0')}`,
      ),
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

    const focusSuccessSpy = jest
      .spyOn(bannersUtil, 'focusSuccessBanner')
      .mockImplementation(() => {});

    component.onRemoveResult('result-1');

    expect(mockApi.bulkDeleteResultEntries).toHaveBeenCalledTimes(1);
    expect(mockApi.bulkDeleteResultEntries).toHaveBeenCalledWith({
      bulkDeleteResultsDto: {
        results: [
          {
            listId: 'list-1',
            entryId: 'entry-1',
            resultId: 'result-1',
          },
          {
            listId: 'list-2',
            entryId: 'entry-2',
            resultId: 'result-2',
          },
        ],
      },
    });
    expect(facade.newlyCreatedEntryResults()).toEqual([]);
    expect(component.successBanner()).toEqual(
      ENTRY_SUCCESS_MESSAGES.resultsRemoved,
    );
    expect(focusSuccessSpy).toHaveBeenCalledWith(TestBed.inject(PLATFORM_ID));
  });
});
