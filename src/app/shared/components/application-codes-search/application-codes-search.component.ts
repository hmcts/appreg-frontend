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
  legend = input('Find an application code');
  codePlaceholder = input('The code for the application');
  titlePlaceholder = input('Enter a concise title for this application');
  patchedFormData = input<ApplicationsListEntryForm | undefined>(undefined);

  selectCodeAndLodgementDate = output<{ code: string; date: string }>();
  resultsChange = output<ApplicationCodeGetSummaryDto[]>();

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
        pageNumber: 0,
        pageSize: 10,
      },
      true,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.codesRows = rows;
          this.loading.set(false);
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

  clear(): void {
    this.form.patchValue({ code: null, title: null });
    this.codesRows = [];
    this.errored.set(false);
    this.submitted.set(false);
    this.selectCodeAndLodgementDate.emit({ code: '', date: '' });
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
