import { Location, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { APPLICATIONS_LIST_COLUMNS } from '@components/applications-list/util/applications-list.constants';
import { APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { TableComponent } from '@components/table/table.component';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import {
  ApplicationListEntriesApi,
  MoveApplicationListEntriesRequestParams,
  MoveEntriesDto,
} from '@openapi';
import { getProblemText } from '@util/http-error-to-text';
import { ApplicationListRow } from '@util/types/application-list/types';

type MoveConfirmNavState = {
  entriesToMove?: ApplicationEntriesResultContext[];
  targetList?: ApplicationListRow;
};

@Component({
  selector: 'app-move-confirm',
  imports: [
    ReviewConfirmComponent,
    DateTimePipe,
    TableComponent,
    SortableTableComponent,
  ],
  templateUrl: './move-confirm.component.html',
})
export class MoveConfirmComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appListEntryApi = inject(ApplicationListEntriesApi);

  columns = APPLICATIONS_LIST_COLUMNS;
  columnsEntries = APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS;

  private readonly navState: MoveConfirmNavState | undefined =
    isPlatformBrowser(this.platformId)
      ? (this.location.getState() as MoveConfirmNavState)
      : undefined;

  originalListId = this.route.snapshot.paramMap.get('id');
  targetList: ApplicationListRow | undefined = this.navState?.targetList;
  entriesToMove: ApplicationEntriesResultContext[] =
    this.navState?.entriesToMove ?? [];

  ngOnInit(): void {
    if (
      !this.originalListId ||
      !this.targetList ||
      !this.entriesToMove.length
    ) {
      this.goBack();
    }
  }

  onConfirm(): void {
    const targetList = this.targetList;
    const listId = this.originalListId;

    if (!targetList || !listId || !this.entriesToMove.length) {
      this.goBack();
      return;
    }

    const entriesToMoveIds = [
      ...new Set(this.entriesToMove.map((entry) => entry.id)),
    ];

    const moveParams: MoveEntriesDto = {
      targetListId: targetList.id,
      entryIds: entriesToMoveIds as unknown as Set<string>,
    };

    const params: MoveApplicationListEntriesRequestParams = {
      listId,
      moveEntriesDto: moveParams,
    };

    // POST /application-lists/{listId}/entries/move
    this.appListEntryApi.moveApplicationListEntries(params).subscribe({
      next: () => {
        void this.router.navigate(['/applications-list', this.targetList?.id], {
          queryParams: { moveEntriesSuccessful: true },
        });
      },
      error: (err: unknown) => {
        const errorPayload = getProblemText(err);

        void this.router.navigate(['/applications-list', this.originalListId], {
          queryParams: {
            move: 'error',
          },
          state: {
            moveError: errorPayload,
          },
        });
      },
    });
  }

  goBack(): void {
    const listId = this.originalListId;
    if (!listId) {
      void this.router.navigate(['/applications-list']);
      return;
    }

    void this.router.navigate(['/applications-list', listId, 'move'], {
      state: {
        entriesToMove: this.entriesToMove,
      },
    });
  }
}
