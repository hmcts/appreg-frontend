/*
Helper functions for Application Codes
*/

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CODE_SUGGESTION_MESSAGES } from '@constants/application-list-entry/code-suggestion-messages';
import {
  ApplicationCodeGetDetailDto,
  ApplicationCodeGetSummaryDto,
  ApplicationCodePage,
  ApplicationCodeSuggestionDto,
  ApplicationCodesApi,
  GetApplicationCodeByCodeAndDateRequestParams,
  GetApplicationCodesRequestParams,
} from '@openapi';

/** Fetch a single code detail for a code + lodgement date. */
export function fetchCodeDetail$(
  api: ApplicationCodesApi,
  code: string,
  date: string,
  useTransferCache = true,
): Observable<ApplicationCodeGetDetailDto> {
  const params: GetApplicationCodeByCodeAndDateRequestParams = { code, date };
  return api.getApplicationCodeByCodeAndDate(params, 'body', false, {
    transferCache: useTransferCache,
  });
}

export function requiresAccountReference(
  applicationCode: string | null | undefined,
): boolean {
  return applicationCode?.trim().toUpperCase().startsWith('EF') === true;
}

/** Safe accessors (avoid any/unknown). */
export function titleFromDetail(d: ApplicationCodeGetDetailDto): string {
  return d?.title ?? '';
}

export function wordingFromDetail(d: ApplicationCodeGetDetailDto): string {
  // Some backends return "wording" or "defaultWording"
  const wording = d?.wording as unknown;
  if (typeof wording === 'string') {
    return wording;
  }

  if (wording && typeof wording === 'object') {
    const template = (wording as { template?: unknown }).template;
    if (typeof template === 'string') {
      return template;
    }
  }
  return '';
}

export type CodeRow = {
  applicationCodeId?: number;
  code: string;
  title: string;
  bulk: string;
  fee: string;
  isFeeDue: string;
};

/** A suggested code: a CodeRow plus the API's reason and the lodgement date flag. */
export type CodeSuggestionRow = CodeRow & {
  reason: string;
  lodgementDateFlag: string;
};

export type CodeRowsResult = {
  rows: CodeRow[];
  totalPages: number;
};

function mapCodeRow(i: ApplicationCodeGetSummaryDto): CodeRow {
  return {
    applicationCodeId: i.applicationCodeId,
    code: i.applicationCode ?? '',
    title: i.title ?? '',
    bulk: i.bulkRespondentAllowed ? 'Yes' : 'No',
    fee: i.feeReference ?? '—',
    isFeeDue: i.isFeeDue ? 'Yes' : 'No',
  };
}

export function mapCodeRows(page: ApplicationCodePage): CodeRow[] {
  const items = page?.content ?? [];
  return items.map(mapCodeRow);
}

/**
 * Maps code suggestions to table rows, best match (rank 1) first.
 *
 * The flag is shown only when a code was not active on the lodgement date
 * (activeOnLodgementDate false); null means no lodgement date was sent.
 * Suggestions without an application code are left out. The fee amount is
 * not shown.
 */
export function mapCodeSuggestionRows(
  suggestions: readonly ApplicationCodeSuggestionDto[] | null | undefined,
): CodeSuggestionRow[] {
  return (suggestions ?? [])
    .filter((suggestion) => !!suggestion?.applicationCode)
    .sort((a, b) => a.rank - b.rank)
    .map((suggestion) => ({
      ...mapCodeRow(suggestion.applicationCode),
      reason: suggestion.reason ?? '',
      lodgementDateFlag:
        suggestion.activeOnLodgementDate === false
          ? CODE_SUGGESTION_MESSAGES.notActiveOnLodgementDate
          : '',
    }));
}

/**
 * Fetches a page of application codes (raw).
 *
 * Keep subscription and cancellation in the caller (component) so we can
 * compose with Angular’s takeUntilDestroyed(destroyRef).
 */
export function fetchCodesPage$(
  api: ApplicationCodesApi,
  request: GetApplicationCodesRequestParams,
  useTransferCache = true,
): Observable<ApplicationCodePage> {
  return api.getApplicationCodes(request, 'body', false, {
    transferCache: useTransferCache,
  });
}

/**
 * Convenience: fetch codes and map to the table’s CodeRow[].
 */
export function fetchCodeRows$(
  api: ApplicationCodesApi,
  request: GetApplicationCodesRequestParams,
  useTransferCache = true,
): Observable<CodeRowsResult> {
  return fetchCodesPage$(api, request, useTransferCache).pipe(
    map((page: ApplicationCodePage) => ({
      rows: mapCodeRows(page),
      totalPages: page.totalPages ?? 0,
    })),
  );
}
