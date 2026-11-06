/**
 * Delete Application List
 * Main Component for page /applications-list/:id/delete
 *
 * Functionality:
 * onDelete():
 * - DELETE request to remove the selected Application List
 * - Sends concurrency headers (ETag and row version)
 * - Redirects back to /applications-list with success or error status
 *
 * goBack():
 * - Navigates back to /applications-list without deleting the Application List
 */

import { Location, isPlatformBrowser } from '@angular/common';
import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, expand, map, reduce } from 'rxjs';

import { AlertComponent } from '@components/alert/alert.component';
import { ErrorSummaryComponent } from '@components/error-summary/error-summary.component';
import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { IF_MATCH, ROW_VERSION } from '@context/concurrency-context';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import {
  ApplicationListEntriesApi,
  ApplicationListsApi,
  EntryGetSummaryDto,
} from '@openapi';
import { AppListNavState } from '@shared-types/applications-list/applications-list-form';
import { formatPartyName } from '@util/string-helpers';
import { ApplicationListRow } from '@util/types/application-list/types';

@Component({
  selector: 'app-applications-list-delete',
  imports: [ReviewConfirmComponent, AlertComponent, ErrorSummaryComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './applications-list-delete.component.html',
})
export class ApplicationsListDeleteComponent implements OnInit {
  private readonly appListsApi = inject(ApplicationListsApi);
  private readonly entriesApi = inject(ApplicationListEntriesApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dateTime = inject(DateTimePipe);

  listToDelete: ApplicationListRow | undefined = isPlatformBrowser(
    this.platformId,
  )
    ? (this.location.getState() as AppListNavState).listRow
    : undefined;

  isFromListDetails: boolean | undefined = isPlatformBrowser(this.platformId)
    ? (this.location.getState() as AppListNavState).fromListDetails
    : false;

  idFromUrl = this.route.snapshot.paramMap.get('id');

  readonly childEntries = signal<EntryGetSummaryDto[]>([]);
  readonly entriesLoading = signal(false);
  readonly entriesLoaded = signal(false);
  readonly entriesLoadError = signal(false);
  readonly deleting = signal(false);

  readonly listSummary = computed(() => {
    const row = this.listToDelete;
    return [
      {
        key: 'Date',
        value: this.dateTime.transform(row?.date) ?? 'Not provided',
      },
      { key: 'Time', value: row?.time || 'Not provided' },
      { key: 'Location', value: row?.location || 'Not provided' },
      { key: 'Description', value: row?.description || 'Not provided' },
      { key: 'Status', value: row?.status || 'Not provided' },
    ];
  });

  readonly childSummaries = computed(() =>
    this.childEntries().map((entry) => ({
      id: entry.id,
      details: [
        {
          key: 'Sequence number',
          value: entry.sequenceNumber ?? 'Not provided',
        },
        {
          key: 'Account number',
          value: entry.accountNumber?.trim() || 'Not provided',
        },
        {
          key: 'Applicant',
          value: formatPartyName(entry.applicant) || 'Not provided',
        },
        {
          key: 'Respondent',
          value: formatPartyName(entry.respondent) || 'Not provided',
        },
        {
          key: 'Title',
          value: entry.applicationTitle?.trim() || 'Not provided',
        },
      ],
    })),
  );

  ngOnInit(): void {
    if (
      !this.listToDelete ||
      !this.idFromUrl ||
      this.listToDelete.id !== this.idFromUrl
    ) {
      this.goBack();
      return;
    }

    this.loadChildEntries();
  }

  loadChildEntries(): void {
    if (
      !this.listToDelete ||
      this.listToDelete.id !== this.idFromUrl ||
      this.entriesLoading() ||
      this.deleting()
    ) {
      return;
    }

    const listId = this.listToDelete.id;
    let totalElements: number | undefined;
    this.childEntries.set([]);
    this.entriesLoaded.set(false);
    this.entriesLoadError.set(false);
    this.entriesLoading.set(true);

    const loadPage = (pageNumber: number) =>
      this.entriesApi
        .getApplicationListEntries(
          { listId, pageNumber, pageSize: 100, sort: ['sequenceNumber,asc'] },
          'body',
          false,
          { transferCache: false },
        )
        .pipe(
          map((page) => {
            totalElements ??= page.totalElements;
            if (
              page.pageNumber !== pageNumber ||
              page.pageSize <= 0 ||
              page.totalElements !== totalElements ||
              page.content.length !==
                Math.min(
                  page.pageSize,
                  Math.max(0, totalElements - pageNumber * page.pageSize),
                )
            ) {
              throw new Error('Incomplete application list entries');
            }
            return page;
          }),
        );

    loadPage(0)
      .pipe(
        expand((page) =>
          (page.pageNumber + 1) * page.pageSize < page.totalElements
            ? loadPage(page.pageNumber + 1)
            : EMPTY,
        ),
        reduce(
          (entries, page) => [...entries, ...page.content],
          [] as EntryGetSummaryDto[],
        ),
        map((entries) => {
          if (
            entries.length !== totalElements ||
            new Set(entries.map((entry) => entry.id)).size !== entries.length
          ) {
            throw new Error('Incomplete application list entries');
          }
          return entries;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (entries) => {
          this.childEntries.set(entries);
          this.entriesLoaded.set(true);
          this.entriesLoading.set(false);
        },
        error: () => {
          this.entriesLoadError.set(true);
          this.entriesLoading.set(false);
        },
      });
  }

  onDelete(): void {
    if (
      !this.entriesLoaded() ||
      this.entriesLoading() ||
      this.entriesLoadError() ||
      this.deleting()
    ) {
      return;
    }
    this.deleteList();
  }

  goBack(): void {
    if (this.isFromListDetails && this.idFromUrl) {
      void this.router.navigate(['/applications-list', this.idFromUrl], {
        fragment: 'list-details',
      });
      return;
    }

    void this.router.navigate(['/applications-list']);
  }

  private deleteList(): void {
    const row = this.listToDelete;
    if (!row) {
      return;
    }

    this.deleting.set(true);

    this.appListsApi
      .deleteApplicationList({ listId: row.id }, 'response', false, {
        context: new HttpContext()
          .set(IF_MATCH, row.etag ?? null)
          .set(ROW_VERSION, row.rowVersion ?? null),
      })
      .pipe(map((resp) => resp.status))
      .subscribe({
        next: () => {
          void this.router.navigate(['/applications-list'], {
            queryParams: { delete: 'success' },
          });
        },
        error: (err: unknown) => {
          const code =
            err instanceof HttpErrorResponse ? err.status : undefined;

          let routerLinkNav = ['/applications-list'];
          if (this.isFromListDetails && this.idFromUrl) {
            routerLinkNav = ['/applications-list', this.idFromUrl];
          }

          void this.router.navigate(routerLinkNav, {
            queryParams: {
              delete: 'error',
              code: code ?? 500,
            },
          });
        },
      });
  }
}
