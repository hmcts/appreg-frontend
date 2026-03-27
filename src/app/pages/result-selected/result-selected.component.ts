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
import {
  ApplicationListEntryResultsFacade,
  BulkResultChange,
} from '@services/applications-list-entry/application-list-entry-results.facade';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';
import {
  focusErrorSummary,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
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
  private route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  readonly resultsFacade = inject(ApplicationListEntryResultsFacade);

  listId!: string;
  private readonly selectedResultCode = signal<string>('');

  isSubmitting = signal(false);
  batchResults!: BulkResultChange[];

  successBanner = signal<SuccessBanner | null>(null);

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

  idToSequenceNumberMap!: Record<string, string | undefined>;

  columns = APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS;

  rows!: ApplicationEntriesResultContext[];

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

    this.resultsFacade.removeCreatedEntryResultGroup(
      this.listId,
      resultId,
      (results) => {
        const failedRemovals = results.filter((result) => !result.success);

        if (failedRemovals.length > 0) {
          this.applyMappedError(failedRemovals[0].error);
          focusErrorSummary(this.platformId);
          return;
        }

        this.successBanner.set(ENTRY_SUCCESS_MESSAGES.resultsRemoved);
        focusSuccessBanner(this.platformId);
      },
      (err) => {
        this.applyMappedError(err);
        focusErrorSummary(this.platformId);
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
    focusErrorSummary(this.platformId);
  }

  onSubmitResults(payload: ResultSectionSubmitPayload): void {
    const item = payload.pendingToCreate?.[0] ?? payload.existingToUpdate?.[0];

    if (item) {
      this.selectedResultCode.set(item.resultCode);
    }

    this.idToSequenceNumberMap = Object.fromEntries(
      this.rows.map((row) => [row.id, row.sequenceNumber]),
    );

    if (!this.listId || !this.rows?.length) {
      return;
    }
    this.isSubmitting.set(true);
    this.batchResults = [];
    this.resultsFacade.submitResultChangesForEntries(
      this.listId,
      this.rows.map((row) => row.id),
      payload,
      (results) => {
        this.isSubmitting.set(false);
        this.batchResults = results;

        const errorItems: ErrorItem[] = results
          .filter((r) => !r.success)
          .map((r) => {
            return {
              text: `Sequence number ${this.idToSequenceNumberMap[r.entryId]} failed to update`,
            } as ErrorItem;
          });

        this.errorSummaryItems.set(errorItems);
        if (errorItems.length > 0) {
          focusErrorSummary(this.platformId);
        }

        this.successBanner.set(
          errorItems.length === 0
            ? {
                heading: 'Result codes applied successfully',
                body: `Result code '${this.selectedResultCode()}' applied successfully to application list entries`,
              }
            : null,
        );

        focusSuccessBanner(this.platformId);
      },
      (err) => {
        this.isSubmitting.set(false);
        this.applyMappedError(err);
        focusErrorSummary(this.platformId);
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
