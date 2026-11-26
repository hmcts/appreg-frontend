import { Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, catchError, expand, map, of, reduce } from 'rxjs';

import {
  ApplicationListEntryResultsApi,
  ResultCodeGetSummaryDto,
  ResultCodePage,
  ResultCodesApi,
  ResultGetDto,
  ResultPage,
  TemplateDetail,
  TemplateKeyWithConstraint,
  TemplateSubstitution,
} from '@openapi';
import {
  ExistingResultRow,
  PendingResultRow,
} from '@shared-types/result-code/result-code-row';
import { wordingFromFields } from '@util/template-substitution-utils';

export function getAllResultCodes(
  codesApi: ResultCodesApi,
): Signal<ResultCodeGetSummaryDto[]> {
  const state = getAllResultCodesState(codesApi);
  return computed(() => state().codes);
}

export function getAllResultCodesState(
  codesApi: ResultCodesApi,
): Signal<{ codes: ResultCodeGetSummaryDto[]; loaded: boolean }> {
  // When checking for historical codes, we need to ensure we have a complete list of codes.
  return toSignal(
    codesApi.getResultCodes({ pageNumber: 0, pageSize: 100 }).pipe(
      expand((page: ResultCodePage) =>
        page.pageNumber + 1 < (page.totalPages ?? 1)
          ? codesApi.getResultCodes({
              pageNumber: page.pageNumber + 1,
              pageSize: 100,
            })
          : EMPTY,
      ),
      reduce(
        (codes, page) => [...codes, ...(page.content ?? [])],
        [] as ResultCodeGetSummaryDto[],
      ),
      map((codes) => ({ codes, loaded: true })),
      catchError(() =>
        of({ codes: [] as ResultCodeGetSummaryDto[], loaded: false }),
      ),
    ),
    { initialValue: { codes: [] as ResultCodeGetSummaryDto[], loaded: false } },
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
  titlesByReferenceId: Record<number, string | undefined>,
): ExistingResultRow[] {
  return results.map((r) => {
    const resolvedFields =
      fromTemplateDetail((r as ResultGetDto & { wording?: unknown }).wording) ??
      [];

    return {
      kind: 'existing',
      id: r.id,
      resultCode: r.resultCode,
      display: titlesByReferenceId[r.resultCodeId]
        ? `${r.resultCode} - ${titlesByReferenceId[r.resultCodeId]}`
        : r.resultCode,
      updatedDateTime: r.updatedDateTime,
      wordingFields: resolvedFields,
      wording: wordingFromFields(resolvedFields),
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
    .filter(hasStringKeyAndValue)
    .map((c) => ({ key: c.key, value: c.value }));
}

function hasStringKeyAndValue(
  c: TemplateKeyWithConstraint | undefined,
): c is TemplateKeyWithConstraint & { value: string } {
  return typeof c?.key === 'string' && typeof c.value === 'string';
}
