/**
 * TODO: arcpoc-816
 * refactor manual subscription + local flags
 * is a good reusable signal pattern candidate to derive from
 */

// TODO: add header comment

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AlertComponent } from '@components/alert/alert.component';
import { CODES_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { ApplicationCodeGetSummaryDto, ApplicationCodesApi } from '@openapi';
import { ApplicationsListEntryForm } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import { CodeRow, fetchCodeRows$ } from '@util/application-code-helpers';

@Component({
  selector: 'app-application-code-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextInputComponent,
    DateInputComponent,
    SortableTableComponent,
    PaginationComponent,
    AlertComponent,
  ],
  templateUrl: './application-codes-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationCodeSearchComponent implements OnInit {
  legend = input('Find an application code');
  codePlaceholder = input('The code for the application');
  titlePlaceholder = input('Enter a concise title for this application');
  patchedFormData = input<ApplicationsListEntryForm | undefined>(undefined);

  // API query params
  pageSize = signal(10);

  // API query response
  totalPages = signal(0);
  currentPage = signal(0);

  selectCodeAndLodgementDate = output<{ code: string; date: string }>();
  resultsChange = output<ApplicationCodeGetSummaryDto[]>();
  resetParentErrors = output<void>();

  private readonly route = inject(ActivatedRoute);
  private readonly codesApi = inject(ApplicationCodesApi);
  private readonly destroyRef = inject(DestroyRef);

  listId!: string | null;
  codesColumns: TableColumn[] = CODES_COLUMNS;
  codesRows: CodeRow[] = [];

  submitted = signal(false);
  loading = signal(false);
  errored = signal(false);

  form = new FormGroup({
    lodgementDate: new FormControl<string | null>(null),
    code: new FormControl<string | null>(null),
    title: new FormControl<string | null>(null),
  });

  ngOnInit(): void {
    this.initialPatchFormData();
    this.submitted.set(false);
    this.listId = this.route.snapshot.paramMap.get('id');

    this.form.controls.code.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        const code = (v ?? '').trim();
        if (!code) {
          this.clear({ emitEvent: false });
        }
      });
  }

  search(): void {
    this.submitted.set(true);
    this.codesRows = [];
    this.errored.set(false);

    const code = this.form.value.code?.trim() ?? '';
    const title = this.form.value.title?.trim() ?? '';

    this.loading.set(true);
    fetchCodeRows$(
      this.codesApi,
      {
        code: code || undefined,
        title: title || undefined,
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
      },
      true,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.codesRows = result.rows;
          this.loading.set(false);
          this.totalPages.set(result.totalPages);
        },
        error: () => {
          this.loading.set(false);
          this.errored.set(true);
        },
      });
  }

  onAddCode(row: CodeRow): void {
    this.submitted.set(false);
    this.codesRows = [];

    if (!this.listId) {
      return;
    }

    const code = (row?.code ?? '').trim();
    if (!code) {
      return;
    }

    const title = (row?.title ?? '').trim();
    if (!title) {
      return;
    }

    this.form.patchValue({ code, title });

    this.selectCodeAndLodgementDate.emit({
      code,
      date: this.form.value.lodgementDate ?? '',
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.search();
  }

  clear(options?: { emitEvent?: boolean }): void {
    this.form.patchValue(
      { code: null, title: null },
      { emitEvent: options?.emitEvent ?? true },
    );
    this.codesRows = [];
    this.errored.set(false);
    this.submitted.set(false);
    this.selectCodeAndLodgementDate.emit({ code: '', date: '' });
    this.resetParentErrors.emit();
    this.totalPages.set(0);
    this.currentPage.set(0);
  }

  private initialPatchFormData(): void {
    // set today's date as the lodgement date by default, formatted as yyyy-MM-dd for the date input
    this.form.patchValue({
      lodgementDate: this.patchedFormData()?.value?.lodgementDate
        ? this.patchedFormData()?.value?.lodgementDate
        : new Date().toISOString().split('T')[0],
      code: this.patchedFormData()?.value?.applicationCode ?? null,
      title: this.patchedFormData()?.value?.applicationTitle ?? null,
    });
  }
}
