import { Location, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { APPLICATION_ENTRIES_MOVE_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { PaginationComponent } from '@components/pagination/pagination.component';
import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { TableComponent } from '@components/table/table.component';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import {
  ApplicationListEntriesApi,
  BulkFeeDetailsDto,
  BulkFeesUpdateDto,
  BulkUpdateApplicationListEntryFeesRequestParams,
  FeeStatus,
} from '@openapi';
import { getProblemText } from '@util/http-error-to-text';
import { sortRows } from '@util/table-sort';

type UpdateFeeState = {
  selectedEntries: [];
  feeTable: FeeStatus[];
  isOffSiteFee: boolean;
};

type FeeTableRow = {
  paymentStatus: string;
  statusDate: string;
  paymentReference: string;
};

@Component({
  selector: 'app-fee-update-confirm',
  imports: [
    ReviewConfirmComponent,
    TableComponent,
    SortableTableComponent,
    PaginationComponent,
  ],
  templateUrl: './fee-update-confirm.component.html',
})
export class FeeUpdateConfirmComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dateTimePipe = inject(DateTimePipe);
  private readonly appListEntryApi = inject(ApplicationListEntriesApi);

  columnsEntries = APPLICATION_ENTRIES_MOVE_COLUMNS;
  feeTableColumns = [
    { header: 'Fee Status', field: 'paymentStatus' },
    { header: 'Status Date', field: 'statusDate' },
    { header: 'Payment Ref', field: 'paymentReference' },
  ];

  private readonly navState: UpdateFeeState | undefined = isPlatformBrowser(
    this.platformId,
  )
    ? (this.location.getState() as UpdateFeeState)
    : undefined;

  listId = this.route.snapshot.paramMap.get('id');
  selectedEntries = this.navState?.selectedEntries ?? [];
  feeStatuses = this.navState?.feeTable ?? [];
  isOffSiteFee = this.navState?.isOffSiteFee ?? false;

  private readonly pageSize = 10;
  readonly currentPage = signal(0);
  readonly totalPages = computed(() =>
    Math.ceil(this.selectedEntries.length / this.pageSize),
  );

  readonly feeSort = signal<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc',
  });

  showPagination = computed(() => this.selectedEntries.length > this.pageSize);

  readonly sortedRows = computed(() => {
    const { key, direction } = this.feeSort();
    const rows = this.selectedEntries;
    return key ? sortRows(rows, { key, direction }) : rows;
  });

  readonly paginatedRows = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.sortedRows().slice(start, start + this.pageSize);
  });

  get feeTableRows(): FeeTableRow[] {
    return this.feeStatuses.map((feeStatus) => ({
      paymentStatus: feeStatus.paymentStatus,
      statusDate:
        this.dateTimePipe.transform(feeStatus.statusDate, 'mediumDate') ??
        feeStatus.statusDate,
      paymentReference: feeStatus.paymentReference ?? '',
    }));
  }

  ngOnInit(): void {
    if (!this.listId || !this.selectedEntries.length) {
      this.goBack();
    }
  }

  onConfirm(): void {
    const listId = this.listId;

    if (
      !listId ||
      !this.selectedEntries.length ||
      (!this.feeStatuses.length && !this.isOffSiteFee)
    ) {
      this.goBack();
      return;
    }

    const bulkFeesUpdateDto = this.buildBulkUpdateFeesPayload(
      this.feeStatuses,
      this.selectedEntries,
      this.isOffSiteFee,
    );

    const params: BulkUpdateApplicationListEntryFeesRequestParams = {
      listId,
      bulkFeesUpdateDto,
    };

    this.appListEntryApi.bulkUpdateApplicationListEntryFees(params).subscribe({
      next: () => {
        void this.router.navigate(['/applications-list', listId], {
          queryParams: { bulkFeeUpdateSuccessful: true },
        });
      },
      error: (err) => {
        const errorPayload = getProblemText(err);

        void this.router.navigate(['/applications-list', this.listId], {
          queryParams: {
            updateFee: 'error',
          },
          state: {
            updateFeeError: errorPayload,
          },
        });
      },
    });
  }

  goBack(): void {
    const listId = this.listId;
    if (!listId) {
      void this.router.navigate(['/applications-list']);
      return;
    }

    void this.router.navigate(
      ['/applications-list', listId, 'bulk-update-fee'],
      {
        state: {
          entriesToUpdateFee: this.selectedEntries,
          bulkUpdateFeeSnapshot: {
            listId,
            selectedEntries: this.selectedEntries,
            feeForm: {
              feeStatuses: this.feeStatuses,
              hasOffsiteFee: this.isOffSiteFee,
            },
          },
        },
      },
    );
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.feeSort.set(sort);
    this.currentPage.set(0);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  private buildBulkUpdateFeesPayload(
    fees: FeeStatus[],
    entries: { id: string }[],
    isOffSiteFee: boolean,
  ): BulkFeesUpdateDto {
    const entryIds = [
      ...new Set(entries.map((entry) => entry.id)),
    ] as unknown as Set<string>;

    const feeStatuses: BulkFeeDetailsDto[] = fees.map((feeStatus) => ({
      paymentStatus: feeStatus.paymentStatus,
      statusDate: feeStatus.statusDate,
      paymentReference: feeStatus.paymentReference ?? undefined,
    }));

    return {
      entryIds,
      ...(feeStatuses.length > 0 && { feeDetails: feeStatuses }),
      ...(isOffSiteFee && {
        hasOffsiteFee: isOffSiteFee,
      }),
    };
  }
}
