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

const UPLOAD_IN_PROGRESS_FEEDBACK = {
  kind: 'progress',
  heading: 'Upload in progress',
  body: 'Your bulk upload is being processed. This page will update automatically when it finishes.',
} as const;

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

      case 'completed_with_errors':
        return {
          kind: 'error',
          title: 'Error',
          heading: 'Bulk upload failed',
          body: this.buildCompletedWithErrorsMessage(job),
        } as const;

      case 'failed':
        return {
          kind: 'error',
          title: 'Error',
          heading: 'Bulk upload failed',
          body: job.message ?? 'The bulk upload could not be completed.',
        } as const;

      default:
        return UPLOAD_IN_PROGRESS_FEEDBACK;
    }
  }

  private buildCompletedWithErrorsMessage(job: PolledJobStatus): string {
    const parts: string[] = [];

    if (job.createdCount !== null) {
      parts.push(`${this.formatCount(job.createdCount, 'record')} created.`);
    }

    if (job.errorCount !== null) {
      parts.push(`${this.formatCount(job.errorCount, 'record')} had errors.`);
    }

    return parts.length > 0
      ? parts.join(' ')
      : 'Some records were uploaded, but some could not be processed.';
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
}
