import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { initAll } from 'govuk-frontend';

import { BulkUploadResponse } from '../../models/bulk-upload-response';
import { ApplicationListService } from '../../services/applications-list/application-list.service';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './bulk-upload.component.html',
  styleUrl: './bulk-upload.component.scss',
})
export class BulkUploadComponent {
  public id!: string;
  public selectedFile: File | null = null;
  public uploadError: string | null = null;
  public uploadSuccess: boolean = false;
  public uploadSummary: { successCount: number; errorCount: number } | null = null;

  constructor(
    private route: ActivatedRoute,
    private appListService: ApplicationListService,
    private router: Router
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    initAll();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedFile = input.files[0];
      this.uploadError = null;
      this.uploadSuccess = false;
      this.uploadSummary = null;
    }
  }

  upload(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Please choose a file.';
      return;
    }

    this.appListService.uploadBulkCsv(this.id, this.selectedFile).subscribe({
      next: (response: BulkUploadResponse) => {
        this.uploadSuccess = true;
        this.uploadError = null;
        this.uploadSummary = {
          successCount: response.successfulCount,
          errorCount: response.errors.length,
        };
      },
      error: (err: HttpErrorResponse) => {
        this.uploadError = err.error?.message || 'File upload failed.';
        this.uploadSuccess = false;
        this.uploadSummary = null;
      },
    });
  }
}
