/*
Applications List – Bulk Upload (/applications-list/:id/bulk-upload)

Functionality:
  - Validates selected CSV file by extension and MIME type
  - Submits bulk upload request for the selected list
  - Updates UI state for upload progress and result
*/

import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EnvironmentInjector,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import {
  ApplicationsListBulkUploadState,
  InitialBulkUploadState,
} from './util/applications-list-bulk-upload.state';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { LoadingSpinner } from '@components/loading-spinner/loading-spinner';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import {
  ActionsApi,
  BulkUploadApplicationListEntriesRequestParams,
  JobAcknowledgement,
  JobStatus,
} from '@openapi';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';

@Component({
  selector: 'app-applications-list-bulk-upload',
  imports: [
    FormsModule,
    BreadcrumbsComponent,
    PageHeaderComponent,
    ErrorSummaryComponent,
    LoadingSpinner,
    SuccessBannerComponent,
  ],
  templateUrl: './applications-list-bulk-upload.component.html',
  styleUrl: './applications-list-bulk-upload.component.scss',
})
export class ApplicationsListBulkUpload implements OnInit {
  private readonly actionsApiService = inject(ActionsApi);
  private readonly route = inject(ActivatedRoute);

  isValidCSV: boolean | null = null;
  errorSummary: ErrorItem[] = [];
  file!: File;
  isUploadInProgress = false;
  fileUploadStatus!: 'success' | 'error' | null;
  jobAcknowledgement!: JobAcknowledgement;
  listId!: string;

  // Initialise signal state
  private readonly bulkUploadSignalState =
    createSignalState<ApplicationsListBulkUploadState>(InitialBulkUploadState);
  private readonly bulkUploadState = this.bulkUploadSignalState.state;
  readonly vm = this.bulkUploadSignalState.vm;

  // allows you to initialise effect in ngOnInit()
  private readonly envInjector = inject(EnvironmentInjector);

  private readonly bulkUploadRequest =
    signal<BulkUploadApplicationListEntriesRequestParams | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    // invalid listId then navigate to 404 page
    if (id) {
      // this.listId = id;
      this.bulkUploadSignalState.patch({ listId: id });
    }

    this.setupEffects();
  }

  private setupEffects(): void {
    setupLoadEffect(
      {
        request: this.bulkUploadRequest,
        load: (params) =>
          this.actionsApiService.bulkUploadApplicationListEntries(
            params,
            'body',
            true,
          ),
        onSuccess: (jobAcknowledgement) => {
          this.jobAcknowledgement = jobAcknowledgement;
          if (this.jobAcknowledgement.status === JobStatus.RECEIVED) {
            this.fileUploadStatus = 'success';
          }
        },
        onError: (err) => {
          this.fileUploadStatus = 'error';
          this.errorSummary = [{ text: `${err.message}` }];
        },
      },
      this.envInjector,
    );
  }

  onFileSelected(event: Event): void {
    this.fileUploadStatus = null;
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
      this.isValidCSV = false;
      return;
    }

    this.isValidCSV = true;

    if (file) {
      this.file = file;
    }
  }

  onSubmit(): void {
    this.isUploadInProgress = true;
    const params: BulkUploadApplicationListEntriesRequestParams = {
      listId: this.listId,
      file: this.file,
    };

    this.actionsApiService
      .bulkUploadApplicationListEntries(params, 'body', true)
      .pipe(
        finalize(() => {
          this.isUploadInProgress = false;
        }),
      )
      .subscribe({
        next: (jobAcknowledgement: JobAcknowledgement) => {
          this.jobAcknowledgement = jobAcknowledgement;
          if (this.jobAcknowledgement.status === JobStatus.RECEIVED) {
            this.fileUploadStatus = 'success';
          }
        },
        error: (err: HttpErrorResponse) => {
          this.fileUploadStatus = 'error';
          this.errorSummary = [{ text: `${err.message}` }];
        },
      });
  }
}
