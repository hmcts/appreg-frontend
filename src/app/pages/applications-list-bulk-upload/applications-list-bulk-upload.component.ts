/*
Applications List – Bulk Upload (/applications-list/:id/bulk-upload)

Functionality:
  - Validates selected CSV file by extension and MIME type
  - Submits bulk upload request for the selected list
  - Updates UI state for upload progress and result
*/

import {
  Component,
  EnvironmentInjector,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  ApplicationsListBulkUploadState,
  InitialBulkUploadState,
} from './util/applications-list-bulk-upload.state';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { ErrorSummaryComponent } from '@components/error-summary/error-summary.component';
import { LoadingSpinner } from '@components/loading-spinner/loading-spinner';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import {
  ApplicationListEntriesApi,
  BulkUploadApplicationListEntriesRequestParams,
  JobStatus,
} from '@openapi';
import { getProblemText } from '@util/http-error-to-text';
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
  private readonly applicationListEntriesApi = inject(
    ApplicationListEntriesApi,
  );
  private readonly route = inject(ActivatedRoute);

  // Initialise signal state
  private readonly bulkUploadSignalState =
    createSignalState<ApplicationsListBulkUploadState>(InitialBulkUploadState);
  private readonly bulkUploadState = this.bulkUploadSignalState.state;
  private readonly bulkUploadPatch = this.bulkUploadSignalState.patch;
  readonly vm = this.bulkUploadSignalState.vm;

  // allows you to initialise effect in ngOnInit()
  private readonly envInjector = inject(EnvironmentInjector);

  private readonly bulkUploadRequest =
    signal<BulkUploadApplicationListEntriesRequestParams | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    // invalid listId then navigate to 404 page
    if (id) {
      this.bulkUploadSignalState.patch({ listId: id });
    }

    this.setupEffects();
  }

  private setupEffects(): void {
    setupLoadEffect(
      {
        request: this.bulkUploadRequest,
        load: (params) =>
          this.applicationListEntriesApi.bulkUploadApplicationListEntries(
            params,
            'body',
            true,
          ),
        onSuccess: (jobAcknowledgement) => {
          this.bulkUploadPatch({ jobAcknowledgement });
          if (
            this.bulkUploadState().jobAcknowledgement?.status ===
            JobStatus.RECEIVED
          ) {
            this.bulkUploadPatch({ fileUploadStatus: 'success' });
          }
          this.bulkUploadPatch({ isUploadInProgress: false });
          this.bulkUploadRequest.set(null);
        },
        onError: (err) => {
          this.bulkUploadPatch({ fileUploadStatus: 'error' });
          this.bulkUploadPatch({
            errorSummary: [{ text: getProblemText(err) }],
          });
          this.bulkUploadPatch({ isUploadInProgress: false });

          this.bulkUploadRequest.set(null);
        },
      },
      this.envInjector,
    );
  }

  onFileSelected(event: Event): void {
    this.bulkUploadPatch({ fileUploadStatus: null });
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
    this.bulkUploadPatch({ isUploadInProgress: true });

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
