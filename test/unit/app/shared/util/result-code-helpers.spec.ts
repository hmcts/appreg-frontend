import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';

import {
  ApplicationListEntryResultsApi,
  ResultCodeGetSummaryDto,
  ResultCodePage,
  ResultCodesApi,
  ResultGetDto,
  ResultPage,
  TemplateDetail,
} from '@openapi';
import {
  formatResultCodeLabel,
  getAllResultCodes,
  getAllResultCodesState,
  getEntryResults$,
  mapPreviousResults,
  toExistingRows,
} from '@util/result-code-helpers';

function makeCode(
  overrides: Partial<ResultCodeGetSummaryDto>,
): ResultCodeGetSummaryDto {
  return {
    id: 1,
    resultCode: '',
    title: '',
    ...overrides,
  };
}
function makeCodesPage(overrides: Partial<ResultCodePage>): ResultCodePage {
  return { content: [], ...overrides } as unknown as ResultCodePage;
}
function makeResult(overrides: Partial<ResultGetDto>): ResultGetDto {
  return {
    id: 'R-1',
    resultCode: 'RC1',
    ...overrides,
  } as unknown as ResultGetDto;
}
function makeResultsPage(overrides: Partial<ResultPage>): ResultPage {
  return { content: [], ...overrides } as unknown as ResultPage;
}

