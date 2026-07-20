import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BulkUpdateFeeState, initialBulkUpdateFeeState } from './util';

import { AlertComponent } from '@components/alert/alert.component';
import {
  APPLICATION_ENTRIES_MOVE_COLUMNS,
  CIVIL_FEE_COLUMNS,
  FEE_STATUS_OPTIONS,
} from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { ApplicationEntriesBaseContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  CivilFeeForm,
  CivilFeeSectionComponent,
} from '@components/civil-fee-section/civil-fee-section.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { CivilFeeHelpComponent } from '@components/help-details/civil-fee-help.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { FeeStatus } from '@openapi';
import {
  AddFeeDetailsPayload,
  CivilFeeMeta,
} from '@shared-types/civil-fee/civil-fee';
import { collectChildSubmitErrors } from '@util/child-submit-validation';
import {
  readPaymentRefReturnState,
  updateFeeStatusesControl,
  updatePaymentReferenceInFeeStatusesControl,
} from '@util/civil-fee-utils';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { createSignalState } from '@util/signal-state-helpers';
import { sortRows } from '@util/table-sort';

type BulkUpdateFeeSnapshot = {
  listId?: string;
  selectedEntries?: ApplicationEntriesBaseContext[];
  feeForm?: unknown;
  feeMeta?: CivilFeeMeta | null;
  submitted?: boolean;
  feeErrors?: ErrorItem[];
};

