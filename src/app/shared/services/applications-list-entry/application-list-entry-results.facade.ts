import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import {
  ApplicationListEntryResultsApi,
  BulkDeleteResultEntriesRequestParams,
  BulkDeleteResultItemDto,
  ResultCodeGetDetailDto,
  ResultCodesApi,
  ResultGetDto,
  TemplateDetail,
} from '@openapi';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import type { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';
import { getAllResultCodes, getEntryResults$ } from '@util/result-code-helpers';

export type BulkResultRemoval =
  | {
      entryId: string;
      resultId: string;
      success: true;
    }
  | {
      entryId: string;
      resultId: string;
      success: false;
      error: unknown;
    };

type BulkResultUpdate =
  | {
      result: ResultGetDto;
      success: true;
    }
  | {
      error: unknown;
      success: false;
    };

type EntryGroupByListId = {
  listId: string;
  entryIds: string[];
};

@Injectable()
export class ApplicationListEntryResultsFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly entryResultsApi = inject(ApplicationListEntryResultsApi);
  private readonly resultCodesApi = inject(ResultCodesApi);

  readonly resultCodesSignal = getAllResultCodes(this.resultCodesApi);

  readonly entryResults = signal<ResultGetDto[]>([]);
  readonly entryResultsLoading = signal(false);

  readonly newlyCreatedEntryResults = signal<ResultGetDto[]>([]);

  readonly pendingRows = signal<PendingResultRow[]>([]);
  readonly clearPendingToken = signal(0);

  readonly resultCodeWordingByCode = signal<Record<string, string>>({});
  readonly resultCodeTemplateByCode = signal<Record<string, TemplateDetail>>(
    {},
  );

  private readonly resultCodeDetailCache = new Map<
    string,
    ResultCodeGetDetailDto
  >();

  reset(): void {
    this.entryResults.set([]);
    this.entryResultsLoading.set(false);
    this.pendingRows.set([]);
    this.clearPendingToken.set(0);
    this.resultCodeWordingByCode.set({});
    this.resultCodeTemplateByCode.set({});
    this.resultCodeDetailCache.clear();
  }

  addCreatedEntryResults(results: ResultGetDto[]): void {
    this.newlyCreatedEntryResults.set(results ?? []);
  }

  clearCreatedEntryResults(): void {
    this.newlyCreatedEntryResults.set([]);
  }

  submitResultChangesForEntries(
    listId: string,
    entryIds: string[],
    payload: ResultSectionSubmitPayload,
    onSuccess?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    if (!listId || !payload) {
      return;
    }

    const updateRequests = this.buildUpdateRequests(payload, [
      { listId, entryIds },
    ]);
    const createRequests = this.buildCreateRequests(
      this.toUniqueEntryIds(entryIds),
      payload,
      (item, selectedEntryIds) =>
        this.entryResultsApi.bulkResultApplicationListEntries({
          listId,
          bulkResultDto: {
            entryIds: selectedEntryIds,
            result: {
              resultCode: item.resultCode.trim(),
              wordingFields: item.wordingFields ?? [],
            },
          },
        }),
    );

    this.submitCombinedRequests(
      updateRequests,
      createRequests,
      onSuccess,
      onError,
    );
  }

  submitResultsWithManyListIds(
    entryGroups: EntryGroupByListId[],
    payload: ResultSectionSubmitPayload,
    onSuccess?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    if (!payload || !entryGroups.length) {
      return;
    }

    const updateRequests = this.buildUpdateRequests(payload, entryGroups);
    const createRequests = this.buildCreateRequests(
      this.toUniqueEntryIds(
        entryGroups.flatMap((group) => group.entryIds ?? []),
      ),
      payload,
      (item, selectedEntryIds) =>
        this.entryResultsApi.bulkResultEntries({
          bulkResultDto: {
            entryIds: selectedEntryIds,
            result: {
              resultCode: item.resultCode.trim(),
              wordingFields: item.wordingFields ?? [],
            },
          },
        }),
    );

    this.submitCombinedRequests(
      updateRequests,
      createRequests,
      onSuccess,
      onError,
    );
  }

  removeCreatedEntryResults(
    listId: string,
    resultIds: string[],
    onSuccess?: (results: BulkResultRemoval[]) => void,
    onError?: (err: unknown) => void,
  ): void {
    if (!listId) {
      return;
    }

    const targets = (this.newlyCreatedEntryResults() ?? []).filter(
      (result) =>
        !!result.id &&
        !!result.entryId &&
        (resultIds.length === 0 || resultIds.includes(result.id)),
    );

    if (targets.length === 0) {
      return;
    }

    const removals = targets.map((result) => ({
      listId,
      entryId: result.entryId,
      resultId: result.id,
    }));

    this.bulkRemoveCreatedEntryResults(removals, onSuccess, onError);
  }

  bulkRemoveCreatedEntryResults(
    resultsToRemove: BulkDeleteResultItemDto[],
    onSuccess?: (results: BulkResultRemoval[]) => void,
    onError?: (err: unknown) => void,
  ): void {
    if (resultsToRemove.length === 0) {
      return;
    }

    this.bulkRemoveResult(
      resultsToRemove,
      () => {
        const deletedIds = new Set(
          resultsToRemove.map((result) => result.resultId),
        );

        this.newlyCreatedEntryResults.update((current) =>
          current.filter((result) => !deletedIds.has(result.id ?? '')),
        );

        onSuccess?.(
          resultsToRemove.map(({ entryId, resultId }) => ({
            entryId,
            resultId,
            success: true,
          })),
        );
      },
      onError,
    );
  }

  removeCreatedEntryResultGroup(
    listId: string,
    anchorResultId: string,
    onSuccess?: (results: BulkResultRemoval[]) => void,
    onError?: (err: unknown) => void,
  ): void {
    if (!listId || !anchorResultId) {
      return;
    }

    const createdResults = this.newlyCreatedEntryResults() ?? [];
    const anchor = createdResults.find(
      (result) => result.id === anchorResultId,
    );

    if (!anchor) {
      return;
    }

    const matchingIds = createdResults
      .filter((result) => this.areLogicallyEquivalentResults(result, anchor))
      .map((result) => result.id)
      .filter((id): id is string => !!id);

    this.removeCreatedEntryResults(listId, matchingIds, onSuccess, onError);
  }

  loadEntryResults(listId: string, entryId: string): void {
    if (!listId || !entryId) {
      return;
    }

    this.entryResultsLoading.set(true);

    getEntryResults$(this.entryResultsApi, { listId, entryId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.entryResults.set(results);
          this.entryResultsLoading.set(false);
        },
        error: () => {
          this.entryResults.set([]);
          this.entryResultsLoading.set(false);
        },
      });
  }

  removeResult(
    listId: string,
    entryId: string,
    resultId: string,
    onSuccess?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    if (!listId || !entryId || !resultId) {
      return;
    }

    this.bulkRemoveResult(
      [{ listId, entryId, resultId }],
      () => {
        this.loadEntryResults(listId, entryId);
        onSuccess?.();
      },
      onError,
    );
  }

  bulkRemoveResult(
    resultsToRemove: BulkDeleteResultItemDto[],
    onSuccess?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    if (resultsToRemove.length === 0) {
      return;
    }

    const params: BulkDeleteResultEntriesRequestParams = {
      bulkDeleteResultsDto: { results: resultsToRemove },
    };

    this.entryResultsApi
      .bulkDeleteResultEntries(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => onSuccess?.(),
        error: (err) => onError?.(err),
      });
  }

  submitResultChanges(
    listId: string,
    entryId: string,
    payload: ResultSectionSubmitPayload,
    onSuccess?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    if (!listId || !entryId || !payload) {
      return;
    }

    // PUT
    const existingRequests = (payload.existingToUpdate ?? [])
      .filter((item) => !!item.resultId && !!item.resultCode)
      .map((item) =>
        this.entryResultsApi.updateApplicationListEntryResult({
          listId,
          entryId,
          resultId: item.resultId,
          resultUpdateDto: {
            resultCode: item.resultCode.trim(),
            wordingFields: item.wordingFields ?? [],
          },
        }),
      );

    // POST
    const pendingRequests = (payload.pendingToCreate ?? [])
      .filter((row) => !!row.resultCode)
      .map((row) =>
        this.entryResultsApi.createApplicationListEntryResult({
          listId,
          entryId,
          resultCreateDto: {
            resultCode: row.resultCode.trim(),
            wordingFields: row.wordingFields ?? [],
          },
        }),
      );

    const allRequests = [...existingRequests, ...pendingRequests];
    if (allRequests.length === 0) {
      return;
    }

    forkJoin(allRequests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadEntryResults(listId, entryId);

          if (pendingRequests.length > 0) {
            this.clearPendingToken.update((n) => n + 1);
            this.pendingRows.set([]);
          }

          onSuccess?.();
        },
        error: (err) => onError?.(err),
      });
  }

  setPending(rows: PendingResultRow[]): void {
    this.pendingRows.set(rows ?? []);

    // Get result wording for each pending code
    const codes = rows?.map((row) => row.resultCode);
    codes.forEach((code) => {
      if (code) {
        this.ensureResultWording(code);
      }
    });
  }

  private toTemplateDetail(
    wording: string | TemplateDetail | null | undefined,
  ): TemplateDetail {
    return this.normalizeTemplateDetail(wording);
  }

  private ensureResultWording(code: string): void {
    const date = new Date().toISOString().slice(0, 10);
    const c = this.normCode(code);
    if (!c || !date) {
      return;
    }

    if (this.resultCodeWordingByCode()[c]) {
      return;
    }

    const key = `${c}|${date}`;
    const cached = this.resultCodeDetailCache.get(key);
    if (cached) {
      const wording = this.displayWording(cached.wording);

      this.resultCodeWordingByCode.update((m) => ({ ...m, [c]: wording }));
      this.resultCodeTemplateByCode.update((m) => ({
        ...m,
        [c]: this.toTemplateDetail(cached.wording),
      }));
      return;
    }

    this.resultCodesApi
      .getResultCodeByCodeAndDate({ code: c, date }, 'body', false, {
        transferCache: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.resultCodeDetailCache.set(key, detail);
          this.resultCodeWordingByCode.update((m) => ({
            ...m,
            [c]: this.displayWording(detail.wording),
          }));
          this.resultCodeTemplateByCode.update((m) => ({
            ...m,
            [c]: this.toTemplateDetail(detail.wording),
          }));
        },
        error: () => {
          this.resultCodeWordingByCode.update((m) => ({ ...m, [c]: '-' }));
          this.resultCodeTemplateByCode.update((m) => ({
            ...m,
            [c]: this.toTemplateDetail(''),
          }));
        },
      });
  }

  private normCode(code: string): string {
    return (code ?? '').trim().toUpperCase();
  }

  private normalizeTemplateDetail(
    wording: string | TemplateDetail | null | undefined,
  ): TemplateDetail {
    if (typeof wording === 'string') {
      return {
        template: this.unescapeTemplatePlaceholders(wording),
        'substitution-key-constraints': [],
      };
    }

    if (this.isTemplateDetail(wording)) {
      return {
        template: this.unescapeTemplatePlaceholders(wording.template ?? ''),
        'substitution-key-constraints':
          wording['substitution-key-constraints'] ?? [],
      };
    }

    return {
      template: '',
      'substitution-key-constraints': [],
    };
  }

  private displayWording(
    wording: string | TemplateDetail | null | undefined,
  ): string {
    return this.normalizeTemplateDetail(wording).template || '-';
  }

  private isTemplateDetail(value: unknown): value is TemplateDetail {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    return 'template' in value;
  }

  private unescapeTemplatePlaceholders(template: string): string {
    return template
      .replaceAll(String.raw`\{\{`, '{{')
      .replaceAll(String.raw`\}\}`, '}}');
  }

  private mergeCreatedEntryResults(results: ResultGetDto[]): void {
    if (results.length === 0) {
      return;
    }

    this.newlyCreatedEntryResults.update((current) => {
      const next = [...current];

      results.forEach((result) => {
        const existingIndex = next.findIndex(
          (currentResult) => currentResult.id === result.id,
        );

        if (existingIndex >= 0) {
          next[existingIndex] = result;
          return;
        }

        next.push(result);
      });

      return next;
    });
  }

  private areLogicallyEquivalentResults(
    left: ResultGetDto,
    right: ResultGetDto,
  ): boolean {
    return (
      (left.resultCode ?? '').trim() === (right.resultCode ?? '').trim() &&
      this.normalizedWordingTemplate(left) ===
        this.normalizedWordingTemplate(right)
    );
  }

  private normalizedWordingTemplate(result: ResultGetDto): string {
    return (result.wording?.template ?? '').trim();
  }

  private toUniqueEntryIds(entryIds: string[]): string[] {
    return [...new Set((entryIds ?? []).filter((entryId) => !!entryId))];
  }

  private buildCreateRequests(
    selectedEntryIds: string[],
    payload: ResultSectionSubmitPayload,
    requestFactory: (
      item: PendingResultRow,
      selectedEntryIds: string[],
    ) => Observable<ResultGetDto[]>,
  ): Observable<ResultGetDto[]>[] {
    if (selectedEntryIds.length === 0) {
      return [];
    }

    return (payload.pendingToCreate ?? [])
      .filter((item) => !!item.resultCode)
      .map((item) => requestFactory(item, selectedEntryIds));
  }

  private submitCombinedRequests(
    updateRequests: Observable<BulkResultUpdate>[],
    createRequests: Observable<ResultGetDto[]>[],
    onSuccess?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    const allRequests: Observable<BulkResultUpdate | ResultGetDto[]>[] = [
      ...updateRequests,
      ...createRequests,
    ];
    if (allRequests.length === 0) {
      return;
    }

    forkJoin(allRequests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.mergeCreatedEntryResults(
            results.flatMap((result) => this.toResultGetDtos(result)),
          );

          const failedUpdates = results.filter(
            (result): result is Extract<BulkResultUpdate, { success: false }> =>
              this.isBulkResultUpdate(result) && !result.success,
          );

          if (createRequests.length > 0) {
            this.clearPendingToken.update((n) => n + 1);
            this.pendingRows.set([]);
          }

          if (failedUpdates.length > 0) {
            onError?.(failedUpdates[0].error);
            return;
          }

          onSuccess?.();
        },
        error: (err) => onError?.(err),
      });
  }

  private buildUpdateRequests(
    payload: ResultSectionSubmitPayload,
    entryGroups: EntryGroupByListId[],
  ): Observable<BulkResultUpdate>[] {
    const currentCreatedResults = this.newlyCreatedEntryResults() ?? [];
    const createdById = new Map(
      currentCreatedResults
        .filter((result) => !!result.id)
        .map((result) => [result.id, result]),
    );
    const entryIdToListId = new Map<string, string>();

    (entryGroups ?? [])
      .filter((group) => !!group.listId)
      .forEach((group) => {
        [
          ...new Set((group.entryIds ?? []).filter((entryId) => !!entryId)),
        ].forEach((entryId) => {
          entryIdToListId.set(entryId, group.listId);
        });
      });

    const updateRequests: Observable<BulkResultUpdate>[] = [];

    (payload.existingToUpdate ?? [])
      .filter((item) => !!item.resultId && !!item.resultCode)
      .forEach((item) => {
        const anchor = createdById.get(item.resultId);
        if (!anchor?.entryId) {
          return;
        }

        currentCreatedResults
          .filter(
            (result) =>
              this.areLogicallyEquivalentResults(result, anchor) &&
              !!result.entryId &&
              !!entryIdToListId.get(result.entryId),
          )
          .forEach((result) => {
            if (!result.entryId || !result.id) {
              return;
            }

            const listId = entryIdToListId.get(result.entryId);
            if (!listId) {
              return;
            }

            updateRequests.push(
              this.entryResultsApi
                .updateApplicationListEntryResult({
                  listId,
                  entryId: result.entryId,
                  resultId: result.id,
                  resultUpdateDto: {
                    resultCode: item.resultCode.trim(),
                    wordingFields: item.wordingFields ?? [],
                  },
                })
                .pipe(
                  map(
                    (updatedResult): BulkResultUpdate => ({
                      result: updatedResult,
                      success: true,
                    }),
                  ),
                  catchError((error: unknown) =>
                    of({
                      error,
                      success: false,
                    } as BulkResultUpdate),
                  ),
                ),
            );
          });
      });

    return updateRequests;
  }

  private isResultGetDto(value: unknown): value is ResultGetDto {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'entryId' in value &&
      'resultCode' in value
    );
  }

  private toResultGetDtos(value: unknown): ResultGetDto[] {
    if (this.isBulkResultUpdate(value)) {
      return value.success ? [value.result] : [];
    }

    if (Array.isArray(value)) {
      return value.filter((item): item is ResultGetDto =>
        this.isResultGetDto(item),
      );
    }

    return this.isResultGetDto(value) ? [value] : [];
  }

  private isBulkResultUpdate(value: unknown): value is BulkResultUpdate {
    if (typeof value !== 'object' || value === null || !('success' in value)) {
      return false;
    }

    const update = value as Partial<BulkResultUpdate>;

    if (update.success === true) {
      return this.isResultGetDto(update.result);
    }

    return update.success === false && 'error' in value;
  }
}
