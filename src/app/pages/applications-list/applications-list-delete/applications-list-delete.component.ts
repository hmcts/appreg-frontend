import { Location, isPlatformBrowser } from '@angular/common';
import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { APPLICATIONS_LIST_COLUMNS } from '../util/applications-list.constants';

import { DeleteComponent } from '@components/delete/delete.component';
import { TableComponent } from '@components/table/table.component';
import { IF_MATCH, ROW_VERSION } from '@context/concurrency-context';
import { ApplicationListsApi } from '@openapi';
import { ApplicationListRow } from '@util/types/application-list/types';

type DeleteNavState = { listToDelete?: ApplicationListRow };

@Component({
  selector: 'app-applications-list-delete',
  imports: [DeleteComponent, TableComponent],
  templateUrl: './applications-list-delete.component.html',
})
export class ApplicationsListDeleteComponent implements OnInit {
  private appListsApi = inject(ApplicationListsApi);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  listToDelete: ApplicationListRow | undefined = isPlatformBrowser(
    this.platformId,
  )
    ? (this.location.getState() as DeleteNavState).listToDelete
    : undefined;

  idFromUrl = this.route.snapshot.paramMap.get('id');

  columns = APPLICATIONS_LIST_COLUMNS;

  ngOnInit(): void {
    if (!this.listToDelete && this.idFromUrl) {
      this.goBack();
    }
  }

  onDelete(): void {
    this.deleteList();
  }

  goBack(): void {
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
