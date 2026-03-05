import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import type { ResultSectionSubmitPayload } from '@components/result-wording-section/result-wording-section.component';
import {
  ApplicationListEntryResultsApi,
  ResultCodeGetDetailDto,
  ResultCodesApi,
  ResultGetDto,
  TemplateDetail,
} from '@openapi';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { getAllResultCodes, getEntryResults$ } from '@util/result-code-helpers';

@Injectable()
export class ApplicationListEntryResultsFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly entryResultsApi = inject(ApplicationListEntryResultsApi);
  private readonly resultCodesApi = inject(ResultCodesApi);

  readonly resultCodesSignal = getAllResultCodes(this.resultCodesApi);

  readonly entryResults = signal<ResultGetDto[]>([]);
  readonly entryResultsLoading = signal(false);

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

  private toTemplateDetail(wording: string | null | undefined): TemplateDetail {
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
    return template.replace(/\\\{\\\{/g, '{{').replace(/\\\}\\\}/g, '}}');
  }
}
