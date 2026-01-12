import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  ApplicationListEntryResultsApi,
  ResultCodeGetDetailDto,
  ResultCodesApi,
  ResultGetDto,
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
  private readonly resultCodeDetailCache = new Map<
    string,
    ResultCodeGetDetailDto
  >();

  readonly hasPending = computed(() => this.pendingRows().length > 0);

  reset(): void {
    this.entryResults.set([]);
    this.entryResultsLoading.set(false);
    this.pendingRows.set([]);
    this.clearPendingToken.set(0);
    this.resultCodeWordingByCode.set({});
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

  applyPendingResult(
    listId: string,
    entryId: string,
    row: PendingResultRow,
    onSuccess?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    const code = (row?.resultCode ?? '').trim();
    if (!listId || !entryId || !code) {
      return;
    }

    this.entryResultsApi
      .createApplicationListEntryResult({
        listId,
        entryId,
        resultCreateDto: { resultCode: code },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadEntryResults(listId, entryId);
          this.clearPendingToken.update((n) => n + 1);
          this.pendingRows.set([]);
          onSuccess?.();
        },
        error: (err) => onError?.(err),
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

  setPending(rows: PendingResultRow[]): void {
    this.pendingRows.set(rows ?? []);

    // only one pending allowed
    const code = rows?.[0]?.resultCode;
    if (code) {
      this.ensureResultWording(code);
    }
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
      this.resultCodeWordingByCode.update((m) => ({
        ...m,
        [c]: cached.wording ?? '-',
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
            [c]: detail.wording ?? '-',
          }));
        },
        error: () => {
          this.resultCodeWordingByCode.update((m) => ({ ...m, [c]: '-' }));
        },
      });
  }

  private normCode(code: string): string {
    return (code ?? '').trim().toUpperCase();
  }
}
