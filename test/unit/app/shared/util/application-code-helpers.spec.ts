import { firstValueFrom, of } from 'rxjs';

import type {
  ApplicationCodeGetDetailDto,
  ApplicationCodePage,
  ApplicationCodeSuggestionDto,
  ApplicationCodesApi,
  GetApplicationCodesRequestParams,
} from '@openapi';
import {
  CodeRow,
  CodeRowsResult,
  CodeSuggestionRow,
  fetchCodeDetail$,
  fetchCodeRows$,
  fetchCodesPage$,
  mapCodeRows,
  mapCodeSuggestionRows,
  requiresAccountReference,
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

  describe('requiresAccountReference', () => {
    const cases: Array<[string, string | null | undefined, boolean]> = [
      ['EF application code', 'EF123', true],
      ['lowercase EF application code', 'ef123', true],
      ['mixed-case EF application code', 'eF123', true],
      ['EF application code with whitespace', '  EF123  ', true],
      ['non-EF application code', 'AF123', false],
      ['blank application code', '   ', false],
      ['missing application code', null, false],
    ];

    it.each(cases)('returns %s result', (_label, code, expected) => {
      expect(requiresAccountReference(code)).toBe(expected);
    });
  });

  describe('mapCodeRows', () => {
    type PageItem = NonNullable<ApplicationCodePage['content']>[number];

    it('maps content items to CodeRow[] with fallbacks', () => {
      const item1 = {
        applicationCodeId: 42,
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
        {
          applicationCodeId: 42,
          code: 'A1',
          title: 'Title 1',
          bulk: 'Yes',
          fee: 'FEE1',
          isFeeDue: 'No',
        },
        { code: '', title: '', bulk: 'No', fee: '—', isFeeDue: 'No' },
      ]);
    });

    it('returns empty array when page content missing', () => {
      expect(mapCodeRows({} as unknown as ApplicationCodePage)).toEqual([]);
      expect(mapCodeRows(null as unknown as ApplicationCodePage)).toEqual([]);
    });
  });

  describe('mapCodeSuggestionRows', () => {
    const suggestion = (
      rank: number,
      activeOnLodgementDate: boolean | null,
      isFeeDue: boolean,
    ): ApplicationCodeSuggestionDto => ({
      rank,
      reason: `Matches 'synthetic ${rank}' in the title`,
      activeOnLodgementDate,
      applicationCode: {
        applicationCodeId: 99000 + rank,
        applicationCode: `AP9900${rank}`,
        title: `Synthetic code title ${rank}`,
        wording: { template: 'Synthetic wording' },
        isFeeDue,
        requiresRespondent: false,
        bulkRespondentAllowed: rank === 1,
        feeReference: isFeeDue ? 'SYN1' : null,
        feeAmount: isFeeDue ? { value: 1000 } : null,
      },
    });

    it('maps suggestions to rows best match first, flagging only codes not active on the lodgement date', () => {
      const suggestions = [
        suggestion(3, null, false),
        suggestion(1, false, true),
        suggestion(2, true, false),
      ];

      expect(mapCodeSuggestionRows(suggestions)).toStrictEqual<
        CodeSuggestionRow[]
      >([
        {
          applicationCodeId: 99001,
          code: 'AP99001',
          title: 'Synthetic code title 1',
          bulk: 'Yes',
          fee: 'SYN1',
          isFeeDue: 'Yes',
          reason: "Matches 'synthetic 1' in the title",
          lodgementDateFlag: 'Not active on the lodgement date',
        },
        {
          applicationCodeId: 99002,
          code: 'AP99002',
          title: 'Synthetic code title 2',
          bulk: 'No',
          fee: '—',
          isFeeDue: 'No',
          reason: "Matches 'synthetic 2' in the title",
          lodgementDateFlag: '',
        },
        {
          applicationCodeId: 99003,
          code: 'AP99003',
          title: 'Synthetic code title 3',
          bulk: 'No',
          fee: '—',
          isFeeDue: 'No',
          reason: "Matches 'synthetic 3' in the title",
          lodgementDateFlag: '',
        },
      ]);
      // The input keeps the API's order.
      expect(suggestions.map((item) => item.rank)).toEqual([3, 1, 2]);
    });

    it('leaves out suggestions without an application code', () => {
      const missing = {
        ...suggestion(1, true, false),
        applicationCode: null,
      } as unknown as ApplicationCodeSuggestionDto;

      expect(
        mapCodeSuggestionRows([missing, suggestion(2, true, false)]).map(
          (row) => row.code,
        ),
      ).toEqual(['AP99002']);
    });

    it('returns an empty array when there are no suggestions', () => {
      expect(mapCodeSuggestionRows([])).toEqual([]);
      expect(mapCodeSuggestionRows(null)).toEqual([]);
      expect(mapCodeSuggestionRows(undefined)).toEqual([]);
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

    it('fetches codes page and maps to CodeRowsResult', async () => {
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

      const page = {
        content: [item],
        totalPages: 7,
      } as unknown as ApplicationCodePage;

      api.getApplicationCodes.mockReturnValueOnce(
        asReturn(api.getApplicationCodes, of(page)),
      );

      const rows = await firstValueFrom(
        fetchCodeRows$(api as unknown as ApplicationCodesApi, request),
      );

      expect(rows).toEqual<CodeRowsResult>({
        rows: [
          {
            bulk: 'Yes',
            code: 'A1',
            fee: 'FEE1',
            isFeeDue: 'No',
            title: 'Title 1',
          },
        ],
        totalPages: 7,
      });
    });

    it('passes transferCache false through to getApplicationCodes', async () => {
      const api = makeApi();

      const request = {
        search: 'abc',
        page: 1,
      } as unknown as GetApplicationCodesRequestParams;

      const page = {
        content: [],
        totalPages: 0,
      } as unknown as ApplicationCodePage;

      api.getApplicationCodes.mockReturnValueOnce(
        asReturn(api.getApplicationCodes, of(page)),
      );

      await firstValueFrom(
        fetchCodeRows$(api as unknown as ApplicationCodesApi, request, false),
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
});
