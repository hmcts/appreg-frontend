import { Location, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, expand, last, map } from 'rxjs';

import { selectedRow } from '../util';
import { mapEntrySummaryRows } from '../util/map-entry-summary-rows';

import { AlertComponent } from '@components/alert/alert.component';
import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { TableComponent } from '@components/table/table.component';
import { appListDetailColumns } from '@constants/application-list-detail-update/form-table-structure';
import { ApplicationListEntriesApi, ApplicationListStatus } from '@openapi';
import { getProblemText } from '@util/http-error-to-text';

/**
 * ApplicationsListEntryDeleteComponent
 *
 * Functionality:
 * - Shows the entry deletion confirmation.
 * - Deletes the entry or returns to the previous page.
 * - Shows the entry being removed before the deletion action.
 */
@Component({
  selector: 'app-applications-list-entry-delete',
  imports: [AlertComponent, ReviewConfirmComponent, TableComponent],
  templateUrl: './applications-list-entry-delete.component.html',
  styleUrl: './applications-list-entry-delete.component.scss',
})
export class ApplicationsListEntryDeleteComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  private readonly api = inject(ApplicationListEntriesApi);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  entryId = this.route.snapshot.paramMap.get('entryId');
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
    if (!this.listId || !this.entryId) {
      this.goBack();
      return;
    }
    if (!this.entryRow || this.entryRow.id !== this.entryId) {
      this.entryRow = undefined;
      this.loadEntry();
    }
  }

  loadEntry(): void {
    if (!this.listId || !this.entryId || this.loading()) {
      return;
    }
    this.loading.set(true);
    this.loadError.set(false);
    const loadPage = (pageNumber: number) =>
      this.api
        .getApplicationListEntries(
          {
            listId: this.listId!,
            pageNumber,
            pageSize: 100,
            sort: ['sequenceNumber,asc'],
          },
          'body',
          false,
          { transferCache: false },
        )
        .pipe(
          map((page) => {
            if (
              page.pageNumber !== pageNumber ||
              !page.content ||
              !Number.isInteger(page.pageSize) ||
              page.pageSize <= 0 ||
              !Number.isInteger(page.totalElements) ||
              page.totalElements < 0
            ) {
              throw new Error('Incomplete entry response');
            }
            return page;
          }),
        );
    loadPage(0)
      .pipe(
        expand((page) => {
          if (
            page.content.some((entry) => entry.id === this.entryId) ||
            (page.pageNumber + 1) * page.pageSize >= page.totalElements
          ) {
            return EMPTY;
          }
          if (page.content.length === 0 || page.pageSize <= 0) {
            throw new Error('Incomplete entry response');
          }
          return loadPage(page.pageNumber + 1);
        }),
        last(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          const entry = page.content.find((row) => row.id === this.entryId);
          this.entryRow =
            entry?.status === ApplicationListStatus.OPEN
              ? mapEntrySummaryRows([entry])[0]
              : undefined;
          this.loading.set(false);
          this.loadError.set(!this.entryRow);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  onDelete(): void {
    if (
      !this.entryRow?.id ||
      this.entryRow.id !== this.entryId ||
      !this.listId ||
      this.loading() ||
      this.loadError()
    ) {
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
        void this.router.navigate(['/applications-list', this.listId], {
          queryParams: {
            deleteSuccess: false,
          },
          state: {
            deleteError:
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
