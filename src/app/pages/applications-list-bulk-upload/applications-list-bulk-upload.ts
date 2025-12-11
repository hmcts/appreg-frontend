import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  ActionsApi,
  BulkUploadApplicationListEntriesRequestParams,
  JobStatus,
} from '../../../generated/openapi';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '../../shared/components/error-summary/error-summary.component';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';

import { JobAcknowledgement } from './../../../generated/openapi/model/job-acknowledgement';

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
  templateUrl: './applications-list-bulk-upload.html',
  styleUrl: './applications-list-bulk-upload.scss',
})
export class ApplicationsListBulkUpload implements OnInit {
  isValidCSV: boolean | null = null;
  errorSummary: ErrorItem[] = [];
  errorHint: string = 'There is a problem';
  file!: File;
  isUploadInProgress = false;
  fileUploadStatus!: 'success' | 'error';
  jobAcknowledgement!: JobAcknowledgement;
  listId!: string;
  private readonly actionsApiService = inject(ActionsApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    // invalid listId then navigate to 404 page
    if (!id) {
      this.router.navigate(['../'], { relativeTo: this.route });
    } else {
      this.listId = id;
    }
  }

  onFileSelected(event: Event): void {
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
