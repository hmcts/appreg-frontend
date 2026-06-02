import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BulkUpdateFeeState, initialBulkUpdateFeeState } from './util';

import { APPLICATION_ENTRIES_MOVE_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { ApplicationEntriesBaseContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { ErrorSummaryComponent } from '@components/error-summary/error-summary.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { createSignalState } from '@util/signal-state-helpers';

@Component({
  selector: 'app-applications-list-detail-bulk-update-fees',
  imports: [
    BreadcrumbsComponent,
    ErrorSummaryComponent,
    SortableTableComponent,
  ],
  templateUrl: './applications-list-detail-bulk-update-fees.component.html',
  styleUrl: './applications-list-detail-bulk-update-fees.component.scss',
})
export class ApplicationsListDetailBulkUpdateFeesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  // Initialise signal state
  private readonly bulkFeeUpdateSignalState =
    createSignalState<BulkUpdateFeeState>(initialBulkUpdateFeeState);
  private readonly feeState = this.bulkFeeUpdateSignalState.state;
  private readonly feeStatePatch = this.bulkFeeUpdateSignalState.patch;
  readonly vm = this.bulkFeeUpdateSignalState.vm;

  // Reuse columns from another page
  columnsEntries = APPLICATION_ENTRIES_MOVE_COLUMNS;

  onCreateErrorClick = onCreateErrorClickFn;

  ngOnInit(): void {
    const listId = this.route.snapshot.paramMap.get('id') ?? undefined;
    const selectedEntries = isPlatformBrowser(this.platformId)
      ? ((
          history.state as {
            entriesToUpdateFee?: ApplicationEntriesBaseContext[];
          }
        )?.entriesToUpdateFee ?? [])
      : [];

    if (!listId || !selectedEntries.length) {
      void this.router.navigate(['../'], { relativeTo: this.route });
    }

    this.feeStatePatch({ listId, selectedEntries });
  }
}
