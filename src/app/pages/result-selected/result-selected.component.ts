import { HttpErrorResponse } from '@angular/common/http';
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
import { Observable, catchError, finalize, forkJoin, map, of } from 'rxjs';

import { focusSuccessBanner } from '@components/applications-list-entry-detail/util/banners.util';
import { APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { mapHttpErrorToSummary } from '@components/applications-list-entry-detail/util/errors.util';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { getEntryId } from '@components/applications-list-entry-detail/util/routing.util';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { ResultWordingSectionComponent } from '@components/result-wording-section/result-wording-section.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { WarningBannerComponent } from '@components/warning-banner/warning-banner.component';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import { SuccessBanner } from '@core-types/banner/banner.types';
import {
  ApplicationListEntryResultsApi,
  CreateApplicationListEntryResultRequestParams,
  ResultGetDto,
} from '@openapi';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';

export type BatchResult =
  | {
      id: string;
      sequenceNumber?: number;
      success: boolean;
      response: ResultGetDto;
    }
  | {
      id: string;
      sequenceNumber?: number;
      success: boolean;
      error: HttpErrorResponse;
    };
@Component({
  selector: 'app-result-selected',
  standalone: true,
  providers: [ApplicationListEntryResultsFacade],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    WarningBannerComponent,
    ResultWordingSectionComponent,
    SuccessBannerComponent,
    ErrorSummaryComponent,
  ],
  templateUrl: './result-selected.component.html',
})
export class ResultSelected implements OnInit {
  private route = inject(ActivatedRoute);
  private readonly resultCodesApi = inject(ApplicationListEntryResultsApi);
  private readonly platformId = inject(PLATFORM_ID);
  readonly resultsFacade = inject(ApplicationListEntryResultsFacade);

  listId!: string;
  mixedResultedAndUnresultedApplications!: boolean;
  private selectedResultCode = signal<string>('');

  isSubmitting = signal(false);
  batchResults!: BatchResult[];

  successBanner = signal<SuccessBanner | null>(null);

  errorHint: string | null = 'There is a problem';
  errorFound = computed(() => this.errorSummaryItems().length > 0);
  errorSummaryItems = signal<ErrorItem[]>([]);

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
    this.mixedResultedAndUnresultedApplications =
      (history.state as { mixedResultedAndUnresultedApplications?: boolean })
        ?.mixedResultedAndUnresultedApplications ?? false;
  }

  onPendingChange(rows: PendingResultRow[]): void {
    this.resultsFacade.setPending(rows);
  }

  onRemoveResult(resultId: string): void {
    const entryId = getEntryId(this.route);

    if (!entryId || !resultId || !this.listId) {
      return;
    }

    this.resultsFacade.removeResult(
      this.listId,
      entryId,
      resultId,
      () => {
        this.successBanner.set(ENTRY_SUCCESS_MESSAGES.resultRemoved);
        focusSuccessBanner(this.platformId);
      },
      (err) => this.applyMappedError(err),
    );
  }

  private applyMappedError(err: unknown): void {
    const mapped = mapHttpErrorToSummary(err);
    this.errorHint = mapped.errorHint;

    this.errorSummaryItems.set(mapped.errorSummary);
  }

  onError(errors: ErrorItem[]): void {
    this.errorSummaryItems.set(errors);
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

    const existingResultsByEntryId: Record<string, ResultGetDto> =
      Object.fromEntries(
        (this.resultsFacade.newlyCreatedEntryResults() ?? []).map((r) => [
          r.entryId,
          r,
        ]),
      );

    const calls: Observable<BatchResult>[] = this.rows.map((row) => {
      const params = this.buildResultRequestForRow(row, payload);

      const existing = existingResultsByEntryId[params.entryId];

      if (existing?.id) {
        // Build update DTO from params.resultCreateDto
        const updateDto = {
          resultCode: params.resultCreateDto.resultCode,
          wordingFields: params.resultCreateDto.wordingFields ?? [],
        };

        return this.resultCodesApi
          .updateApplicationListEntryResult({
            listId: params.listId,
            entryId: params.entryId,
            resultId: existing.id,
            resultUpdateDto: updateDto,
          })
          .pipe(
            map((response: ResultGetDto) => ({
              id: row.id,
              success: true,
              response,
            })),
            catchError((error: HttpErrorResponse) =>
              of({ id: row.id, success: false, error }),
            ),
          );
      } else {
        // Create (POST) using params
        return this.resultCodesApi
          .createApplicationListEntryResult(params)
          .pipe(
            map((response: ResultGetDto) => ({
              id: row.id,
              success: true,
              response,
            })),
            catchError((error: HttpErrorResponse) =>
              of({ id: row.id, success: false, error }),
            ),
          );
      }
    });

    forkJoin([...calls])
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe((results: BatchResult[]) => {
        this.batchResults = results;

        const errorItems: ErrorItem[] = this.batchResults
          .filter((r) => !r.success)
          .map((r) => {
            return {
              text: `Sequence number ${this.idToSequenceNumberMap[r.id]} failed to update`,
            } as ErrorItem;
          });

        this.errorSummaryItems.set(errorItems);

        this.successBanner.set(
          errorItems.length === 0
            ? {
                heading: 'Result codes applied successfully',
                body: `Result code '${this.selectedResultCode()}' applied successfully to application list entries`,
              }
            : null,
        );

        const successfulResponses: ResultGetDto[] = results
          .filter((r) => r.success)
          .map(
            (r) => (r as { success: true; response: ResultGetDto }).response,
          );

        this.resultsFacade.addCreatedEntryResults(successfulResponses);

        if (errorItems.length === 0 && successfulResponses.length > 0) {
          this.resultsFacade.clearPendingToken.update((n) => n + 1);
        }
      });
  }

  // create params for both POST and PUT
  private buildResultRequestForRow(
    row: ApplicationEntriesResultContext,
    payload: ResultSectionSubmitPayload,
  ): CreateApplicationListEntryResultRequestParams {
    const newResultCode =
      payload.pendingToCreate?.[0] ?? payload.existingToUpdate?.[0];

    const resultCreateDto = {
      resultCode: newResultCode.resultCode,
      wordingFields: newResultCode.wordingFields,
    };

    return {
      listId: this.listId,
      entryId: row.id,
      resultCreateDto,
    };
  }
}
