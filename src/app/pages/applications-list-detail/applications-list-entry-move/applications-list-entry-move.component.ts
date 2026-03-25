import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ApplicationsListEntryMoveState,
  initialApplicationsListEntryMoveState,
} from './util';

import { APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { ApplicationListRecordsService } from '@services/applications-list/application-list-records.service';
import { createSignalState } from '@util/signal-state-helpers';

@Component({
  selector: 'app-applications-list-entry-move',
  imports: [BreadcrumbsComponent, SortableTableComponent, PageHeaderComponent],
  templateUrl: './applications-list-entry-move.component.html',
  styleUrl: './applications-list-entry-move.component.scss',
})
export class ApplicationsListEntryMoveComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Initialise signal state
  private readonly moveEntrySignalState =
    createSignalState<ApplicationsListEntryMoveState>(
      initialApplicationsListEntryMoveState,
    );
  private readonly moveEntryState = this.moveEntrySignalState.state;
  private readonly moveEntryPatch = this.moveEntrySignalState.patch;
  readonly vm = this.moveEntrySignalState.vm;

  private readonly storedRecordsState = inject(ApplicationListRecordsService);
  readonly storedRecordsVm = this.storedRecordsState.vm;

  columns = APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS;

  ngOnInit(): void {
    this.moveEntryPatch({
      listId: this.route.snapshot.paramMap.get('id') ?? undefined,
    });

    this.moveEntryPatch({
      selectedEntries:
        (
          history.state as {
            entriesToMove?: ApplicationEntriesResultContext[];
          }
        )?.entriesToMove ?? [],
    });

    if (
      !this.moveEntryState().listId ||
      !this.moveEntryState().selectedEntries.length
    ) {
      void this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}
