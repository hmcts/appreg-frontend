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
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  mapSaToRow,
  standardAppColumns,
} from './util/standard-applicant-select-row-helpers';
import { STANDARD_APPLICANT_SEARCH_ERROR_MESSAGES } from './util/error-messages';
import {
  StandardApplicantSelectPagingState,
  initialStandardApplicantSelectPagingState,
} from './util/standard-applicant-select.state';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { StandardApplicantsApi } from '@openapi';
import { ErrorMessageMap, buildFormErrorSummary } from '@util/error-summary';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { toStandardApplicantSortKey } from '@util/standard-applicant-sort-map';
import { StandardApplicantRow } from '@util/types/applications-list-entry/types';

export type SelectedStandardApplicantSummary = {
  code: string;
  name: string;
};

@Component({
  selector: 'app-standard-applicant-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextInputComponent,
    SortableTableComponent,
    PaginationComponent,
  ],
  templateUrl: './standard-applicant-select.component.html',
})
export class StandardApplicantSelectComponent implements OnInit, OnChanges {
  private readonly saApi = inject(StandardApplicantsApi);
  private readonly envInjector = inject(EnvironmentInjector);

  selectedCode = input<string | null>(null);
  readonly selectedCodeChange = output<string | null>();
  readonly selectedApplicantSummaryChange =
    output<SelectedStandardApplicantSummary | null>();
  readonly searchErrorsChange = output<ErrorItem[]>();

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
    code?: string;
    name?: string;
    pageNumber: number;
    pageSize: number;
    sort: string[];
  } | null>(null);
  readonly submitted = signal(false);
  private readonly errorMap: ErrorMessageMap =
    STANDARD_APPLICANT_SEARCH_ERROR_MESSAGES;

  form = new FormGroup({
    code: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(10)],
    }),
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
  });

  // Selection for the table
  selectedIds: Set<string> = new Set<string>();

  ngOnInit(): void {
    this.syncSelectedIdsFromCode();
    this.setupEffects();
    this.saSignalState.patch({ hasSearched: true });
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
    const selectedRow =
      code === null
        ? null
        : (this.rows.find((row) => row.code === code) ?? null);

    if (code !== this.selectedCode()) {
      this.selectedCodeChange.emit(code);
    }

    this.selectedApplicantSummaryChange.emit(
      selectedRow
        ? {
            code: selectedRow.code ?? '',
            name: selectedRow.name ?? '',
          }
        : null,
    );
  }

  onPageChange(page: number): void {
    if (!this.saState().hasSearched) {
      return;
    }
    if (!this.canLoadPage()) {
      return;
    }
    this.loadPage(page);
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    if (!this.saState().hasSearched) {
      return;
    }
    if (!this.canLoadPage()) {
      return;
    }
    this.saSignalState.patch({ sortField: sort });
    this.loadPage(0);
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    const validationErrors = this.buildErrorSummary();
    this.saSignalState.patch({ searchErrors: validationErrors });
    this.searchErrorsChange.emit(validationErrors);

    if (validationErrors.length) {
      return;
    }

    this.saSignalState.patch({ hasSearched: true });
    this.loadPage(0);
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().searchErrors.find((e) => e.id === id);
  }

  private canLoadPage(): boolean {
    this.form.updateValueAndValidity({ emitEvent: false });

    const validationErrors = this.buildErrorSummary();
    this.saSignalState.patch({ searchErrors: validationErrors });
    this.searchErrorsChange.emit(validationErrors);

    return validationErrors.length === 0;
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
            searchErrors: [],
          });
          this.searchErrorsChange.emit([]);

          // Keep selection consistent when page changes
          this.syncSelectedIdsFromCode();

          this.loadRequest.set(null);
        },
        onError: () => {
          this.rows = [];
          this.saSignalState.patch({
            totalPages: 0,
            loading: false,
            searchErrors: [],
          });
          this.searchErrorsChange.emit([]);
          this.loadRequest.set(null);
        },
      },
      this.envInjector,
    );
  }

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, this.errorMap, {
      hrefs: {
        code: '#standard-applicant-code',
        name: '#standard-applicant-name',
      },
    });
  }

  private loadPage(page: number): void {
    if (this.saState().loading) {
      return;
    }

    this.saSignalState.patch({ loading: true, pageIndex: page });

    const pageSize = this.saState().pageSize;
    const sort = this.saState().sortField;
    const apiSortKey = toStandardApplicantSortKey(sort.key);
    const code = this.form.controls.code.value.trim();
    const name = this.form.controls.name.value.trim();

    this.loadRequest.set({
      code: code || undefined,
      name: name || undefined,
      pageNumber: this.saState().pageIndex,
      pageSize,
      sort: [`${apiSortKey},${sort.direction}`],
    });
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
