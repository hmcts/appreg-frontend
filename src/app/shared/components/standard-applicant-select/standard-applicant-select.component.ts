/**
 * Standard Applicant table selection
 */

import { CommonModule } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import {
  mapSaToRow,
  standardAppColumns,
} from './util/standard-applicant-select-row-helpers';
import {
  StandardApplicantSelectPagingState,
  initialStandardApplicantSelectPagingState,
} from './util/standard-applicant-select.state';

import { PaginationComponent } from '@components/pagination/pagination.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { StandardApplicantsApi } from '@openapi';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { StandardApplicantRow } from '@util/types/applications-list-entry/types';

@Component({
  selector: 'app-standard-applicant-select',
  standalone: true,
  imports: [CommonModule, SortableTableComponent, PaginationComponent],
  templateUrl: './standard-applicant-select.component.html',
})
export class StandardApplicantSelectComponent implements OnInit, OnChanges {
  private readonly saApi = inject(StandardApplicantsApi);
  private readonly envInjector = inject(EnvironmentInjector);

  selectedCode = input<string | null>(null);
  readonly selectedCodeChange = output<string | null>();

  rows: StandardApplicantRow[] = [];

  readonly columns: TableColumn[] = standardAppColumns;

  // Paging
  private readonly saSignalState =
    createSignalState<StandardApplicantSelectPagingState>(
      initialStandardApplicantSelectPagingState,
    );
  private readonly saState = this.saSignalState.state;
  readonly vm = this.saSignalState.vm;

  private readonly loadRequest = signal<{
    pageNumber: number;
    pageSize: number;
  } | null>(null);

  // Selection for the table
  selectedIds: Set<string> = new Set<string>();

  ngOnInit(): void {
    this.syncSelectedIdsFromCode();
    this.setupEffects();
    this.loadPage(0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedCode' in changes) {
      this.syncSelectedIdsFromCode();
    }
  }

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;

    const first = ids.values().next().value;
    const code = first ?? null;

    if (code !== this.selectedCode()) {
      this.selectedCodeChange.emit(code);
    }
  }

  onPageChange(page: number): void {
    this.loadPage(page);
  }

  private setupEffects(): void {
    setupLoadEffect(
      {
        request: this.loadRequest,
        load: (params) =>
          this.saApi.getStandardApplicants(params, 'body', false, {
            transferCache: true,
          }),
        onSuccess: (page) => {
          const content = page.content ?? [];
          this.rows = content.map((sa) => mapSaToRow(sa));

          this.saSignalState.patch({
            totalPages: page.totalPages,
            loading: false,
          });

          // Keep selection consistent when page changes
          this.syncSelectedIdsFromCode();

          this.loadRequest.set(null);
        },
        onError: () => {
          this.rows = [];
          this.saSignalState.patch({ totalPages: 0, loading: false });
          this.loadRequest.set(null);
        },
      },
      this.envInjector,
    );
  }

  private loadPage(page: number): void {
    if (this.saState().loading) {
      return;
    }

    this.saSignalState.patch({ loading: true, pageIndex: page });

    const pageSize = this.saState().pageSize;

    this.loadRequest.set({ pageNumber: this.saState().pageIndex, pageSize });
  }

  private syncSelectedIdsFromCode(): void {
    const code = this.selectedCode();
    if (code) {
      this.selectedIds = new Set<string>([code]);
    } else {
      this.selectedIds = new Set<string>();
    }
  }
}