describe('result-code helpers', () => {
  describe('getAllResultCodes', () => {
    it('returns content when API succeeds', () => {
      const page = makeCodesPage({
        content: [makeCode({ resultCode: 'RC1', title: 'One' })],
      });

      const getResultCodesMock = jest.fn(() => of(page) as unknown);

      const codesApi = {
        getResultCodes: getResultCodesMock,
      } as unknown as ResultCodesApi;

      const sig = TestBed.runInInjectionContext(() =>
        getAllResultCodes(codesApi),
      );

      expect(getResultCodesMock).toHaveBeenCalledWith({
        pageNumber: 0,
        pageSize: 100,
      });
      expect(sig()).toEqual(page.content);
    });

    const boomError = new Error('boom');
    it('returns [] when API errors', () => {
      const getResultCodesMock = jest.fn(
        () => throwError(() => boomError) as unknown,
      );

      const codesApi = {
        getResultCodes: getResultCodesMock,
      } as unknown as ResultCodesApi;

      const sig = TestBed.runInInjectionContext(() =>
        getAllResultCodes(codesApi),
      );

      expect(sig()).toEqual([]);
    });

    it('returns [] when page.content is null/undefined', () => {
      const page = makeCodesPage({
        content: null as unknown as ResultCodeGetSummaryDto[],
      });

      const getResultCodesMock = jest.fn(() => of(page) as unknown);
      const codesApi = {
        getResultCodes: getResultCodesMock,
      } as unknown as ResultCodesApi;

      const sig = TestBed.runInInjectionContext(() =>
        getAllResultCodes(codesApi),
      );

      expect(sig()).toEqual([]);
    });
  });

  describe('getAllResultCodesState', () => {
    it('loads all pages before marking the list as complete', () => {
      const secondPage = new Subject<ResultCodePage>();
      const getResultCodes = jest.fn(
        ({ pageNumber }: { pageNumber: number }) =>
          pageNumber === 0
            ? of(
                makeCodesPage({
                  pageNumber: 0,
                  totalPages: 2,
                  content: [makeCode({ id: 1, resultCode: 'RC1' })],
                }),
              )
            : secondPage,
      );
      const codesApi = { getResultCodes } as unknown as ResultCodesApi;
      const state = TestBed.runInInjectionContext(() =>
        getAllResultCodesState(codesApi),
      );

      expect(getResultCodes).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 100,
      });
      expect(state().loaded).toBe(false);

      secondPage.next(
        makeCodesPage({
          pageNumber: 1,
          totalPages: 2,
          content: [makeCode({ id: 2, resultCode: 'RC2' })],
        }),
      );
      secondPage.complete();

      expect(state()).toEqual({
        codes: [
          makeCode({ id: 1, resultCode: 'RC1' }),
          makeCode({ id: 2, resultCode: 'RC2' }),
        ],
        loaded: true,
      });
    });

    it('marks a successful response as loaded, including an empty list', () => {
      const response = new Subject<ResultCodePage>();
      const codesApi = {
        getResultCodes: jest.fn(() => response),
      } as unknown as ResultCodesApi;
      const state = TestBed.runInInjectionContext(() =>
        getAllResultCodesState(codesApi),
      );

      expect(state()).toEqual({ codes: [], loaded: false });
      response.next(makeCodesPage({ content: [] }));
      response.complete();
      expect(state()).toEqual({ codes: [], loaded: true });
    });

    it('does not mark an API error as a loaded empty list', () => {
      const codesApi = {
        getResultCodes: jest.fn(() => throwError(() => new Error('failed'))),
      } as unknown as ResultCodesApi;
      const state = TestBed.runInInjectionContext(() =>
        getAllResultCodesState(codesApi),
      );

      expect(state()).toEqual({ codes: [], loaded: false });
    });
  });

  describe('getEntryResults$', () => {
    it('calls API and maps page.content', async () => {
      const page = makeResultsPage({
        content: [makeResult({ id: 'E1', resultCode: 'RC1' })],
      });

      const getEntryResultsMock = jest.fn(() => of(page) as unknown);

      const entryResultsApi = {
        getApplicationListEntryResults: getEntryResultsMock,
      } as unknown as ApplicationListEntryResultsApi;

      const out = await firstValueFrom(
        getEntryResults$(entryResultsApi, { listId: 'AL-1', entryId: 'EN-1' }),
      );

      expect(getEntryResultsMock).toHaveBeenCalledWith({
        listId: 'AL-1',
        entryId: 'EN-1',
        pageNumber: 0,
        pageSize: 100,
      });

      expect(out).toEqual(page.content);
    });

    const boomError = new Error('boom');
    it('returns [] when API errors', async () => {
      const getEntryResultsMock = jest.fn(
        () => throwError(() => boomError) as unknown,
      );

      const entryResultsApi = {
        getApplicationListEntryResults: getEntryResultsMock,
      } as unknown as ApplicationListEntryResultsApi;

      const out = await firstValueFrom(
        getEntryResults$(entryResultsApi, { listId: 'AL-1', entryId: 'EN-1' }),
      );

      expect(out).toEqual([]);
    });
  });

  describe('formatResultCodeLabel', () => {
    it('returns "CODE - Title" when found; else returns code', () => {
      const allCodes = [makeCode({ resultCode: 'RC1', title: 'One' })];
      expect(formatResultCodeLabel('RC1', allCodes)).toBe('RC1 - One');
      expect(formatResultCodeLabel('ZZ9', allCodes)).toBe('ZZ9');
    });
  });

  describe('mapPreviousResults', () => {
    it('adds display field', () => {
      const results = [
        makeResult({ id: 'E1', resultCode: 'RC1' }),
        makeResult({ id: 'E2', resultCode: 'ZZ9' }),
      ];
      const allCodes = [makeCode({ resultCode: 'RC1', title: 'One' })];

      const mapped = mapPreviousResults(results, allCodes);

      expect(mapped[0].display).toBe('RC1 - One');
      expect(mapped[1].display).toBe('ZZ9');
    });
  });

  describe('toExistingRows', () => {
    it('uses each saved reference ID and never matches another version by code', () => {
      const rows = toExistingRows(
        [
          makeResult({ id: 'old-result', resultCode: 'RC1', resultCodeId: 10 }),
          makeResult({ id: 'new-result', resultCode: 'RC1', resultCodeId: 20 }),
          makeResult({
            id: 'missing-result',
            resultCode: 'RC1',
            resultCodeId: 30,
          }),
        ],
        { 10: 'Historical title', 20: 'Current title' },
      );
      expect(rows.map((row) => row.display)).toEqual([
        'RC1 - Historical title',
        'RC1 - Current title',
        'RC1',
      ]);
      expect(rows.map((row) => row.id)).toEqual([
        'old-result',
        'new-result',
        'missing-result',
      ]);
    });

    it('maps wording "-" when there are no substitution constraints', () => {
      const rows1 = toExistingRows(
        [
          makeResult({
            id: 'E1',
            resultCode: 'RC1',
            wording: {
              template: 'No placeholders',
              'substitution-key-constraints': [],
            },
          }),
        ],
        {},
      );
      expect(rows1[0].wording).toBe('-');
    });

    it('maps substitution constraints to wording and preserves key/value pairs', () => {
      const rows = toExistingRows(
        [
          makeResult({
            id: 'E3',
            resultCode: 'RC1',
            wording: {
              template: "Result '{{ Date }}' at '{{ Location }}'",
              'substitution-key-constraints': [
                { key: 'Date', value: '2026-03-02' },
                { key: 'Location', value: 'London' },
              ],
            } as unknown as TemplateDetail,
          }),
        ],
        {},
      );

      expect(rows[0].wording).toBe('2026-03-02, London');
      expect(rows[0].wordingFields).toEqual([
        { key: 'Date', value: '2026-03-02' },
        { key: 'Location', value: 'London' },
      ]);
    });
  });
});
