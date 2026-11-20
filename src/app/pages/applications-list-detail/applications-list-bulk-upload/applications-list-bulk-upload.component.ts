import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EnvironmentInjector,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, firstValueFrom, take } from 'rxjs';

import { CorrectRecordComponent } from './correct-record/correct-record.component';
import {
  ApplicationsListBulkUploadState,
  BulkUploadFeedback,
  InitialBulkUploadState,
} from './util/applications-list-bulk-upload.state';
import { BulkUploadCorrections } from './util/bulk-upload-corrections';
import {
  MAX_UPLOAD_BYTES,
  decodeUploadCsv,
  parseUploadCsv,
} from './util/bulk-upload-csv';

import { AsyncJobProgressComponent } from '@components/async-job-progress/async-job-progress.component';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { ErrorSummaryComponent } from '@components/error-summary/error-summary.component';
import { HelpDetailsComponent } from '@components/help-details/help-details.component';
import { NavigationWarningComponent } from '@components/navigation-warning/navigation-warning.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListEntriesApi,
  BulkUploadApplicationListEntriesRequestParams,
  JobAcknowledgement,
  ReportsApi,
} from '@openapi';
import {
  JobPollingFacade,
  PolledJobStatus,
} from '@services/jobs/job-polling.facade';
import { getHttpStatus, getProblemText } from '@util/http-error-to-text';
import { saveCsv as saveCsvFile } from '@util/save-csv';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { getDateStamp, trimToUndefined } from '@util/string-helpers';
import { sortRows } from '@util/table-sort';

const UPLOAD_IN_PROGRESS_FEEDBACK = {
  kind: 'progress',
  heading: 'Upload in progress',
  body: 'Your bulk upload is being processed. This page will update automatically when it finishes.',
} as const;

const BulkUploadErrorTableColumns: TableColumn[] = [
  { header: 'Error type', field: 'errorType', wrap: false },
  { header: 'Row', field: 'rowNumber' },
  { header: 'Affected column', field: 'location' },
  { header: 'Message', field: 'message', minWidth: '10rem', maxWidth: '28rem' },
  { header: 'Applicant', field: 'name' },
  {
    header: 'Address line 1',
    field: 'addressLine1',
    minWidth: '10rem',
    maxWidth: '28rem',
  },
  {
    header: 'Rejected value',
    field: 'rejectedValue',
    minWidth: '10rem',
    maxWidth: '28rem',
  },
];

interface ErrorDescription {
  rowNumber: number | null;
  location: string | null;
  rejectedValue: string | null;
  message: string | null;
  addressLine1: string | null;
  code: string | null;
  errorType: 'HEADER_ERROR' | 'DATA_ERROR';
}

const AffectedColumn: Record<string, string> = {
  standardApplicantCode: 'Standard applicant code',
  applicationCode: 'Application code',
  name: 'Name',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  addressLine3: 'Address line 3',
  addressLine4: 'Address line 4',
  addressLine5: 'Address line 5',
  postcode: 'Postcode',
  email: 'Respondent email',
  phone: 'Respondent phone',
  mobile: 'Respondent mobile',
  ACCOUNT_NUMBER: 'Account number',
  APPLICATION_TEXT: 'Application text',
  'RESP_NAME_ORG/RESP_FORENAME1/RESP_SURNAME/RESP_FIRST_NAME/RESP_LAST_NAME':
    'Respondent names',
  firstName: 'Respondent first name',
  lastName: 'Respondent last name',
  title: 'Respondent title',
  RESPONDENT: 'Respondent details',
};

