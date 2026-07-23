import {
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { focusSuccessBanner } from '@components/applications-list-entry-detail/util/banners.util';
import { APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { mapHttpErrorToSummary } from '@components/applications-list-entry-detail/util/errors.util';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { ResultWordingSectionComponent } from '@components/result-wording-section/result-wording-section.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import { SuccessBanner } from '@core-types/banner/banner.types';
import { ResultGetDto } from '@openapi';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { sortRows } from '@util/table-sort';
@Component({
  selector: 'app-result-selected',
  standalone: true,
  providers: [ApplicationListEntryResultsFacade],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    ResultWordingSectionComponent,
    SuccessBannerComponent,
    ErrorSummaryComponent,
  ],
  templateUrl: './result-selected.component.html',
})
export class ResultSelected implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  readonly resultsFacade = inject(ApplicationListEntryResultsFacade);

  listId!: string;
  private readonly selectedResultCode = signal<string[]>([]);

  isSubmitting = signal(false);

  successBanner = signal<SuccessBanner | null>(null);
  readonly submitAttempt = signal(0);

  errorHint: string | null = 'There is a problem';
  errorFound = computed(() => this.errorSummaryItems().length > 0);
  errorSummaryItems = signal<ErrorItem[]>([]);

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

  onCreateErrorClick = onCreateErrorClickFn;

  columns = APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS;

  private readonly rowsState = signal<ApplicationEntriesResultContext[]>([]);
  get rows(): ApplicationEntriesResultContext[] {
    return this.rowsState();
  }
  set rows(rows: ApplicationEntriesResultContext[]) {
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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.listId = id;
    }
    this.rows =
      (
        history.state as {
          resultingApplications?: ApplicationEntriesResultContext[];
        }
      )?.resultingApplications ?? [];
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.resultSort.set(sort);
    this.currentPage.set(0);
  }

  onPendingChange(rows: PendingResultRow[]): void {
    this.resultsFacade.setPending(rows);

    if (!rows || rows.length === 0) {
      this.errorSummaryItems.set([]);
    }
  }

  onRemoveResult(resultId: string): void {
    if (!resultId || !this.listId) {
      return;
    }
    this.submitAttempt.update((attempt) => attempt + 1);

    this.resultsFacade.removeCreatedEntryResultGroup(
      this.listId,
      resultId,
      (results) => {
        const failedRemovals = results.filter((result) => !result.success);

        if (failedRemovals.length > 0) {
          this.applyMappedError(failedRemovals[0].error);
          return;
        }

        this.successBanner.set(ENTRY_SUCCESS_MESSAGES.resultsRemoved);
        focusSuccessBanner(this.platformId);
      },
      (err) => {
        this.applyMappedError(err);
      },
    );
  }

  private applyMappedError(err: unknown): void {
    const mapped = mapHttpErrorToSummary(err);
    this.errorHint = mapped.errorHint;

    this.errorSummaryItems.set(mapped.errorSummary);
  }

  onError(errors: ErrorItem[]): void {
    this.errorSummaryItems.set(errors);
    this.submitAttempt.update((attempt) => attempt + 1);
  }

  onSubmitResults(payload: ResultSectionSubmitPayload): void {
    this.submitAttempt.update((attempt) => attempt + 1);

    if (this.isSubmitting()) {
      return;
    }

    const item = [...payload.pendingToCreate, ...payload.existingToUpdate];

    if (item) {
      this.selectedResultCode.set(item.map((element) => element.resultCode));
    }

    if (!this.listId || !this.rows?.length) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorSummaryItems.set([]);
    this.successBanner.set(null);

    this.resultsFacade.submitResultChangesForEntries(
      this.listId,
      this.rows.map((row) => row.id),
      payload,
      () => {
        this.isSubmitting.set(false);
        this.errorSummaryItems.set([]);

        this.successBanner.set({
          heading: 'Result codes applied successfully',
          body: `Result code(s) '${this.selectedResultCode().join(', ')}' applied successfully to application list entries`,
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

  private toLogicalResultKey(result: ResultGetDto): string {
    return [
      (result.resultCode ?? '').trim(),
      this.getWordingTemplate(result),
    ].join('|');
  }

  private getWordingTemplate(result: ResultGetDto): string {
    return (result.wording?.template ?? '').trim();
  }
}
