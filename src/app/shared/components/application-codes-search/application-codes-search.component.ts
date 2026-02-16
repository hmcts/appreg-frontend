/**
 * TODO: arcpoc-816
 * refactor manual subscription + local flags
 * is a good reusable signal pattern candidate to derive from
 */

// TODO: add header comment

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { CODES_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
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
    NotificationBannerComponent,
    TextInputComponent,
    DateInputComponent,
    SortableTableComponent,
  ],
  templateUrl: './application-codes-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationCodeSearchComponent implements OnInit {
  @Input() legend = 'Find an application code';
  @Input() codePlaceholder = 'The code for the application';
  @Input() titlePlaceholder = 'Enter a concise title for this application';
  @Input() mode: 'create' | 'update' = 'create';
  @Input() patchedFormData?: ApplicationsListEntryForm;

  @Input() appListId?: string;

  private readonly route = inject(ActivatedRoute);

  // Emit row
  @Output() selectCodeAndLodgementDate = new EventEmitter<{
    code: string;
    date: string;
  }>();
  // Emit latest result set after each search
  @Output() resultsChange = new EventEmitter<ApplicationCodeGetSummaryDto[]>();
  private readonly destroyRef = inject(DestroyRef);
  listId!: string | null;

  submitted: boolean = false;
  codesColumns: TableColumn[] = CODES_COLUMNS;
  codesRows: CodeRow[] = [];

  form = new FormGroup({
    lodgementDate: new FormControl<string | null>(null),
    code: new FormControl<string | null>(null),
    title: new FormControl<string | null>(null),
  });

  loading = false;
  errored = false;

  constructor(
    private readonly codesApi: ApplicationCodesApi,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initialPatchFormData();
    this.submitted = false;
    this.listId = this.route.snapshot.paramMap.get('id');
  }

  search(): void {
    this.submitted = true;
    this.codesRows = [];
    this.errored = false;

    const code = this.form.value.code?.trim() ?? '';
    const title = this.form.value.title?.trim() ?? '';

    this.loading = true;
    fetchCodeRows$(
      this.codesApi,
      {
        code: code || undefined,
        title: title || undefined,
        pageNumber: 0,
        pageSize: 10,
      },
      true,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.codesRows = rows;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
          // this.applyMappedError(err);
        },
      });
  }

  onAddCode(row: CodeRow): void {
    this.submitted = false;
    this.codesRows = [];
    this.form.patchValue({ code: row.code, title: row.title });
    if (!this.listId) {
      return;
    }

    const code = (row?.code ?? '').trim();
    if (!code) {
      return;
    }

    this.selectCodeAndLodgementDate.emit({
      code,
      date: this.form.value.lodgementDate ?? '',
    });
  }

  clear(): void {
    this.form.patchValue({ code: null, title: null });
    this.codesRows = [];
    this.errored = false;
    this.cdr.markForCheck();
    this.submitted = false;
    this.selectCodeAndLodgementDate.emit({ code: '', date: '' });
  }

  private initialPatchFormData(): void {
    // set today's date as the lodgement date by default, formatted as yyyy-MM-dd for the date input
    this.form.patchValue({
      lodgementDate: this.patchedFormData?.value?.lodgementDate
        ? this.patchedFormData?.value?.lodgementDate
        : new Date().toISOString().split('T')[0],
      code: this.patchedFormData?.value?.applicationCode ?? null,
      title: this.patchedFormData?.value?.applicationTitle ?? null,
    });
  }
}
