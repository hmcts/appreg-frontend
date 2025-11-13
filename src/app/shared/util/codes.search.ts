import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  ApplicationCodePage,
  ApplicationCodesApi,
  GetApplicationCodesRequestParams,
} from '../../../generated/openapi';

import { CodeRow, mapCodeRows } from './codes.mappers';

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
): Observable<CodeRow[]> {
  return fetchCodesPage$(api, request, useTransferCache).pipe(
    map((page: ApplicationCodePage) => mapCodeRows(page)),
  );
}
