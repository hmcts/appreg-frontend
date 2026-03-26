import { Location, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { APPLICATIONS_LIST_COLUMNS } from '@components/applications-list/util/applications-list.constants';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { TableComponent } from '@components/table/table.component';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import { ApplicationListRow } from '@util/types/application-list/types';

type MoveConfirmNavState = {
  entriesToMove?: ApplicationEntriesResultContext[];
  targetList?: ApplicationListRow;
};

@Component({
  selector: 'app-move-confirm',
  imports: [ReviewConfirmComponent, DateTimePipe, TableComponent],
  templateUrl: './move-confirm.component.html',
  styleUrl: './move-confirm.component.scss',
})
export class MoveConfirmComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);

  columns = APPLICATIONS_LIST_COLUMNS;

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
    // TODO: run POST /application-lists/{listId}/entries/move
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
