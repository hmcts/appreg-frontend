import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApplicationsColumns } from '../applications.component';

import { AlertComponent } from '@components/alert/alert.component';
import { focusSuccessBanner } from '@components/applications-list-entry-detail/util/banners.util';
import { mapHttpErrorToSummary } from '@components/applications-list-entry-detail/util/errors.util';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { ResultWordingSectionComponent } from '@components/result-wording-section/result-wording-section.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import { SuccessBanner } from '@core-types/banner/banner.types';
import { BulkDeleteResultItemDto, ResultGetDto } from '@openapi';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';
import { ApplicationRow } from '@shared-types/applications/applications.type';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { sortRows } from '@util/table-sort';

type ApplicationsResultContext = Pick<
  ApplicationRow,
  'id' | 'date' | 'applicant' | 'respondent' | 'title'
> & {
  listId: string;
};

@Component({
  selector: 'app-applications-result-selected',
  providers: [ApplicationListEntryResultsFacade],
  standalone: true,
  imports: [
    BreadcrumbsComponent,
    ErrorSummaryComponent,
    SuccessBannerComponent,
    ResultWordingSectionComponent,
    AlertComponent,
  ],
  templateUrl: './applications-result-selected.component.html',
  styleUrl: './applications-result-selected.component.scss',
})
export class ApplicationsResultSelectedComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  readonly resultsFacade = inject(ApplicationListEntryResultsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly selectedResultCode = signal<string[]>([]);

  successBanner = signal<SuccessBanner | null>(null);
  readonly submitAttempt = signal(0);

  errorSummaryItems = signal<ErrorItem[]>([]);
  errorFound = computed(() => this.errorSummaryItems().length > 0);

  showInfoBanner = signal(false);

  isSubmitting = signal(false);

  onCreateErrorClick = onCreateErrorClickFn;

  columns = ApplicationsColumns.filter(
    (column) =>
      !['actions', 'fee', 'status', 'resulted'].includes(column.field),
  );

  private readonly rowsState = signal<ApplicationsResultContext[]>([]);
  get rows(): ApplicationsResultContext[] {
    return this.rowsState();
  }
  set rows(rows: ApplicationsResultContext[]) {
    this.rowsState.set(rows);
  }
  readonly pageSize = 10;
  readonly currentPage = signal(0);
  readonly resultSort = signal<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc',
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.rowsState().length / this.pageSize),
  );

  readonly sortedRows = computed(() => {
    const { key, direction } = this.resultSort();
    const rows = this.rowsState();
    return key ? sortRows(rows, { key, direction }) : rows;
  });

  readonly paginatedRows = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.sortedRows().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.rows = isPlatformBrowser(this.platformId)
      ? ((
          history.state as {
            entriesToResult?: ApplicationsResultContext[];
          }
        )?.entriesToResult ?? [])
      : [];

    const hasExcludedRows = isPlatformBrowser(this.platformId)
      ? ((
          history.state as {
            ignoredSelected?: boolean;
          }
        ).ignoredSelected ?? false)
      : false;

    if (!this.rows.length) {
      void this.router.navigate(['../'], { relativeTo: this.route });
    }

    this.showInfoBanner.set(hasExcludedRows);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.resultSort.set(sort);
    this.currentPage.set(0);
  }

  readonly createdEntryResults = computed(() => {
    const createdResults = this.resultsFacade.newlyCreatedEntryResults() ?? [];
    const representatives = new Map<string, ResultGetDto>();

    createdResults.forEach((result) => {
      const key = this.toLogicalResultKey(result);
      if (!representatives.has(key)) {
        representatives.set(key, result);
      }
    });

    return Array.from(representatives.values());
  });

  onPendingChange(rows: PendingResultRow[]): void {
    this.resultsFacade.setPending(rows);

    if (!rows || rows.length === 0) {
      this.errorSummaryItems.set([]);
    }
  }

  onRemoveResult(resultId: string): void {
    if (!resultId) {
      return;
    }

    this.submitAttempt.update((attempt) => attempt + 1);

    const createdResults = this.resultsFacade.newlyCreatedEntryResults() ?? [];
    const anchor = createdResults.find((result) => result.id === resultId);

    if (!anchor) {
      return;
    }

    const entryIdToListId = new Map(
      this.rows
        .filter((row) => !!row.id && !!row.listId)
        .map((row) => [row.id, row.listId]),
    );
    const resultsToRemove = createdResults
      .filter((result) => this.areLogicallyEquivalentResults(result, anchor))
      .map((result) => {
        if (!result.entryId || !result.id) {
          return null;
        }

        const listId = entryIdToListId.get(result.entryId);
        if (!listId) {
          return null;
        }

        return {
          listId,
          entryId: result.entryId,
          resultId: result.id,
        };
      })
      .filter((result): result is BulkDeleteResultItemDto => result !== null);

    if (resultsToRemove.length === 0) {
      return;
    }

    this.resultsFacade.bulkRemoveCreatedEntryResults(
      resultsToRemove,
      () => {
        this.errorSummaryItems.set([]);
        this.successBanner.set(ENTRY_SUCCESS_MESSAGES.resultsRemoved);
        focusSuccessBanner(this.platformId);
      },
      (err) => this.applyMappedError(err),
    );
  }

  onError(errors: ErrorItem[]): void {
    this.submitAttempt.update((attempt) => attempt + 1);
    this.errorSummaryItems.set(errors);
  }

  onSubmitResults(payload: ResultSectionSubmitPayload): void {
    this.submitAttempt.update((attempt) => attempt + 1);

    if (this.isSubmitting() || !this.rows.length) {
      return;
    }

    const items = [...payload.pendingToCreate, ...payload.existingToUpdate];
    this.selectedResultCode.set(items.map((item) => item.resultCode));

    this.isSubmitting.set(true);
    this.errorSummaryItems.set([]);
    this.successBanner.set(null);

    this.resultsFacade.submitResultsWithManyListIds(
      this.toEntryGroupsByListId(),
      payload,
      () => {
        this.isSubmitting.set(false);
        this.errorSummaryItems.set([]);
        this.successBanner.set({
          heading: 'Result codes applied successfully',
          body: `Result code(s) '${this.selectedResultCode().join(', ')}' applied successfully to application(s)`,
        });
        focusSuccessBanner(this.platformId);
      },
      (err) => {
        this.isSubmitting.set(false);
        this.successBanner.set(null);
        this.applyMappedError(err);
      },
    );
  }

  private applyMappedError(err: unknown): void {
    const mapped = mapHttpErrorToSummary(err);
    this.errorSummaryItems.set(mapped.errorSummary);
  }

  private toEntryGroupsByListId(): { listId: string; entryIds: string[] }[] {
    const entryIdsByListId = new Map<string, Set<string>>();

    this.rows.forEach((row) => {
      if (!row.listId || !row.id) {
        return;
      }

      const entryIds = entryIdsByListId.get(row.listId) ?? new Set<string>();
      entryIds.add(row.id);
      entryIdsByListId.set(row.listId, entryIds);
    });

    return Array.from(entryIdsByListId.entries()).map(([listId, entryIds]) => ({
      listId,
      entryIds: Array.from(entryIds),
    }));
  }

  private toLogicalResultKey(result: ResultGetDto): string {
    return [
      (result.resultCode ?? '').trim(),
      (result.wording?.template ?? '').trim(),
    ].join('|');
  }

  private areLogicallyEquivalentResults(
    left: ResultGetDto,
    right: ResultGetDto,
  ): boolean {
    return this.toLogicalResultKey(left) === this.toLogicalResultKey(right);
  }
}
