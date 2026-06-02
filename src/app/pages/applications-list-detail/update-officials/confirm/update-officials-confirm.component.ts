import { Location, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  UpdateOfficialsApplication,
  UpdateOfficialsNavState,
} from '../update-officials.types';

import {
  APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS,
  PERSON_TITLE_OPTIONS,
} from '@components/applications-list-entry-detail/util/entry-detail.constants';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import {
  ApplicationListEntriesApi,
  BulkOfficialsUpdateDto,
  Official,
  OfficialType,
} from '@openapi';
import {
  focusErrorSummary,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getProblemText } from '@util/http-error-to-text';

type OfficialSummaryRow = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-update-officials-confirm',
  imports: [
    ErrorSummaryComponent,
    ReviewConfirmComponent,
    SortableTableComponent,
  ],
  templateUrl: './update-officials-confirm.component.html',
})
export class UpdateOfficialsConfirmComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly entriesApi = inject(ApplicationListEntriesApi);

  readonly columns = APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS;
  readonly errorSummary = signal<ErrorItem[]>([]);
  readonly isSubmitting = signal(false);
  readonly onCreateErrorClick = onCreateErrorClickFn;

  private readonly titleLabels = new Map(
    PERSON_TITLE_OPTIONS.map((option) => [option.value, option.label]),
  );

  listId = this.route.snapshot.paramMap.get('id') ?? '';
  rows: UpdateOfficialsApplication[] = [];
  officials: Official[] = [];
  officialRows: OfficialSummaryRow[] = [];
  officialFormValue: UpdateOfficialsNavState['officialFormValue'];

  ngOnInit(): void {
    const navState = isPlatformBrowser(this.platformId)
      ? (this.location.getState() as UpdateOfficialsNavState)
      : undefined;

    this.rows = navState?.updateOfficialsApplications ?? [];
    this.officials = navState?.officials ?? [];
    this.officialFormValue = navState?.officialFormValue;
    this.officialRows = this.buildOfficialRows(this.officials);

    if (!this.listId || !this.rows.length || !this.officials.length) {
      this.goBack();
    }
  }

  onConfirm(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (!this.listId || !this.rows.length || !this.officials.length) {
      this.goBack();
      return;
    }

    this.errorSummary.set([]);
    this.isSubmitting.set(true);

    const entryIds = [...new Set(this.rows.map((row) => row.id))];

    this.entriesApi
      .replaceApplicationListEntryOfficials({
        listId: this.listId,
        bulkOfficialsUpdateDto: {
          entryIds: entryIds as unknown as BulkOfficialsUpdateDto['entryIds'],
          officials: this.officials,
        },
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/applications-list', this.listId], {
            queryParams: { updateOfficialsSuccessful: true },
          });
        },
        error: (err: unknown) => {
          this.errorSummary.set([{ text: getProblemText(err) }]);
          focusErrorSummary(this.platformId);
        },
      });
  }

  goBack(): void {
    if (!this.listId) {
      void this.router.navigate(['/applications-list']);
      return;
    }

    void this.router.navigate(
      ['/applications-list', this.listId, 'update-officials'],
      {
        state: {
          updateOfficialsApplications: this.rows,
          officialFormValue: this.officialFormValue,
        } satisfies UpdateOfficialsNavState,
      },
    );
  }

  private buildOfficialRows(officials: Official[]): OfficialSummaryRow[] {
    let magistrateCount = 0;

    return officials.map((official) => {
      if (official.type === OfficialType.MAGISTRATE) {
        magistrateCount += 1;
        return {
          label: `Magistrate ${magistrateCount}`,
          value: this.formatOfficialName(official),
        };
      }

      return {
        label: 'Court official',
        value: this.formatOfficialName(official),
      };
    });
  }

  private formatOfficialName(official: Official): string {
    const title = official.title
      ? (this.titleLabels.get(official.title) ?? official.title)
      : undefined;

    return [title, official.forename, official.surname]
      .filter((part): part is string => !!part?.trim())
      .join(' ');
  }
}
