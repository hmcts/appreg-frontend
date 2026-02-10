import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import {
  ApplicationListEntryResultsApi,
  ResultCodeGetSummaryDto,
  ResultCodePage,
  ResultCodesApi,
  ResultGetDto,
  ResultPage,
} from '@openapi';
import {
  formatResultCodeLabel,
  getAllResultCodes,
  getEntryResults$,
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
  } as unknown as ResultCodeGetSummaryDto;
}
function makeCodesPage(overrides: Partial<ResultCodePage>): ResultCodePage {
  return { content: [], ...overrides } as unknown as ResultCodePage;
}
function makeResult(overrides: Partial<ResultGetDto>): ResultGetDto {
  return {
    id: 'R-1',
    resultCode: 'RC1',
    wordingFields: [],
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
    it('maps wording "-" when no fields, joins when fields exist', () => {
      const codes = [makeCode({ resultCode: 'RC1', title: 'One' })];

      const rows1 = toExistingRows(
        [makeResult({ id: 'E1', resultCode: 'RC1', wordingFields: [] })],
        codes,
      );
      expect(rows1[0].wording).toBe('-');

      const rows2 = toExistingRows(
        [
          makeResult({
            id: 'E2',
            resultCode: 'RC1',
            wordingFields: ['A', 'B'],
          }),
        ],
        codes,
      );
      expect(rows2[0].wording).toBe('A, B');
    });
  });
});
