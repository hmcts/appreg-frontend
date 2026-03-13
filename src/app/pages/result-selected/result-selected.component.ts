import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, map, of } from 'rxjs';

import { APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { ResultWordingSectionComponent } from '@components/result-wording-section/result-wording-section.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { WarningBannerComponent } from '@components/warning-banner/warning-banner.component';
import {
  ApplicationListEntryResultsApi,
  CreateApplicationListEntryResultRequestParams,
  ResultGetDto,
} from '@openapi';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';

type BatchResult =
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
  readonly resultsFacade = inject(ApplicationListEntryResultsFacade);
  listId!: string;
  mixedResultedAndUnresultedApplications!: boolean;
  private readonly resultCodesApi = inject(ApplicationListEntryResultsApi);

  isSubmitting = signal(false);
  batchResults!: BatchResult[];
  resultCodeApplySuccess = signal(false);
  errorSummaryItems = signal<ErrorItem[]>([]);
  idToSequenceNumberMap!: Record<string, string | undefined>;

  requestParams!: CreateApplicationListEntryResultRequestParams;

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

  onSubmitResults(payload: ResultSectionSubmitPayload): void {
    this.idToSequenceNumberMap = Object.fromEntries(
      this.rows.map((row) => [row.id, row.sequenceNumber]),
    );

    if (!this.listId || !this.rows?.length) {
      return;
    }

    this.isSubmitting.set(true);
    this.batchResults = [];

    const calls$: Observable<BatchResult>[] = this.rows.map((row) => {
      return this.resultCodesApi
        .createApplicationListEntryResult(this.paramsForRow(row, payload))
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
    });

    forkJoin([...calls$])
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
        this.resultCodeApplySuccess.set(errorItems.length === 0);
      });
  }

  private paramsForRow(
    row: ApplicationEntriesResultContext,
    globalPayload: ResultSectionSubmitPayload,
  ): CreateApplicationListEntryResultRequestParams {
    const newResultCode = globalPayload.pendingToCreate[0];

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
