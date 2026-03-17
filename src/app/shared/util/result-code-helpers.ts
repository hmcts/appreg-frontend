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
  TemplateDetail,
  TemplateSubstitution,
} from '@openapi';
import {
  ExistingResultRow,
  PendingResultRow,
} from '@shared-types/result-code/result-code-row';
import {
  WordingFieldLike,
  wordingFromFields,
} from '@util/template-substitution-utils';

export function getAllResultCodes(
  codesApi: ResultCodesApi,
): Signal<ResultCodeGetSummaryDto[]> {
  return toSignal(
    codesApi.getResultCodes({ pageNumber: 0, pageSize: 100 }).pipe(
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
      pageNumber: 0,
      pageSize: 100,
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

export function toExistingRows(
  results: ResultGetDto[],
  codes: ResultCodeGetSummaryDto[],
): ExistingResultRow[] {
  return results.map((r) => {
    const resolvedFields =
      fromTemplateDetail((r as ResultGetDto & { wording?: unknown }).wording) ??
      [];

    return {
      kind: 'existing',
      id: r.id,
      resultCode: r.resultCode,
      display: formatResultCodeLabel(r.resultCode, codes),
      wordingFields: resolvedFields,
      wording: wordingFromFields(
        resolvedFields as (string | TemplateSubstitution)[],
      ),
    };
  });
}

function fromTemplateDetail(
  wording: unknown,
): TemplateSubstitution[] | undefined {
  if (!wording || typeof wording !== 'object') {
    return undefined;
  }

  const detail = wording as Partial<TemplateDetail>;
  const constraints = detail['substitution-key-constraints'];

  if (!Array.isArray(constraints) || constraints.length === 0) {
    return undefined;
  }

  return constraints
    .filter((c) => c?.key && typeof c.value === 'string')
    .map((c) => ({ key: c.key!, value: c.value! }));
}
