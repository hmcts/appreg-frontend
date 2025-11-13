import { Observable } from 'rxjs';

import {
  ApplicationCodeGetDetailDto,
  ApplicationCodesApi,
  GetApplicationCodeByCodeAndDateRequestParams,
} from '../../../generated/openapi';

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
  return d.wording ?? '';
}
