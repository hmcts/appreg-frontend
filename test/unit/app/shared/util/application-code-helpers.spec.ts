import { firstValueFrom, of } from 'rxjs';

import type {
  ApplicationCodeGetDetailDto,
  ApplicationCodePage,
  ApplicationCodesApi,
  GetApplicationCodesRequestParams,
} from '@openapi';
import {
  CodeRow,
  CodeRowsResult,
  fetchCodeDetail$,
  fetchCodeRows$,
  fetchCodesPage$,
  mapCodeRows,
  titleFromDetail,
  wordingFromDetail,
} from '@util/application-code-helpers';

describe('application-code-helpers', () => {
  type ApiMock = jest.Mocked<
    Pick<
      ApplicationCodesApi,
      'getApplicationCodeByCodeAndDate' | 'getApplicationCodes'
    >
  >;

  const makeApi = (): ApiMock => ({
    getApplicationCodeByCodeAndDate: jest.fn(),
    getApplicationCodes: jest.fn(),
  });

  const asReturn = <F extends (...args: never[]) => unknown>(
    _fn: F,
    v: unknown,
  ) => v as ReturnType<F>;

  describe('fetchCodeDetail$', () => {
    it('calls getApplicationCodeByCodeAndDate with correct params and transferCache default true', async () => {
      const api = makeApi();

      const dto = { title: 'T1' } as unknown as ApplicationCodeGetDetailDto;

      api.getApplicationCodeByCodeAndDate.mockReturnValueOnce(
        asReturn(api.getApplicationCodeByCodeAndDate, of(dto)),
      );

      const res = await firstValueFrom(
        fetchCodeDetail$(
          api as unknown as ApplicationCodesApi,
          'ABC',
          '2026-02-23',
        ),
      );

      expect(res).toBe(dto);
      expect(api.getApplicationCodeByCodeAndDate).toHaveBeenCalledWith(
        { code: 'ABC', date: '2026-02-23' },
        'body',
        false,
        { transferCache: true },
      );
    });

    it('passes transferCache false when useTransferCache is false', async () => {
      const api = makeApi();

      const dto = { title: 'T1' } as unknown as ApplicationCodeGetDetailDto;

      api.getApplicationCodeByCodeAndDate.mockReturnValueOnce(
        asReturn(api.getApplicationCodeByCodeAndDate, of(dto)),
      );

      await firstValueFrom(
        fetchCodeDetail$(
          api as unknown as ApplicationCodesApi,
          'ABC',
          '2026-02-23',
          false,
        ),
      );

      expect(api.getApplicationCodeByCodeAndDate).toHaveBeenCalledWith(
        { code: 'ABC', date: '2026-02-23' },
        'body',
        false,
        { transferCache: false },
      );
    });
  });

  describe('titleFromDetail', () => {
    it('returns title when present', () => {
      const dto = { title: 'Hello' } as unknown as ApplicationCodeGetDetailDto;
      expect(titleFromDetail(dto)).toBe('Hello');
    });

    it('returns empty string when missing', () => {
      expect(
        titleFromDetail({} as unknown as ApplicationCodeGetDetailDto),
      ).toBe('');
      expect(
        titleFromDetail(null as unknown as ApplicationCodeGetDetailDto),
      ).toBe('');
    });
  });

  describe('wordingFromDetail', () => {
    it('returns wording when wording is a string', () => {
      const dto = {
        wording: 'My wording',
      } as unknown as ApplicationCodeGetDetailDto;
      expect(wordingFromDetail(dto)).toBe('My wording');
    });

    it('returns template when wording is an object with template string', () => {
      const dto = {
        wording: { template: 'Template text' },
      } as unknown as ApplicationCodeGetDetailDto;

      expect(wordingFromDetail(dto)).toBe('Template text');
    });

    it('returns empty string when wording is missing or unsupported shape', () => {
      expect(
        wordingFromDetail({} as unknown as ApplicationCodeGetDetailDto),
      ).toBe('');
      expect(
        wordingFromDetail({
          wording: 123,
        } as unknown as ApplicationCodeGetDetailDto),
      ).toBe('');
      expect(
        wordingFromDetail({
          wording: { template: 123 },
        } as unknown as ApplicationCodeGetDetailDto),
      ).toBe('');
      expect(
        wordingFromDetail(null as unknown as ApplicationCodeGetDetailDto),
      ).toBe('');
    });
  });

  describe('mapCodeRows', () => {
    type PageItem = NonNullable<ApplicationCodePage['content']>[number];

    it('maps content items to CodeRow[] with fallbacks', () => {
      const item1 = {
        applicationCode: 'A1',
        title: 'Title 1',
        bulkRespondentAllowed: true,
        feeReference: 'FEE1',
      } as unknown as PageItem;

      const item2 = {
        applicationCode: null,
        title: null,
        bulkRespondentAllowed: false,
        feeReference: null,
      } as unknown as PageItem;

      const page = {
        content: [item1, item2],
      } as unknown as ApplicationCodePage;

      expect(mapCodeRows(page)).toEqual<CodeRow[]>([
        { code: 'A1', title: 'Title 1', bulk: 'Yes', fee: 'FEE1' },
        { code: '', title: '', bulk: 'No', fee: '—' },
      ]);
    });

    it('returns empty array when page content missing', () => {
      expect(mapCodeRows({} as unknown as ApplicationCodePage)).toEqual([]);
      expect(mapCodeRows(null as unknown as ApplicationCodePage)).toEqual([]);
    });
  });

  describe('fetchCodesPage$', () => {
    it('calls getApplicationCodes with correct args and transferCache default true', async () => {
      const api = makeApi();

      const request = {
        search: 'abc',
        page: 1,
      } as unknown as GetApplicationCodesRequestParams;

      const page = { content: [] } as unknown as ApplicationCodePage;

      api.getApplicationCodes.mockReturnValueOnce(
        asReturn(api.getApplicationCodes, of(page)),
      );

      const res = await firstValueFrom(
        fetchCodesPage$(api as unknown as ApplicationCodesApi, request),
      );

      expect(res).toBe(page);
      expect(api.getApplicationCodes).toHaveBeenCalledWith(
        request,
        'body',
        false,
        {
          transferCache: true,
        },
      );
    });

    it('passes transferCache false when useTransferCache is false', async () => {
      const api = makeApi();

      const request = {
        search: 'abc',
        page: 1,
      } as unknown as GetApplicationCodesRequestParams;

      const page = { content: [] } as unknown as ApplicationCodePage;

      api.getApplicationCodes.mockReturnValueOnce(
        asReturn(api.getApplicationCodes, of(page)),
      );

      await firstValueFrom(
        fetchCodesPage$(api as unknown as ApplicationCodesApi, request, false),
      );

      expect(api.getApplicationCodes).toHaveBeenCalledWith(
        request,
        'body',
        false,
        {
          transferCache: false,
        },
      );
    });
  });

  describe('fetchCodeRows$', () => {
    type PageItem = NonNullable<ApplicationCodePage['content']>[number];

    it('fetches codes page and maps to CodeRow[]', async () => {
      const api = makeApi();

      const request = {
        search: 'abc',
        page: 1,
      } as unknown as GetApplicationCodesRequestParams;

      const item = {
        applicationCode: 'A1',
        title: 'Title 1',
        bulkRespondentAllowed: true,
        feeReference: 'FEE1',
      } as unknown as PageItem;

      const page = { content: [item] } as unknown as ApplicationCodePage;

      api.getApplicationCodes.mockReturnValueOnce(
        asReturn(api.getApplicationCodes, of(page)),
      );

      const rows = await firstValueFrom(
        fetchCodeRows$(api as unknown as ApplicationCodesApi, request),
      );

      expect(rows).toEqual<CodeRowsResult>({
        rows: [{ bulk: 'Yes', code: 'A1', fee: 'FEE1', title: 'Title 1' }],
        totalPages: 0,
      });
    });
  });
});
