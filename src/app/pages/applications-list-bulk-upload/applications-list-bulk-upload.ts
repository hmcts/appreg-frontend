import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ActionsApi } from '../../../generated/openapi';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ErrorSummaryComponent } from '../../shared/components/error-summary/error-summary.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-applications-list-bulk-upload',
  imports: [FormsModule, BreadcrumbsComponent, PageHeaderComponent, ErrorSummaryComponent],
  templateUrl: './applications-list-bulk-upload.html',
  styleUrl: './applications-list-bulk-upload.scss',
})
export class ApplicationsListBulkUpload {
  isValidCSV: boolean | null = null;
  errorHint: string = 'There is a problem';
  private readonly actionsApiService = inject(ActionsApi);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      console.log('No file selected');
      return;
    }

    const file = input.files[0];

    // validate filename extension
    const isCsvExtension = file.name.toLowerCase().endsWith('.csv');

    // validate MIME type
    const allowedMimes = new Set([
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel', // common on Windows
      ''
    ]);
    const isCsvMime = allowedMimes.has(file.type);

    if (!isCsvExtension && !isCsvMime) {
      this.isValidCSV = false;
      return;
    }

    this.isValidCSV = true;

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
  }

  onSubmit(): void {
    // Send formData in the POST request when implemented, for now use wiremock
    this.actionsApiService.bulkUploadApplicationListEntries({ listId: '9b8b4b6e-9d1a-4a6a-9a36-111111111111' })
      .subscribe({
        next: (acknowledgement) => {
          console.log('Bulk upload job started with ID:', acknowledgement);
        },
        error: (err: HttpErrorResponse) => {
          console.log(err);
        },
      });
  }

} 
