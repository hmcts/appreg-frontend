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
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { APPLICATIONS_LIST_COLUMNS } from '../../../shared/constants/applications-list/applications-list.constants';

import { AlertComponent } from '@components/alert/alert.component';
import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { TableComponent } from '@components/table/table.component';
import { IF_MATCH, ROW_VERSION } from '@context/concurrency-context';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import { ApplicationListsApi } from '@openapi';
import { AppListNavState } from '@shared-types/applications-list/applications-list-form';
import { ApplicationListRow } from '@util/types/application-list/types';

@Component({
  selector: 'app-applications-list-delete',
  imports: [
    ReviewConfirmComponent,
    TableComponent,
    DateTimePipe,
    AlertComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './applications-list-delete.component.html',
})
export class ApplicationsListDeleteComponent implements OnInit {
  private readonly appListsApi = inject(ApplicationListsApi);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  listToDelete: ApplicationListRow | undefined = isPlatformBrowser(
    this.platformId,
  )
    ? (this.location.getState() as AppListNavState).listRow
    : undefined;

  idFromUrl = this.route.snapshot.paramMap.get('id');

  // From undo create path - determines wording & navigation
  undoCreateIsTrue: boolean | undefined = isPlatformBrowser(this.platformId)
    ? (this.location.getState() as AppListNavState).undoCreate
    : false;

  columns = APPLICATIONS_LIST_COLUMNS;

  title: string = this.undoCreateIsTrue
    ? 'Are you sure you want to undo the creation of this application list?'
    : 'Are you sure you want to delete this application list?';

  warningBannerText: string = this.undoCreateIsTrue
    ? 'You are about to undo the creation of this Application List. This action cannot be undone.'
    : 'You are about to delete this Application List and all of the Application List Entries. This action cannot be undone.';

  ngOnInit(): void {
    if (!this.listToDelete && this.idFromUrl) {
      this.goBack();
    }
  }

  onDelete(): void {
    this.deleteList();
  }

  goBack(): void {
    if (this.undoCreateIsTrue && this.idFromUrl) {
      void this.router.navigate(['/applications-list', this.idFromUrl]);
    }

    void this.router.navigate(['/applications-list']);
  }

  private deleteList(): void {
    const row = this.listToDelete;
    if (!row) {
      return;
    }

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
            queryParams: {
              delete: 'success',
            },
          });
        },
        error: (err: unknown) => {
          const code =
            err instanceof HttpErrorResponse ? err.status : undefined;

          void this.router.navigate(['/applications-list'], {
            queryParams: {
              delete: 'error',
              code: code ?? 500,
            },
          });
        },
      });
  }
}
