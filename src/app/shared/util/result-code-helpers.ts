import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of } from 'rxjs';

import {
  ApplicationListEntryResultsApi,
  ResultCodeGetSummaryDto,
  ResultCodePage,
  ResultCodesApi,
  ResultGetDto,
  ResultPage,
} from '@openapi';
import {
  ExistingResultRow,
  PendingResultRow,
} from '@shared-types/result-code/result-code-row';

export function getAllResultCodes(
  codesApi: ResultCodesApi,
): Signal<ResultCodeGetSummaryDto[]> {
  return toSignal(
    codesApi.getResultCodes({ page: 0, size: 100 }).pipe(
      map((page: ResultCodePage) => page.content ?? []),
      catchError(() => of([] as ResultCodeGetSummaryDto[])),
    ),
    { initialValue: [] as ResultCodeGetSummaryDto[] },
  );
}

export function getEntryResults$(
  entryResultsApi: ApplicationListEntryResultsApi,
  params: { listId: string; entryId: string },
): Observable<ResultGetDto[]> {
  return entryResultsApi
    .getApplicationListEntryResults({
      listId: params.listId,
      entryId: params.entryId,
      page: 0,
      size: 100, // safe if small; adjust if needed
    })
    .pipe(
      map((page: ResultPage) => page.content ?? []),
      catchError(() => of([] as ResultGetDto[])),
    );
}

export function formatResultCodeLabel(
  resultCode: string,
  allCodes: ResultCodeGetSummaryDto[],
): string {
  const match = allCodes.find((c) => c.resultCode === resultCode);
  return match ? `${match.resultCode} - ${match.title}` : resultCode;
}

export type PreviousResultRow = ResultGetDto & {
  display: string; // "CODE - Title"
};

export function mapPreviousResults(
  results: ResultGetDto[],
  allCodes: ResultCodeGetSummaryDto[],
): PreviousResultRow[] {
  return results.map((r) => ({
    ...r,
    display: formatResultCodeLabel(r.resultCode, allCodes),
  }));
}

export type ResultRow = ExistingResultRow | PendingResultRow;

function wordingFromFields(fields: string[] | null | undefined): string {
  const safe = fields ?? [];
  return safe.length > 0 ? safe.join(', ') : '-';
}

export function toExistingRows(
  results: ResultGetDto[],
  codes: ResultCodeGetSummaryDto[],
): ExistingResultRow[] {
  return results.map((r) => ({
    kind: 'existing',
    id: r.id,
    resultCode: r.resultCode,
    display: formatResultCodeLabel(r.resultCode, codes),
    wordingFields: r.wordingFields ?? [],
    wording: wordingFromFields(r.wordingFields),
  }));
}
