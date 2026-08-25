import { Location, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { selectedRow } from '../util';

import { AlertComponent } from '@components/alert/alert.component';
import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { TableComponent } from '@components/table/table.component';
import { appListDetailColumns } from '@constants/application-list-detail-update/form-table-structure';
import { ApplicationListEntriesApi } from '@openapi';
import { getProblemText } from '@util/http-error-to-text';

@Component({
  selector: 'app-applications-list-entry-delete',
  imports: [AlertComponent, ReviewConfirmComponent, TableComponent],
  templateUrl: './applications-list-entry-delete.component.html',
  styleUrl: './applications-list-entry-delete.component.scss',
})
export class ApplicationsListEntryDeleteComponent implements OnInit {
  private readonly api = inject(ApplicationListEntriesApi);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  listId = this.route.snapshot.paramMap.get('id');
  entryRow: selectedRow | undefined = isPlatformBrowser(this.platformId)
    ? (
        this.location.getState() as {
          row: selectedRow;
        }
      ).row
    : undefined;

  columns = appListDetailColumns.filter(
    (column) => column.header !== 'Actions',
  );

  ngOnInit(): void {
    if (!this.listId || !this.entryRow?.id) {
      this.goBack();
    }
  }

  onDelete(): void {
    if (!this.entryRow?.id || !this.listId) {
      return;
    }

    const listId = this.listId;
    const entryId = this.entryRow?.id;

    this.api.deleteApplicationListEntry({ listId, entryId }).subscribe({
      next: () => {
        void this.router.navigate(['/applications-list', this.listId], {
          queryParams: { deleteSuccess: true },
        });
      },
      error: (err) => {
        const code = err instanceof HttpErrorResponse ? err.status : undefined;

        void this.router.navigate(['/applications-list', this.listId], {
          queryParams: {
            deleteSuccess: false,
            code: code ?? 500,
            errMsg:
              getProblemText(err) ??
              'Could not delete the selected application',
          },
        });
      },
    });
  }

  goBack(): void {
    if (this.listId) {
      void this.router.navigate(['/applications-list', this.listId]);
      return;
    }

    void this.router.navigate(['/applications-list']);
  }
}