/**
Applications List – Bulk Upload (/applications-list/:id/bulk-upload)

Functionality:
  - Validates selected CSV file by extension and MIME type
  - Submits bulk upload request for the selected list
  - Updates UI state for upload progress and result
*/
@Component({
  selector: 'app-applications-list-bulk-upload',
  imports: [
    FormsModule,
    CorrectRecordComponent,
    BreadcrumbsComponent,
    PageHeaderComponent,
    ErrorSummaryComponent,
    HelpDetailsComponent,
    AsyncJobProgressComponent,
    NotificationBannerComponent,
    NavigationWarningComponent,
    SortableTableComponent,
    PaginationComponent,
  ],
  providers: [BulkUploadCorrections],
  templateUrl: './applications-list-bulk-upload.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './applications-list-bulk-upload.component.scss',
})
export class ApplicationsListBulkUpload implements OnInit {
  private readonly actionsApi = inject(ApplicationListEntriesApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly jobPollingFacade = inject(JobPollingFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobApi = inject(ReportsApi);
  private readonly componentDestroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly navigationWarning = viewChild(NavigationWarningComponent);

  // Initialise signal state
  private readonly bulkUploadSignalState =
    createSignalState<ApplicationsListBulkUploadState>(InitialBulkUploadState);
  private readonly bulkUploadState = this.bulkUploadSignalState.state;
  private readonly bulkUploadPatch = this.bulkUploadSignalState.patch;
  readonly vm = this.bulkUploadSignalState.vm;

  private readonly envInjector = inject(EnvironmentInjector);
  private readonly bulkUploadRequest =
    signal<BulkUploadApplicationListEntriesRequestParams | null>(null);
  readonly submitAttempt = signal(0);
  readonly pendingJobId = signal<string | null>(null);
  readonly replacementFileSelected = signal(false);
  isJobPolling = false;

  readonly corrections = inject(BulkUploadCorrections);
  readonly editingRow = signal<number | null>(null);
  readonly editorDirty = signal(false);
  readonly returningFromEditor = signal(false);
  readonly isReadingFile = signal(false);
  readonly correctionPage = signal(0);
  readonly correctionNotice = signal('');
  readonly correctionRows = computed(() =>
    this.corrections
      .records()
      .slice(
        this.correctionPage() * this.pageSize,
        (this.correctionPage() + 1) * this.pageSize,
      ),
  );
  readonly correctionPages = computed(() =>
    Math.ceil(this.corrections.records().length / this.pageSize),
  );
  private fileSelectionVersion = 0;

  columns = BulkUploadErrorTableColumns;

  jobId: string = '';
  readonly errorRows = signal<Row[]>([]);
  readonly pageSize = 10;
  readonly errorSort = signal<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc',
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.errorRows().length / this.pageSize),
  );

  // Sort all returned rows before paginating them.
  readonly sortedErrorRows = computed(() => {
    const { key, direction: sortDirection } = this.errorSort();
    return key
      ? sortRows(this.errorRows(), { key, direction: sortDirection })
      : this.errorRows();
  });

  readonly paginatedErrorRows = computed(() => {
    const start = this.vm().currentPage * this.pageSize;
    return this.sortedErrorRows().slice(start, start + this.pageSize);
  });

