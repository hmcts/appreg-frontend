import { CommonModule } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import {
  mapSaToRow,
  standardAppColumns,
} from '@components/standard-applicant-select/util/standard-applicant-select-row-helpers';
import { STANDARD_APPLICANT_SEARCH_ERROR_MESSAGES } from '@components/standard-applicant-select/util/error-messages';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  GetStandardApplicantsRequestParams,
  StandardApplicantsApi,
} from '@openapi';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { ErrorMessageMap, buildFormErrorSummary } from '@util/error-summary';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { toStandardApplicantSortKey } from '@util/standard-applicant-sort-map';
import { StandardApplicantRow } from '@util/types/applications-list-entry/types';

type StandardApplicantsState = {
  hasSearched: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  sortField: { key: string; direction: 'desc' | 'asc' };
  rows: StandardApplicantRow[];
  isLoading: boolean;
  searchErrors: ErrorItem[];
};

const initialStandardApplicantsState: StandardApplicantsState = {
  hasSearched: false,
  currentPage: 0,
  totalPages: 0,
  pageSize: 10,
  sortField: { key: 'code', direction: 'asc' },
  rows: [],
  isLoading: false,
  searchErrors: [],
};

@Component({
  selector: 'app-standard-applicants',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextInputComponent,
    PaginationComponent,
    SortableTableComponent,
    ErrorSummaryComponent,
    MojButtonMenuDirective,
    NotificationBannerComponent,
  ],
  templateUrl: './standard-applicants.component.html',
  styleUrl: './standard-applicants.component.scss',
})
export class StandardApplicants implements OnInit {
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly saApi = inject(StandardApplicantsApi);

  private readonly signalState = createSignalState<StandardApplicantsState>(
    initialStandardApplicantsState,
  );
  readonly vm = this.signalState.vm;

  private readonly loadRequest =
    signal<GetStandardApplicantsRequestParams | null>(null);
  readonly submitted = signal(false);
  private readonly errorMap: ErrorMessageMap =
    STANDARD_APPLICANT_SEARCH_ERROR_MESSAGES;
  onCreateErrorClick = onCreateErrorClickFn;

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

  columns: TableColumn[] = [
    ...standardAppColumns,
    { header: 'Actions', field: 'actions', sortable: false },
  ];

  ngOnInit(): void {
    this.setupEffects();
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    const validationErrors = this.buildErrorSummary();
    this.signalState.patch({ searchErrors: validationErrors });

    if (validationErrors.length) {
      return;
    }

    this.signalState.patch({ hasSearched: true });
    this.loadStandardApplicants(0);
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().searchErrors.find((e) => e.id === id);
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    if (!this.canSearch()) {
      return;
    }

    this.signalState.patch({ sortField: sort });
    this.loadStandardApplicants(0);
  }

  onPageChange(page: number): void {
    if (!this.canSearch()) {
      return;
    }

    this.loadStandardApplicants(page);
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
          this.signalState.patch({
            rows: (page.content ?? []).map((sa) => mapSaToRow(sa)),
            totalPages: page.totalPages ?? 0,
            isLoading: false,
            searchErrors: [],
          });
          this.loadRequest.set(null);
        },
        onError: (err) => {
          this.signalState.patch({
            rows: [],
            totalPages: 0,
            isLoading: false,
            searchErrors: [{ id: 'search', text: getProblemText(err) }],
          });
          this.loadRequest.set(null);
        },
      },
      this.envInjector,
    );
  }

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, this.errorMap);
  }

  private canSearch(): boolean {
    this.form.updateValueAndValidity({ emitEvent: false });

    const validationErrors = this.buildErrorSummary();
    this.signalState.patch({ searchErrors: validationErrors });

    return validationErrors.length === 0;
  }

  private loadStandardApplicants(page: number): void {
    if (this.vm().isLoading) {
      return;
    }

    const code = this.form.controls.code.value.trim();
    const name = this.form.controls.name.value.trim();
    const sort = this.vm().sortField;
    const apiSortKey = toStandardApplicantSortKey(sort.key);

    this.signalState.patch({
      currentPage: page,
      isLoading: true,
      searchErrors: [],
    });

    this.loadRequest.set({
      code: code || undefined,
      name: name || undefined,
      pageNumber: page,
      pageSize: this.vm().pageSize,
      sort: [`${apiSortKey},${sort.direction}`],
    });
  }
}
