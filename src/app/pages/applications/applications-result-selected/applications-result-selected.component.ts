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
import { ResultGetDto } from '@openapi';
import { ApplicationsSearchStateService } from '@services/applications/applications-search-state.service';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';
import { ApplicationRow } from '@shared-types/applications/applications.type';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';
import {
  focusErrorSummary,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';

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
  private readonly applicationsSearchState = inject(
    ApplicationsSearchStateService,
  );
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly selectedResultCode = signal<string[]>([]);

  successBanner = signal<SuccessBanner | null>(null);

  errorSummaryItems = signal<ErrorItem[]>([]);
  errorFound = computed(() => this.errorSummaryItems().length > 0);

  showInfoBanner = signal(false);

  isSubmitting = signal(false);

  onCreateErrorClick = onCreateErrorClickFn;

  columns = ApplicationsColumns.filter(
    (column) =>
      !['actions', 'fee', 'status', 'resulted'].includes(column.field),
  );

  rows: ApplicationsResultContext[] = [];

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
    const resultIdsByListId = new Map<string, string[]>();

    createdResults
      .filter((result) => this.areLogicallyEquivalentResults(result, anchor))
      .forEach((result) => {
        const listId = result.entryId
          ? entryIdToListId.get(result.entryId)
          : '';
        if (!listId || !result.id) {
          return;
        }

        const ids = resultIdsByListId.get(listId) ?? [];
        ids.push(result.id);
        resultIdsByListId.set(listId, ids);
      });

    if (resultIdsByListId.size === 0) {
      return;
    }

    const groupedRemovals = Array.from(resultIdsByListId.entries());
    const allResults: {
      entryId: string;
      resultId: string;
      success: boolean;
      error?: unknown;
    }[] = [];
    let pendingGroups = groupedRemovals.length;
    let failed = false;

    groupedRemovals.forEach(([listId, resultIds]) => {
      this.resultsFacade.removeCreatedEntryResults(
        listId,
        resultIds,
        (results) => {
          if (failed) {
            return;
          }

          allResults.push(...results);
          pendingGroups -= 1;

          if (pendingGroups > 0) {
            return;
          }

          const failedRemovals = allResults.filter((result) => !result.success);

          if (failedRemovals.length > 0) {
            this.applyMappedError(failedRemovals[0].error);
            focusErrorSummary(this.platformId);
            return;
          }

          this.errorSummaryItems.set([]);
          this.applicationsSearchState.requestRefreshOnRestore();
          this.successBanner.set(ENTRY_SUCCESS_MESSAGES.resultsRemoved);
          focusSuccessBanner(this.platformId);
        },
        (err) => {
          if (failed) {
            return;
          }

          failed = true;
          this.applyMappedError(err);
          focusErrorSummary(this.platformId);
        },
      );
    });
  }

  onError(errors: ErrorItem[]): void {
    this.errorSummaryItems.set(errors);
    focusErrorSummary(this.platformId);
  }

  onSubmitResults(payload: ResultSectionSubmitPayload): void {
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
        this.applicationsSearchState.requestRefreshOnRestore();
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
        focusErrorSummary(this.platformId);
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
