import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

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
  getEntryResults$,
  loadAllResultCodes$,
  mapPreviousResults,
  toExistingRows,
} from '@util/result-code-helpers';

function makeCode(
  overrides: Partial<ResultCodeGetSummaryDto>,
): ResultCodeGetSummaryDto {
  return {
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
function makeNumberedCodesApi(lastPage: number, perPage = 2) {
  const getResultCodes = jest.fn(
    ({ pageNumber = 0 }: { pageNumber?: number }) =>
      of(
        makeCodesPage({
          pageNumber,
          last: pageNumber === lastPage,
          content: Array.from({ length: perPage }, (_, index) =>
            makeCode({
              resultCode: `RC${pageNumber * perPage + index}`,
              title: `Result ${pageNumber * perPage + index}`,
            }),
          ),
        }),
      ) as unknown,
  );
  return {
    getResultCodes,
    codesApi: { getResultCodes } as unknown as ResultCodesApi,
  };
}

describe('result-code helpers', () => {
  describe('loadAllResultCodes$', () => {
    it('requests pages in order until the last page and emits every code once', async () => {
      const { codesApi, getResultCodes } = makeNumberedCodesApi(2);

      const codes = await firstValueFrom(loadAllResultCodes$(codesApi, 2));

      expect(getResultCodes.mock.calls).toEqual(
        [0, 1, 2].map((pageNumber) => [{ pageNumber, pageSize: 2 }]),
      );
      expect(codes.map((code) => code.resultCode)).toEqual([
        'RC0',
        'RC1',
        'RC2',
        'RC3',
        'RC4',
        'RC5',
      ]);
    });

    it('uses a page size of 100 by default', async () => {
      const { codesApi, getResultCodes } = makeNumberedCodesApi(0);

      await firstValueFrom(loadAllResultCodes$(codesApi));

      expect(getResultCodes).toHaveBeenCalledWith({
        pageNumber: 0,
        pageSize: 100,
      });
    });

    it('makes one request when the response has no last flag and the server ignores pageNumber', async () => {
      const page = makeCodesPage({
        pageNumber: 0,
        pageSize: 10,
        totalPages: 5,
        content: [
          makeCode({ resultCode: 'RC1', title: 'One' }),
          makeCode({ resultCode: 'RC2', title: 'Two' }),
        ],
      });
      const getResultCodes = jest.fn(() => of(page) as unknown);
      const codesApi = { getResultCodes } as unknown as ResultCodesApi;

      const codes = await firstValueFrom(loadAllResultCodes$(codesApi));

      expect(getResultCodes).toHaveBeenCalledTimes(1);
      expect(codes).toEqual(page.content);
    });

    it('counts pages itself and stops at totalPages when the server ignores pageNumber', async () => {
      const page = makeCodesPage({
        pageNumber: 0,
        totalPages: 3,
        last: false,
        content: [makeCode({ resultCode: 'RC1', title: 'One' })],
      });
      const getResultCodes = jest.fn(() => of(page) as unknown);
      const codesApi = { getResultCodes } as unknown as ResultCodesApi;

      const codes = await firstValueFrom(loadAllResultCodes$(codesApi, 1));

      expect(getResultCodes.mock.calls).toEqual(
        [0, 1, 2].map((pageNumber) => [{ pageNumber, pageSize: 1 }]),
      );
      expect(codes).toHaveLength(3);
    });

    it('stops at an empty page even when last is false', async () => {
      const getResultCodes = jest.fn(
        ({ pageNumber = 0 }: { pageNumber?: number }) =>
          of(
            makeCodesPage({
              pageNumber,
              last: false,
              content:
                pageNumber === 0
                  ? [makeCode({ resultCode: 'RC1', title: 'One' })]
                  : [],
            }),
          ) as unknown,
      );
      const codesApi = { getResultCodes } as unknown as ResultCodesApi;

      const codes = await firstValueFrom(loadAllResultCodes$(codesApi));

      expect(getResultCodes).toHaveBeenCalledTimes(2);
      expect(codes).toEqual([makeCode({ resultCode: 'RC1', title: 'One' })]);
    });

    it('passes on an error from a later page', async () => {
      const getResultCodes = jest.fn(
        ({ pageNumber = 0 }: { pageNumber?: number }) =>
          (pageNumber === 0
            ? of(
                makeCodesPage({
                  pageNumber: 0,
                  last: false,
                  content: [makeCode({ resultCode: 'RC1', title: 'One' })],
                }),
              )
            : throwError(() => new Error('page failed'))) as unknown,
      );
      const codesApi = { getResultCodes } as unknown as ResultCodesApi;

      await expect(
        firstValueFrom(loadAllResultCodes$(codesApi)),
      ).rejects.toThrow('page failed');
    });
  });

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

      expect(getResultCodesMock).toHaveBeenCalledTimes(1);
      expect(getResultCodesMock).toHaveBeenCalledWith({
        pageNumber: 0,
        pageSize: 100,
      });
      expect(sig()).toEqual(page.content);
    });

    it('returns codes from every page, not just the first 100', () => {
      const { codesApi, getResultCodes } = makeNumberedCodesApi(1, 100);

      const sig = TestBed.runInInjectionContext(() =>
        getAllResultCodes(codesApi),
      );

      expect(getResultCodes.mock.calls).toEqual([
        [{ pageNumber: 0, pageSize: 100 }],
        [{ pageNumber: 1, pageSize: 100 }],
      ]);
      expect(sig()).toHaveLength(200);
      expect(sig()[199]).toEqual({ resultCode: 'RC199', title: 'Result 199' });
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

    it('returns [] when a later page errors', () => {
      const getResultCodesMock = jest.fn(
        ({ pageNumber = 0 }: { pageNumber?: number }) =>
          (pageNumber === 0
            ? of(
                makeCodesPage({
                  pageNumber: 0,
                  last: false,
                  content: [makeCode({ resultCode: 'RC1', title: 'One' })],
                }),
              )
            : throwError(() => boomError)) as unknown,
      );
      const codesApi = {
        getResultCodes: getResultCodesMock,
      } as unknown as ResultCodesApi;

      const sig = TestBed.runInInjectionContext(() =>
        getAllResultCodes(codesApi),
      );

      expect(getResultCodesMock).toHaveBeenCalledTimes(2);
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