  disableExportErrButton = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bulkUploadSignalState.patch({ listId: id });
    }

    this.setupEffects();

    const jobId = this.route.snapshot.queryParamMap.get('bulkUploadJobId');
    if (jobId) {
      this.startBulkUploadPolling(jobId);
    }
  }

  private setupEffects(): void {
    setupLoadEffect(
      {
        request: this.bulkUploadRequest,
        load: (params) =>
          this.actionsApi.bulkUploadApplicationListEntries(
            params,
            'response',
            false,
            { transferCache: false },
          ),
        onSuccess: (res: HttpResponse<JobAcknowledgement>) => {
          this.handleUploadResponse(res);
          this.bulkUploadRequest.set(null);
        },
        onError: (err) => {
          this.handleUploadError(err);
          this.bulkUploadRequest.set(null);
        },
      },
      this.envInjector,
    );
  }

  /**
   * Watches a submitted upload job, avoiding duplicate subscriptions.
   * Authorization and status failures update feedback and end the active
   * polling state so the user can retry checking the job.
   *
   * @param jobId - Upload job whose status is requested.
   */
  private startBulkUploadPolling(jobId: string): void {
    if (this.isJobPolling) {
      return;
    }
    this.isJobPolling = true;
    this.pendingJobId.set(jobId);
    this.bulkUploadPatch({
      bulkUploadFeedback: UPLOAD_IN_PROGRESS_FEEDBACK,
    });

    this.jobPollingFacade
      .watchJob(jobId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => this.handleBulkUploadStatus(job),
        error: (err) => {
          this.isJobPolling = false;
          const status = getHttpStatus(err);
          this.bulkUploadPatch({
            bulkUploadFeedback: {
              kind: 'error',
              title: 'Error',
              heading: 'Unable to load upload status',
              body:
                status === 401
                  ? 'You need to sign in to check the bulk upload status.'
                  : status === 403
                    ? 'You do not have permission to check the bulk upload status.'
                    : 'Please try again later.',
            },
            isUploadInProgress: false,
          });
          this.submitAttempt.update((attempt) => attempt + 1);
        },
      });
  }

  private handleBulkUploadStatus(job: PolledJobStatus): void {
    if (!job.isTerminal) {
      return;
    }

    if (!trimToUndefined(job.id)) {
      return;
    }

    this.jobId = job.id;
    this.isJobPolling = false;
    if (job.state !== 'unknown') {
      this.pendingJobId.set(null);
    }
    // Clear progress before successful navigation so this page does not block itself.
    this.bulkUploadPatch({ isUploadInProgress: false });
    this.bulkUploadPatch({
      bulkUploadFeedback: this.toBulkUploadFeedback(job),
      uploadSuccessful: job.state === 'succeeded',
    });
  }

  /**
   * Converts a terminal upload status into user feedback.
   * Success navigates back with the job summary instead of returning feedback;
   * failed and unknown states return an error message for this page.
   *
   * @param job - Normalized upload status.
   * @returns Feedback for non-success states, or `void` after navigation.
   */
  private toBulkUploadFeedback(
    job: PolledJobStatus,
  ): BulkUploadFeedback | void {
    switch (job.state) {
      case 'succeeded':
        this.corrections.reset();
        void this.router.navigate(['../'], {
          relativeTo: this.route,
          queryParams: { bulkUploadSuccess: 'true' },
          state: {
            msg:
              job.createdCount === null
                ? 'All records were uploaded successfully.'
                : `${this.formatCount(job.createdCount, 'application')} imported successfully.`,
            jobId: job.id,
            totalFeeValue: job.raw['totalFeeValue'],
          },
        });
        return;

      case 'failed':
        return {
          kind: 'error',
          title: 'Error',
          heading: 'Bulk upload failed',
          body: this.formatErrorDescriptionFromError(job.message),
        } as const;

      case 'unknown':
        return {
          kind: 'error',
          title: 'Error',
          heading: 'Bulk upload status unknown',
          body: job.message ?? 'Please check again later.',
        } as const;

      default:
        return UPLOAD_IN_PROGRESS_FEEDBACK;
    }
  }

  onRetryUploadStatus(): void {
    const jobId = this.pendingJobId();
    if (jobId && !this.isJobPolling) {
      this.startBulkUploadPolling(jobId);
    }
  }

  /**
   * Converts a structured upload error description into readable table rows.
   * Missing, invalid, or non-array JSON clears the rows and falls back to
   * a plain error message.
   *
   * @param msg - Error description returned with the upload job.
   * @returns Message to display above any parsed error rows.
   */
  private formatErrorDescriptionFromError(msg: string | null): string {
    this.corrections.setErrors([]);
    this.correctionPage.set(0);
    const formatMsg = trimToUndefined(msg);

    if (!formatMsg) {
      this.errorRows.set([]);
      return 'The bulk upload could not be completed. Contact support for more guidance';
    }

    try {
      const errorsAsArrayObjects = JSON.parse(formatMsg) as ErrorDescription[];

      if (!Array.isArray(errorsAsArrayObjects)) {
        this.errorRows.set([]);
        return (
          msg ??
          'The bulk upload could not be completed. Contact support for more guidance'
        );
      }

      if (!errorsAsArrayObjects.length) {
        return 'The bulk upload could not be completed. Contact support for more guidance';
      }

      const actionable = errorsAsArrayObjects.filter(
        (error): error is ErrorDescription =>
          !!error &&
          typeof error === 'object' &&
          (error.errorType === 'DATA_ERROR' ||
            error.errorType === 'HEADER_ERROR') &&
          (error.location === null || typeof error.location === 'string') &&
          (error.message === null || typeof error.message === 'string'),
      );
      if (actionable.length === errorsAsArrayObjects.length) {
        this.corrections.setErrors(actionable);
      }
      const rows: Row[] = errorsAsArrayObjects.map(
        ({
          errorType,
          rowNumber,
          location,
          message,
          code,
          addressLine1,
          rejectedValue,
        }) => ({
          errorType: errorType === 'DATA_ERROR' ? 'Data error' : 'Header error',
          rowNumber: rowNumber === -1 ? '—' : (rowNumber ?? '—'),
          location: this.errorColumnReadable(trimToUndefined(location) ?? '—'),
          message: trimToUndefined(message) ?? '—',
          name: trimToUndefined(code) ?? '—',
          addressLine1: trimToUndefined(addressLine1) ?? '—',
          rejectedValue: trimToUndefined(rejectedValue) ?? '—',
        }),
      );
      this.errorRows.set(rows);

      return 'The bulk upload could not be completed. See the table below for more details. Please re-try the upload once these errors have been resolved';
    } catch {
      this.corrections.setErrors([]);
      this.errorRows.set([]);
      return (
        msg ??
        'The bulk upload could not be completed. Contact support for more guidance'
      );
    }
  }

  private formatCount(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
  }

  private handleUploadResponse(res: HttpResponse<JobAcknowledgement>): void {
    const jobAcknowledgement = res.body ?? null;
    this.bulkUploadPatch({ jobAcknowledgement });

    if (res.status === 202 && jobAcknowledgement?.id) {
      this.bulkUploadPatch({
        fileUploadStatus: null,
      });
      this.startBulkUploadPolling(jobAcknowledgement.id);
      return;
    }

    this.bulkUploadPatch({
      fileUploadStatus: 'error',
      errorSummary: [
        { text: 'Unable to start bulk upload. Please try again.' },
      ],
      isUploadInProgress: false,
    });
  }

  private handleUploadError(err: unknown): void {
    this.bulkUploadPatch({
      fileUploadStatus: 'error',
      errorSummary: [{ text: getProblemText(err) }],
      isUploadInProgress: false,
    });
  }

  canLeave(): boolean | Observable<boolean> {
    return (
      this.navigationWarning()?.canLeave(this.hasPendingWork()) ??
      !this.hasPendingWork()
    );
  }

  hasPendingUpload(): boolean {
    return this.vm().isUploadInProgress || !!this.pendingJobId();
  }

  hasPendingWork(): boolean {
    return (
      this.hasPendingUpload() ||
      this.corrections.hasChanges() ||
      this.corrections.hasChangesSinceValidation() ||
      this.editorDirty()
    );
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.hasPendingUpload() || this.isReadingFile()) {
      input.value = '';
      return;
    }
    if (
      (this.corrections.hasChanges() ||
        this.corrections.hasChangesSinceValidation()) &&
      !(await this.confirmDiscard())
    ) {
      input.value = '';
      return;
    }
    this.returningFromEditor.set(false);
    const version = ++this.fileSelectionVersion;
    this.corrections.reset();
    this.correctionNotice.set('');
    this.errorRows.set([]);
    this.replacementFileSelected.set(false);
    this.bulkUploadPatch({
      file: null,
      isValidCSV: false,
      fileUploadStatus: null,
      bulkUploadFeedback: null,
    });
    const allowedMimes = new Set([
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      '',
    ]);
    if (
      !file.name.toLowerCase().endsWith('.csv') ||
      !allowedMimes.has(file.type)
    ) {
      return;
    }
    this.bulkUploadPatch({ file, isValidCSV: true });
    this.replacementFileSelected.set(true);
    if (file.size > MAX_UPLOAD_BYTES || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.isReadingFile.set(true);
    try {
      const csv = parseUploadCsv(decodeUploadCsv(await file.arrayBuffer()));
      if (version === this.fileSelectionVersion && !this.destroyRef.destroyed) {
        this.corrections.reset(csv);
      }
    } catch {
      // Parsing here only enables remediation. The API still validates the upload.
      if (version === this.fileSelectionVersion) {
        this.correctionNotice.set(
          'On-screen correction is not available for this file format. If validation fails, correct the source CSV and upload it again.',
        );
      }
    } finally {
      if (version === this.fileSelectionVersion) {
        this.isReadingFile.set(false);
      }
    }
  }

  editRecord(rowNumber: number): void {
    if (
      this.hasPendingUpload() ||
      !this.corrections
        .records()
        .some((row) => row.rowNumber === rowNumber && row.editable)
    ) {
      return;
    }
    this.editorDirty.set(false);
    this.editingRow.set(rowNumber);
  }

  saveRecord(values: ReadonlyMap<number, string>): void {
    const row = this.editingRow();
    if (row === null) {
      return;
    }
    this.corrections.save(row, values);
    this.closeEditor(row);
  }

  async cancelEdit(): Promise<void> {
    if (this.editorDirty() && !(await this.confirmDiscard())) {
      return;
    }
    this.closeEditor(this.editingRow());
  }

  private closeEditor(row: number | null): void {
    this.returningFromEditor.set(true);
    this.editorDirty.set(false);
    this.editingRow.set(null);
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() =>
        this.document.getElementById(`edit-csv-row-${row}`)?.focus(),
      );
    }
  }

  private async confirmDiscard(): Promise<boolean> {
    const decision = this.navigationWarning()?.canLeave(true) ?? false;
    return typeof decision === 'boolean' ? decision : firstValueFrom(decision);
  }

  downloadCorrectedFile(): void {
    const file = this.corrections.file();
    if (file) {
      saveCsvFile(
        new HttpResponse({ body: file }),
        'corrected-bulk-upload.csv',
        this.document,
        this.platformId,
      );
    }
  }

  uploadCorrectedFile(): void {
    if (
      this.hasPendingUpload() ||
      this.isReadingFile() ||
      !this.corrections.hasChangesSinceValidation()
    ) {
      return;
    }
    const file = this.corrections.file();
    if (!file) {
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      this.bulkUploadPatch({
        fileUploadStatus: 'error',
        errorSummary: [
          {
            text: 'The corrected file exceeds 5 MB. Download it and split it into smaller files.',
          },
        ],
      });
      this.submitAttempt.update((attempt) => attempt + 1);
      return;
    }
    this.bulkUploadPatch({ file, isValidCSV: true });
    this.onSubmit(true);
  }

  onSubmit(corrected = false): void {
    if (
      !corrected &&
      (this.corrections.hasChanges() ||
        this.corrections.hasChangesSinceValidation())
    ) {
      return;
    }
    if (
      this.vm().isUploadInProgress ||
      this.isJobPolling ||
      this.isReadingFile() ||
      !!this.pendingJobId()
    ) {
      return;
    }
    this.returningFromEditor.set(false);
    this.submitAttempt.update((attempt) => attempt + 1);
    this.errorRows.set([]);
    this.corrections.errors.set([]);
    this.bulkUploadPatch({
      isUploadInProgress: true,
      bulkUploadFeedback: null,
      uploadSuccessful: false,
      currentPage: 0,
    });

    if (!this.bulkUploadState().file) {
      // No file so return
      this.bulkUploadPatch({ isUploadInProgress: false });
      return;
    }

    this.pendingJobId.set(null);
    this.replacementFileSelected.set(false);
    this.bulkUploadPatch({ fileUploadStatus: null, errorSummary: [] });

    const params: BulkUploadApplicationListEntriesRequestParams = {
      listId: this.bulkUploadState().listId,
      file: this.bulkUploadState().file ?? undefined,
    };

    this.bulkUploadRequest.set(params);
  }

  onExportErrorFilesClick(): void {
    if (!trimToUndefined(this.jobId)) {
      this.bulkUploadPatch({
        errorSummary: [
          {
            text: 'Unable to export file. If you believe this was in error, please contact support.',
          },
        ],
      });
      return;
    }

    this.disableExportErrButton.set(true);

    this.jobApi
      .downloadReport({ jobId: this.jobId }, 'response', false, {
        httpHeaderAccept: 'text/csv',
        transferCache: false,
      })
      .pipe(take(1), takeUntilDestroyed(this.componentDestroyRef))
      .subscribe({
        next: (response) => {
          this.saveCsv(response);
          this.disableExportErrButton.set(false);
        },
        error: (err) => {
          this.submitAttempt.update((attempt) => attempt + 1);
          this.bulkUploadPatch({
            fileUploadStatus: 'error',
            errorSummary: [{ text: getProblemText(err) }],
          });
          this.disableExportErrButton.set(false);
        },
      });
  }

  onPageChange(page: number): void {
    this.bulkUploadPatch({ currentPage: page });
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.errorSort.set(sort);
    this.bulkUploadPatch({ currentPage: 0 });
  }

  private saveCsv(response: HttpResponse<Blob>): void {
    if (!response.body) {
      this.bulkUploadPatch({
        errorSummary: [
          { text: 'Failed to export CSV. Please try again later' },
        ],
      });
      return;
    }

    saveCsvFile(
      response,
      `bulk-upload-export-error-csv-${getDateStamp()}.csv`,
      this.document,
      this.platformId,
    );
  }

  private errorColumnReadable(column: string): string {
    return AffectedColumn[column] ?? column ?? '—';
  }
}
