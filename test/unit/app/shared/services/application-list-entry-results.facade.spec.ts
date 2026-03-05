import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import {
  ApplicationListEntryResultsApi,
  ResultCodeGetDetailDto,
  ResultCodePage,
  ResultCodesApi,
  ResultGetDto,
  TemplateDetail,
} from '@openapi';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import * as resultCodeHelpers from '@util/result-code-helpers';

function makeResult(overrides: Partial<ResultGetDto>): ResultGetDto {
  return {
    id: 'R-1',
    resultCode: 'RC1',
    wordingFields: [],
    ...overrides,
  } as unknown as ResultGetDto;
}

function makeDetail(
  overrides: Partial<ResultCodeGetDetailDto>,
): ResultCodeGetDetailDto {
  return {
    resultCode: 'RC1',
    title: 'Result',
    wording: 'Wording',
    ...overrides,
  } as unknown as ResultCodeGetDetailDto;
}

describe('ApplicationListEntryResultsFacade', () => {
  let facade: ApplicationListEntryResultsFacade;
  let entryResultsApi: {
    createApplicationListEntryResult: jest.Mock;
    deleteApplicationListEntryResult: jest.Mock;
    updateApplicationListEntryResult: jest.Mock;
  };
  let resultCodesApi: {
    getResultCodes: jest.Mock;
    getResultCodeByCodeAndDate: jest.Mock;
  };

  beforeEach(() => {
    entryResultsApi = {
      createApplicationListEntryResult: jest.fn(() => of(null) as unknown),
      deleteApplicationListEntryResult: jest.fn(() => of(null) as unknown),
      updateApplicationListEntryResult: jest.fn(() => of(null) as unknown),
    };
    resultCodesApi = {
      getResultCodes: jest.fn(
        () => of({ content: [] } as unknown as ResultCodePage) as unknown,
      ),
      getResultCodeByCodeAndDate: jest.fn(
        () => of(makeDetail({ wording: 'W' })) as unknown,
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        ApplicationListEntryResultsFacade,
        {
          provide: ApplicationListEntryResultsApi,
          useValue: entryResultsApi,
        },
        { provide: ResultCodesApi, useValue: resultCodesApi },
      ],
    });

    facade = TestBed.inject(ApplicationListEntryResultsFacade);
  });

  describe('loadEntryResults', () => {
    it('does nothing when listId or entryId is missing', () => {
      const getEntryResultsSpy = jest.spyOn(
        resultCodeHelpers,
        'getEntryResults$',
      );

      facade.loadEntryResults('', 'E-1');
      facade.loadEntryResults('L-1', '');

      expect(getEntryResultsSpy).not.toHaveBeenCalled();
    });

    it('sets results and clears loading when fetch succeeds', () => {
      const results = [makeResult({ id: 'R-2' })];
      const getEntryResultsSpy = jest
        .spyOn(resultCodeHelpers, 'getEntryResults$')
        .mockReturnValue(of(results));

      facade.loadEntryResults('L-1', 'E-1');

      expect(getEntryResultsSpy).toHaveBeenCalledWith(entryResultsApi, {
        listId: 'L-1',
        entryId: 'E-1',
      });
      expect(facade.entryResultsLoading()).toBe(false);
      expect(facade.entryResults()).toEqual(results);
    });

    it('clears results and loading when fetch errors', () => {
      jest
        .spyOn(resultCodeHelpers, 'getEntryResults$')
        .mockReturnValue(throwError(() => new Error('boom')));

      facade.loadEntryResults('L-1', 'E-1');

      expect(facade.entryResultsLoading()).toBe(false);
      expect(facade.entryResults()).toEqual([]);
    });
  });

  describe('removeResult', () => {
    it('does nothing when inputs are missing', () => {
      const loadSpy = jest.spyOn(facade, 'loadEntryResults');

      facade.removeResult('', 'E-1', 'R-1');
      facade.removeResult('L-1', '', 'R-1');
      facade.removeResult('L-1', 'E-1', '');

      expect(
        entryResultsApi.deleteApplicationListEntryResult,
      ).not.toHaveBeenCalled();
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('deletes result, reloads, and calls onSuccess', () => {
      const loadSpy = jest.spyOn(facade, 'loadEntryResults');
      const onSuccess = jest.fn();

      facade.removeResult('L-1', 'E-1', 'R-1', onSuccess);

      expect(
        entryResultsApi.deleteApplicationListEntryResult,
      ).toHaveBeenCalledWith({
        listId: 'L-1',
        entryId: 'E-1',
        resultId: 'R-1',
      });
      expect(loadSpy).toHaveBeenCalledWith('L-1', 'E-1');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('submitResultChanges', () => {
    it('submits existing updates and pending creates in one cycle', () => {
      const loadSpy = jest.spyOn(facade, 'loadEntryResults');
      const onSuccess = jest.fn();

      facade.submitResultChanges(
        'L-1',
        'E-1',
        {
          pendingToCreate: [
            {
              resultCode: ' rc2 ',
              wordingFields: [{ key: 'Date', value: '2026-03-04' }],
            } as PendingResultRow,
          ],
          existingToUpdate: [
            {
              resultId: 'R-9',
              resultCode: ' rc1 ',
              wordingFields: [{ key: 'Location', value: 'London' }],
            },
          ],
        },
        onSuccess,
      );

      expect(
        entryResultsApi.updateApplicationListEntryResult,
      ).toHaveBeenCalledWith({
        listId: 'L-1',
        entryId: 'E-1',
        resultId: 'R-9',
        resultUpdateDto: {
          resultCode: 'rc1',
          wordingFields: [{ key: 'Location', value: 'London' }],
        },
      });
      expect(
        entryResultsApi.createApplicationListEntryResult,
      ).toHaveBeenCalledWith({
        listId: 'L-1',
        entryId: 'E-1',
        resultCreateDto: {
          resultCode: 'rc2',
          wordingFields: [{ key: 'Date', value: '2026-03-04' }],
        },
      });
      expect(loadSpy).toHaveBeenCalledWith('L-1', 'E-1');
      expect(facade.clearPendingToken()).toBe(1);
      expect(facade.pendingRows()).toEqual([]);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('setPending', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 1, 3, 9, 0, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('loads wording for the first pending row and caches it', () => {
      const row = { resultCode: ' rc1 ' } as PendingResultRow;

      facade.setPending([row]);

      expect(resultCodesApi.getResultCodeByCodeAndDate).toHaveBeenCalledWith(
        { code: 'RC1', date: '2024-02-03' },
        'body',
        false,
        { transferCache: true },
      );
      expect(facade.resultCodeWordingByCode()).toEqual({ RC1: 'W' });
      expect(facade.resultCodeTemplateByCode()).toEqual({
        RC1: { template: 'W', 'substitution-key-constraints': [] },
      });

      facade.setPending([row]);
      expect(resultCodesApi.getResultCodeByCodeAndDate).toHaveBeenCalledTimes(
        1,
      );
    });

    it('sets a fallback wording when the API errors', () => {
      resultCodesApi.getResultCodeByCodeAndDate.mockReturnValueOnce(
        throwError(() => new Error('boom')),
      );

      facade.setPending([{ resultCode: 'RC2' } as PendingResultRow]);

      expect(facade.resultCodeWordingByCode()).toEqual({ RC2: '-' });
      expect(facade.resultCodeTemplateByCode()).toEqual({
        RC2: { template: '', 'substitution-key-constraints': [] },
      });
    });

    it('supports TemplateDetail wording and unescapes placeholder tokens', () => {
      const detail = makeDetail({
        wording: {
          template: "Result '\\{\\{ Date \\}\\}' at \\{\\{ Location \\}\\}.",
          'substitution-key-constraints': [
            { key: 'Date', value: '2026-03-02', constraint: { length: 10 } },
          ],
        } as unknown as TemplateDetail,
      } as unknown as Partial<ResultCodeGetDetailDto>);
      resultCodesApi.getResultCodeByCodeAndDate.mockReturnValueOnce(
        of(detail) as unknown,
      );

      facade.setPending([{ resultCode: 'RC3' } as PendingResultRow]);

      expect(facade.resultCodeWordingByCode()).toEqual({
        RC3: "Result '{{ Date }}' at {{ Location }}.",
      });
      expect(facade.resultCodeTemplateByCode()).toEqual({
        RC3: {
          template: "Result '{{ Date }}' at {{ Location }}.",
          'substitution-key-constraints': [
            { key: 'Date', value: '2026-03-02', constraint: { length: 10 } },
          ],
        },
      });
    });
  });
});
