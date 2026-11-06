import { Signal } from '@angular/core';
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

const RESULT_CODES_PAGE_SIZE = 100;

type IndexedResultCodePage = { index: number; page: ResultCodePage };

/**
 * Requests every page of GET /result-codes and emits all codes once the last
 * page has loaded. Errors are passed on.
 *
 * The next page is requested only when the server says `last: false`, the page
 * has content and, when `totalPages` is sent, the next index is in range. A
 * response without `last` counts as the last page. The page index is counted
 * here rather than read back from the response, so a server or stub that
 * ignores `pageNumber` cannot make this page forever.
 */
export function loadAllResultCodes$(
  codesApi: ResultCodesApi,
  pageSize = RESULT_CODES_PAGE_SIZE,
): Observable<ResultCodeGetSummaryDto[]> {
  const getPage = (index: number): Observable<IndexedResultCodePage> =>
    codesApi
      .getResultCodes({ pageNumber: index, pageSize })
      .pipe(map((page) => ({ index, page })));

  return getPage(0).pipe(
    expand(({ index, page }) =>
      hasNextResultCodePage(page, index) ? getPage(index + 1) : EMPTY,
    ),
    map(({ page }) => page.content ?? []),
    reduce(
      (all, content) => all.concat(content),
      [] as ResultCodeGetSummaryDto[],
    ),
  );
}

function hasNextResultCodePage(page: ResultCodePage, index: number): boolean {
  if (page.last !== false || !page.content?.length) {
    return false;
  }
  return typeof page.totalPages !== 'number' || index + 1 < page.totalPages;
}

export function getAllResultCodes(
  codesApi: ResultCodesApi,
): Signal<ResultCodeGetSummaryDto[]> {
  return toSignal(
    loadAllResultCodes$(codesApi).pipe(
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
