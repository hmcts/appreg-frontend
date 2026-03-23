import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import {
  ApplicationListEntryResultsApi,
  ResultCodeGetDetailDto,
  ResultCodesApi,
  ResultGetDto,
  TemplateDetail,
} from '@openapi';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import type { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';
import { getAllResultCodes, getEntryResults$ } from '@util/result-code-helpers';

export type BulkResultChange =
  | {
      action: 'create' | 'update';
      entryId: string;
      resultId?: string;
      success: true;
      response: ResultGetDto;
    }
  | {
      action: 'create' | 'update';
      entryId: string;
      resultId?: string;
      success: false;
      error: unknown;
    };

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
    onSuccess?: (results: BulkResultChange[]) => void,
    onError?: (err: unknown) => void,
  ): void {
    if (!listId || !payload) {
      return;
    }

    const currentCreatedResults = this.newlyCreatedEntryResults() ?? [];
    const createdById = new Map(
      currentCreatedResults
        .filter((result) => !!result.id)
        .map((result) => [result.id, result]),
    );

    const updateRequests: Observable<BulkResultChange>[] = [];
    (payload.existingToUpdate ?? [])
      .filter((item) => !!item.resultId && !!item.resultCode)
      .forEach((item) => {
        const anchor = createdById.get(item.resultId);
        if (!anchor?.entryId) {
          return;
        }

        currentCreatedResults
          .filter((result) =>
            this.areLogicallyEquivalentResults(result, anchor),
          )
          .forEach((result) => {
            if (!result.entryId || !result.id) {
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
                    (response): BulkResultChange => ({
                      action: 'update',
                      entryId: result.entryId,
                      resultId: result.id,
                      success: true,
                      response,
                    }),
                  ),
                  catchError((error: unknown) =>
                    of<BulkResultChange>({
                      action: 'update',
                      entryId: result.entryId,
                      resultId: result.id,
                      success: false,
                      error,
                    }),
                  ),
                ),
            );
          });
      });

    const createRequests: Observable<BulkResultChange>[] = [];
    (payload.pendingToCreate ?? [])
      .filter((item) => !!item.resultCode)
      .forEach((item) => {
        (entryIds ?? [])
          .filter((entryId) => !!entryId)
          .forEach((entryId) => {
            createRequests.push(
              this.entryResultsApi
                .createApplicationListEntryResult({
                  listId,
                  entryId,
                  resultCreateDto: {
                    resultCode: item.resultCode.trim(),
                    wordingFields: item.wordingFields ?? [],
                  },
                })
                .pipe(
                  map(
                    (response): BulkResultChange => ({
                      action: 'create',
                      entryId,
                      success: true,
                      response,
                    }),
                  ),
                  catchError((error: unknown) =>
                    of<BulkResultChange>({
                      action: 'create',
                      entryId,
                      success: false,
                      error,
                    }),
                  ),
                ),
            );
          });
      });

    const allRequests = [...updateRequests, ...createRequests];
    if (allRequests.length === 0) {
      return;
    }

    forkJoin(allRequests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const successfulResponses = results
            .filter((result) => result.success)
            .map((result) => result.response);

          this.mergeCreatedEntryResults(successfulResponses);

          const hasCreateFailures = results.some(
            (result) => result.action === 'create' && !result.success,
          );
          const hasCreateRequests = createRequests.length > 0;

          if (hasCreateRequests && !hasCreateFailures) {
            this.clearPendingToken.update((n) => n + 1);
            this.pendingRows.set([]);
          }

          onSuccess?.(results);
        },
        error: (err) => onError?.(err),
      });
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

    const requests = targets.map((result) =>
      this.entryResultsApi
        .deleteApplicationListEntryResult({
          listId,
          entryId: result.entryId,
          resultId: result.id,
        })
        .pipe(
          map(
            (): BulkResultRemoval => ({
              entryId: result.entryId,
              resultId: result.id,
              success: true,
            }),
          ),
          catchError((error: unknown) =>
            of({
              entryId: result.entryId,
              resultId: result.id,
              success: false,
              error,
            }),
          ),
        ),
    );

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const deletedIds = new Set(
            results
              .filter((result) => result.success)
              .map((result) => result.resultId),
          );

          this.newlyCreatedEntryResults.update((current) =>
            current.filter((result) => !deletedIds.has(result.id ?? '')),
          );

          onSuccess?.(results);
        },
        error: (err) => onError?.(err),
      });
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

    this.entryResultsApi
      .deleteApplicationListEntryResult({ listId, entryId, resultId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadEntryResults(listId, entryId);
          onSuccess?.();
        },
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

    // only one pending allowed
    const code = rows?.[0]?.resultCode;
    if (code) {
      this.ensureResultWording(code);
    }
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
    return template.replaceAll(/\\\{\\\{/g, '{{').replaceAll(/\\\}\\\}/g, '}}');
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
}
