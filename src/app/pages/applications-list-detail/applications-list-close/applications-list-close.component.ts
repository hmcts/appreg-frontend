import { Location, isPlatformBrowser } from '@angular/common';
import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { APPLICATIONS_LIST_COLUMNS } from '@components/applications-list/util/applications-list.constants';
import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { TableComponent } from '@components/table/table.component';
import { WarningBannerComponent } from '@components/warning-banner/warning-banner.component';
import { IF_MATCH } from '@context/concurrency-context';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import { ApplicationListsApi } from '@openapi';
import { AppListNavState } from '@shared-types/applications-list/applications-list-form';
import { ApplicationListRow } from '@util/types/application-list/types';

@Component({
  selector: 'app-applications-list-close',
  imports: [
    ReviewConfirmComponent,
    WarningBannerComponent,
    TableComponent,
    DateTimePipe,
  ],
  templateUrl: './applications-list-close.component.html',
})
export class ApplicationsListCloseComponent implements OnInit {
  private readonly appListsApi = inject(ApplicationListsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);

  idFromUrl = this.route.snapshot.paramMap.get('id');

  private readonly navState: AppListNavState | undefined = isPlatformBrowser(
    this.platformId,
  )
    ? (this.location.getState() as AppListNavState)
    : undefined;

  private readonly closeRequest = this.navState?.closeRequest;
  listToClose: ApplicationListRow | undefined = this.navState?.listRow;

  columns = APPLICATIONS_LIST_COLUMNS;

  ngOnInit(): void {
    if (!this.idFromUrl || !this.closeRequest) {
      void this.router.navigate(['/applications-list']);
      return;
    }

    if (this.closeRequest?.id !== this.idFromUrl) {
      this.goBack();
    }
  }

  onConfirm(): void {
    this.closeList();
  }

  goBack(): void {
    void this.router.navigate(['/applications-list', this.idFromUrl], {
      state: { row: this.listToClose },
    });
  }

  private closeList(): void {
    const req = this.closeRequest;
    if (!req) {
      this.goBack();
      return;
    }

    this.appListsApi
      .updateApplicationList(
        { listId: req.id, applicationListUpdateDto: req.payload },
        'response',
        false,
        {
          context: new HttpContext().set(IF_MATCH, req.etag ?? null),
        },
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/applications-list', req.id], {
            queryParams: { isCloseSuccess: true },
            fragment: 'list-details',
          });
        },
        error: (err: unknown) => {
          const code =
            err instanceof HttpErrorResponse ? err.status : undefined;

          void this.router.navigate(['/applications-list', req.id], {
            queryParams: {
              close: 'error',
              code: code ?? 500,
            },
          });
        },
      });
  }
}