@Component({
  selector: 'app-applications-list-detail-bulk-update-fees',
  standalone: true,
  imports: [
    BreadcrumbsComponent,
    ErrorSummaryComponent,
    SortableTableComponent,
    CivilFeeSectionComponent,
    AlertComponent,
    CivilFeeHelpComponent,
    PaginationComponent,
  ],
  templateUrl: './applications-list-detail-bulk-update-fees.component.html',
})
export class ApplicationsListDetailBulkUpdateFeesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  // Initialise signal state
  private readonly bulkFeeUpdateSignalState =
    createSignalState<BulkUpdateFeeState>(initialBulkUpdateFeeState);
  private readonly feeStatePatch = this.bulkFeeUpdateSignalState.patch;
  readonly vm = this.bulkFeeUpdateSignalState.vm;

  private readonly pageSize = 10;

  // Reuse columns from another page
  columnsEntries = APPLICATION_ENTRIES_MOVE_COLUMNS;

  // Civil fee
  civilFeeColumns = CIVIL_FEE_COLUMNS;
  feeStatusOptions = FEE_STATUS_OPTIONS;
  feeMeta: CivilFeeMeta | null = null;
  civilFeeForm: CivilFeeForm = new FormGroup({
    hasOffsiteFee: new FormControl<boolean | null>(null),
    feeStatus: new FormControl<string | null>(null),
    feeStatusDate: new FormControl<string | null>(null),
    paymentRef: new FormControl<string | null>(null),
    feeStatuses: new FormControl<FeeStatus[] | null>(null),
  });

  readonly currentPage = signal(0);
  readonly totalPages = computed(() =>
    Math.ceil(this.vm().selectedEntries.length / this.pageSize),
  );

  readonly feeSort = signal<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc',
  });

  showPagination = computed(
    () => this.vm().selectedEntries.length > this.pageSize,
  );

  readonly sortedRows = computed(() => {
    const { key, direction } = this.feeSort();
    const rows = this.vm().selectedEntries;
    return key ? sortRows(rows, { key, direction }) : rows;
  });

  readonly paginatedRows = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.sortedRows().slice(start, start + this.pageSize);
  });

  @ViewChild('civilFeeSection')
  private readonly civilFeeSection?: CivilFeeSectionComponent;

  applictionsHaveBeenRemoved = signal(false);
  readonly submitAttempt = signal(0);

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
      return;
    }

    // If we have filtered out applications then display an info banner
    const removedApplications = isPlatformBrowser(this.platformId)
      ? ((
          history.state as {
            removedApplicationsWarning?: boolean;
          }
        )?.removedApplicationsWarning ?? false)
      : false;

    this.applictionsHaveBeenRemoved.set(removedApplications);

    this.feeStatePatch({ listId, selectedEntries });
    this.restoreNavigationState();
  }

  onAddFeeDetails(payload: AddFeeDetailsPayload): void {
    updateFeeStatusesControl(this.civilFeeForm.controls.feeStatuses, payload);
    this.feeStatePatch({ feeErrors: [] });
  }

  onOffsiteFeeChanged(nextValue: boolean): void {
    this.civilFeeForm.controls.hasOffsiteFee.setValue(nextValue, {
      emitEvent: false,
    });
    this.civilFeeForm.controls.hasOffsiteFee.markAsDirty();
  }

  onCivilFeeErrors(errors: ErrorItem[]): void {
    this.feeStatePatch({ feeErrors: errors ?? [] });
  }

  onCivilFeeSubmitAttempt(): void {
    this.submitAttempt.update((attempt) => attempt + 1);
  }

  addFees(): void {
    this.submitAttempt.update((attempt) => attempt + 1);
    this.feeStatePatch({ submitted: true, feeErrors: [] });
    this.validateChildSectionsForSubmit();

    if (this.vm().feeErrors.length > 0) {
      return;
    }

    const formFeeStatuses = this.civilFeeForm.value.feeStatuses;
    const isOffSiteFee = this.civilFeeForm.value.hasOffsiteFee;

    void this.router.navigate(
      ['/applications-list', this.vm().listId, 'bulk-update-fee', 'confirm'],
      {
        state: {
          selectedEntries: this.vm().selectedEntries,
          feeTable: formFeeStatuses,
          isOffSiteFee,
        },
      },
    );
  }

  buildChangePaymentReferenceState = (): Record<string, unknown> => ({
    entriesToUpdateFee: this.vm().selectedEntries,
    bulkUpdateFeeSnapshot: this.buildBulkUpdateFeeSnapshot(),
  });

  disableUpdateButton(): boolean {
    return (this.civilFeeForm.value.feeStatuses?.length ?? 0) === 0;
  }

  informationText(): string {
    return this.vm().selectedEntries.length === 1 ? 'entry' : 'entries';
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.feeSort.set(sort);
    this.currentPage.set(0);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  private validateChildSectionsForSubmit(): void {
    const submitErrors = collectChildSubmitErrors([
      { source: 'civilFee', section: this.civilFeeSection },
    ]);

    this.feeStatePatch({
      feeErrors: submitErrors.civilFee ?? [],
    });
  }

  private restoreNavigationState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const state = history.state as Record<string, unknown> | null;
    if (state === null || typeof state !== 'object') {
      return;
    }

    const snapshot = state['bulkUpdateFeeSnapshot'];
    if (snapshot && typeof snapshot === 'object') {
      this.applyBulkUpdateFeeSnapshot(snapshot);
    }

    const paymentRefReturn = readPaymentRefReturnState(
      state['paymentRefReturn'],
    );
    if (paymentRefReturn) {
      updatePaymentReferenceInFeeStatusesControl(
        this.civilFeeForm.controls.feeStatuses,
        paymentRefReturn.updatedRowId,
        paymentRefReturn.newPaymentReference,
      );
    }
  }

  private buildBulkUpdateFeeSnapshot(): BulkUpdateFeeSnapshot {
    return {
      listId: this.vm().listId,
      selectedEntries: this.vm().selectedEntries,
      feeForm: this.civilFeeForm.getRawValue(),
      feeMeta: this.feeMeta,
      submitted: this.vm().submitted,
      feeErrors: this.vm().feeErrors,
    };
  }

  private applyBulkUpdateFeeSnapshot(snapshot: BulkUpdateFeeSnapshot): void {
    this.feeStatePatch({
      listId: snapshot.listId ?? this.vm().listId,
      selectedEntries: snapshot.selectedEntries ?? this.vm().selectedEntries,
    });

    if (snapshot.feeForm && typeof snapshot.feeForm === 'object') {
      this.civilFeeForm.patchValue(snapshot.feeForm, { emitEvent: false });
    }

    this.feeMeta = snapshot.feeMeta ?? this.feeMeta;
    this.feeStatePatch({
      submitted: snapshot.submitted === true,
      feeErrors: Array.isArray(snapshot.feeErrors)
        ? snapshot.feeErrors
        : this.vm().feeErrors,
    });
  }
}
