/*
Applications List – Bulk Upload (/applications-list/:id/bulk-upload)

Functionality:
  - Validates selected CSV file by extension and MIME type
  - Submits bulk upload request for the selected list
  - Updates UI state for upload progress and result
*/

import { HttpResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  EnvironmentInjector,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ApplicationsListBulkUploadState,
  BulkUploadFeedback,
  InitialBulkUploadState,
} from './util/applications-list-bulk-upload.state';

import { AsyncJobProgressComponent } from '@components/async-job-progress/async-job-progress.component';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { ErrorSummaryComponent } from '@components/error-summary/error-summary.component';
import { HelpDetailsComponent } from '@components/help-details/help-details.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListEntriesApi,
  BulkUploadApplicationListEntriesRequestParams,
  JobAcknowledgement,
} from '@openapi';
import {
  JobPollingFacade,
  PolledJobStatus,
} from '@services/jobs/job-polling.facade';
import { getProblemText } from '@util/http-error-to-text';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { trimToUndefined } from '@util/string-helpers';

const UPLOAD_IN_PROGRESS_FEEDBACK = {
  kind: 'progress',
  heading: 'Upload in progress',
  body: 'Your bulk upload is being processed. This page will update automatically when it finishes.',
} as const;

const BulkUploadErrorTableColumns: TableColumn[] = [
  { header: 'Error type', field: 'errorType', wrap: false },
  { header: 'Row', field: 'rowNumber', wrap: false },
  { header: 'Affected column', field: 'location' },
  { header: 'Message', field: 'message' },
  { header: 'Applicant name', field: 'name' },
  { header: 'Address line 1', field: 'addressLine1', wrap: false },
  { header: 'Rejected value', field: 'rejectedValue', wrap: false },
];

interface ErrorDescription {
  rowNumber: number | null;
  location: string | null;
  rejectedValue: string | null;
  message: string | null;
  addressLine1: string | null;
  name: string | null;
  errorType: 'HEADER_ERROR' | 'DATA_ERROR';
}

@Component({
  selector: 'app-applications-list-bulk-upload',
  imports: [
    FormsModule,
    BreadcrumbsComponent,
    PageHeaderComponent,
    ErrorSummaryComponent,
    HelpDetailsComponent,
    AsyncJobProgressComponent,
    NotificationBannerComponent,
    SortableTableComponent,
  ],
  templateUrl: './applications-list-bulk-upload.component.html',
  styleUrl: './applications-list-bulk-upload.component.scss',
})
export class ApplicationsListBulkUpload implements OnInit {
  private readonly actionsApi = inject(ApplicationListEntriesApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly jobPollingFacade = inject(JobPollingFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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

  columns = BulkUploadErrorTableColumns;
  readonly errorRows = signal<Row[]>([]);

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

  private startBulkUploadPolling(jobId: string): void {
    this.bulkUploadPatch({
      bulkUploadFeedback: UPLOAD_IN_PROGRESS_FEEDBACK,
    });

    this.jobPollingFacade
      .watchJob(jobId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => this.handleBulkUploadStatus(job),
        error: () => {
          this.bulkUploadPatch({
            bulkUploadFeedback: {
              kind: 'error',
              title: 'Error',
              heading: 'Unable to load upload status',
              body: 'Please try again later.',
            },
          });
          this.submitAttempt.update((attempt) => attempt + 1);
        },
      });
  }

  private handleBulkUploadStatus(job: PolledJobStatus): void {
    if (!job.isTerminal) {
      return;
    }

    this.bulkUploadPatch({
      bulkUploadFeedback: this.toBulkUploadFeedback(job),
      uploadSuccessful: job.state === 'succeeded',
    });
  }

  private toBulkUploadFeedback(
    job: PolledJobStatus,
  ): BulkUploadFeedback | void {
    switch (job.state) {
      case 'succeeded':
        void this.router.navigate(['../'], {
          relativeTo: this.route,
          queryParams: { bulkUploadSuccess: 'true' },
          state: {
            msg:
              job.createdCount === null
                ? 'All records were uploaded successfully.'
                : `${this.formatCount(job.createdCount, 'record')} created.`,
            jobId: job.id,
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

      default:
        return UPLOAD_IN_PROGRESS_FEEDBACK;
    }
  }

  private formatErrorDescriptionFromError(msg: string | null): string {
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

      const rows: Row[] = errorsAsArrayObjects.map(
        ({
          errorType,
          rowNumber,
          location,
          message,
          name,
          addressLine1,
          rejectedValue,
        }) => ({
          errorType: errorType === 'DATA_ERROR' ? 'Data error' : 'Header error',
          rowNumber,
          location: trimToUndefined(location) ?? '—',
          message: trimToUndefined(message) ?? '—',
          name: trimToUndefined(name) ?? '—',
          addressLine1: trimToUndefined(addressLine1) ?? '—',
          rejectedValue: trimToUndefined(rejectedValue) ?? '—',
        }),
      );
      this.errorRows.set(rows);
      return 'The bulk upload could not be completed. See the table below for more details';
    } catch {
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
        isUploadInProgress: false,
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

  onFileSelected(event: Event): void {
    this.bulkUploadPatch({ fileUploadStatus: null, bulkUploadFeedback: null });
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      // no file selected
      return;
    }

    const file = input.files[0];

    // validate filename extension
    const isCsvExtension = file.name.toLowerCase().endsWith('.csv');

    // validate MIME type
    const allowedMimes = new Set([
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      '',
    ]);
    const isCsvMime = allowedMimes.has(file.type);

    if (!isCsvExtension && !isCsvMime) {
      this.bulkUploadPatch({ isValidCSV: false });
      return;
    }

    this.bulkUploadPatch({ isValidCSV: true });

    if (file) {
      this.bulkUploadPatch({ file });
    }
  }

  onSubmit(): void {
    this.submitAttempt.update((attempt) => attempt + 1);
    this.errorRows.set([]);
    this.bulkUploadPatch({
      isUploadInProgress: true,
      bulkUploadFeedback: null,
      uploadSuccessful: false,
    });

    if (!this.bulkUploadState().file) {
      // No file so return
      this.bulkUploadPatch({ isUploadInProgress: false });
      return;
    }

    const params: BulkUploadApplicationListEntriesRequestParams = {
      listId: this.bulkUploadState().listId,
      file: this.bulkUploadState().file ?? undefined,
    };

    this.bulkUploadRequest.set(params);
  }

  onExportErrorFilesClick(): void {
    // TODO: ARCPOC-1506
  }
}
