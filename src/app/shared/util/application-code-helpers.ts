/*
Helper functions for Application Codes
*/

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  ApplicationCodeGetDetailDto,
  ApplicationCodePage,
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
  code: string;
  title: string;
  bulk: string;
  fee: string;
  isFeeDue: string;
};

export type CodeRowsResult = {
  rows: CodeRow[];
  totalPages: number;
};

export function mapCodeRows(page: ApplicationCodePage): CodeRow[] {
  const items = page?.content ?? [];
  return items.map((i) => ({
    code: i.applicationCode ?? '',
    title: i.title ?? '',
    bulk: i.bulkRespondentAllowed ? 'Yes' : 'No',
    fee: i.feeReference ?? '—',
    isFeeDue: i.isFeeDue ? 'Yes' : 'No',
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
