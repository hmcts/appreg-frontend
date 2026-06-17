import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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
import { STANDARD_APPLICANT_SEARCH_ERROR_MESSAGES } from '@components/standard-applicant-select/util/error-messages';
import {
  mapSaToRow,
  standardAppColumns,
} from '@components/standard-applicant-select/util/standard-applicant-select-row-helpers';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  GetStandardApplicantsRequestParams,
  StandardApplicantsApi,
} from '@openapi';
import { StandardApplicantsSearchFormService } from '@services/standard-applicants/standard-applicants-search-form.service';
import { StandardApplicantsSearchStateService } from '@services/standard-applicants/standard-applicants-search-state.service';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { ErrorMessageMap, buildFormErrorSummary } from '@util/error-summary';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { toStandardApplicantSortKey } from '@util/standard-applicant-sort-map';
import { StandardApplicantRow } from '@util/types/applications-list-entry/types';

export type StandardApplicantFilters = Pick<
  GetStandardApplicantsRequestParams,
  'code' | 'name'
>;

export type StandardApplicantsState = {
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly searchForm = inject(StandardApplicantsSearchFormService);
  private readonly searchState = inject(StandardApplicantsSearchStateService);

  private readonly signalState = createSignalState<StandardApplicantsState>(
    initialStandardApplicantsState,
  );
  readonly vm = this.signalState.vm;

  private readonly loadRequest =
    signal<GetStandardApplicantsRequestParams | null>(null);
  readonly submitted = signal(false);
  private readonly errorMap: ErrorMessageMap =
    STANDARD_APPLICANT_SEARCH_ERROR_MESSAGES;
  private appliedFilters: StandardApplicantFilters = {};
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

  preserveErrOnLoad = signal(false);

  ngOnInit(): void {
    this.setupEffects();
    this.signalState.patch(initialStandardApplicantsState);
    this.restoreSearchState();
    this.setLoadErrorFromNavigation();

    if (this.vm().hasSearched) {
      this.loadStandardApplicants(this.vm().currentPage, this.appliedFilters);
    }
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    const validationErrors = this.buildErrorSummary();
    this.signalState.patch({ searchErrors: validationErrors });
    this.persistFormState();

    if (validationErrors.length) {
      return;
    }

    this.appliedFilters = this.getTrimmedFilters();
    this.signalState.patch({ hasSearched: true, currentPage: 0 });
    this.persistSearchState();
    this.loadStandardApplicants(0, this.appliedFilters);
  }

  async onViewClick(row: StandardApplicantRow): Promise<void> {
    this.signalState.patch({
      searchErrors: [],
    });

    if (!row.code) {
      this.signalState.patch({
        searchErrors: [
          { text: 'Failed to load standard applicant. No code found' },
        ],
      });
      return;
    }

    this.persistSearchState();

    await this.router.navigate([row.code], {
      relativeTo: this.route,
      state: row,
    });
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().searchErrors.find((e) => e.id === id);
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    if (!this.vm().hasSearched) {
      return;
    }

    this.signalState.patch({ sortField: sort, currentPage: 0 });
    this.persistSearchState();
    this.preserveErrOnLoad.set(false);
    this.loadStandardApplicants(0);
  }

  onPageChange(page: number): void {
    if (!this.vm().hasSearched || this.vm().isLoading) {
      return;
    }

    this.signalState.patch({ currentPage: page });
    this.persistSearchState();
    this.preserveErrOnLoad.set(false);
    this.loadStandardApplicants(page);
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.searchState.reset();
    this.loadRequest.set(null);
    this.form.reset();
    this.appliedFilters = {};
    this.signalState.patch({
      hasSearched: false,
      currentPage: 0,
      totalPages: 0,
      rows: [],
      isLoading: false,
      searchErrors: [],
    });
    this.preserveErrOnLoad.set(false);
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
          });
          this.persistSearchState();
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

  private restoreSearchState(): void {
    this.form.patchValue(this.searchForm.state(), { emitEvent: false });

    const storedState = this.searchState.state();

    this.appliedFilters = { ...storedState.appliedFilters };
    this.signalState.patch({
      hasSearched: storedState.hasSearched,
      currentPage: storedState.currentPage,
      pageSize: storedState.pageSize,
      sortField: { ...storedState.sortField },
    });
  }

  private persistSearchState(): void {
    this.persistFormState();
    this.searchState.setState({
      hasSearched: this.vm().hasSearched,
      currentPage: this.vm().currentPage,
      pageSize: this.vm().pageSize,
      sortField: { ...this.vm().sortField },
      appliedFilters: { ...this.appliedFilters },
    });
  }

  private persistFormState(): void {
    this.searchForm.setState({
      code: this.form.controls.code.value,
      name: this.form.controls.name.value,
    });
  }

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, this.errorMap);
  }

  private getTrimmedFilters(): StandardApplicantFilters {
    const code = this.form.controls.code.value.trim();
    const name = this.form.controls.name.value.trim();

    return {
      code: code || undefined,
      name: name || undefined,
    };
  }

  private loadStandardApplicants(
    page: number,
    filters: StandardApplicantFilters = this.appliedFilters,
  ): void {
    if (this.vm().isLoading) {
      return;
    }

    const sort = this.vm().sortField;
    const apiSortKey = toStandardApplicantSortKey(sort.key);

    this.signalState.patch({
      currentPage: page,
      isLoading: true,
      searchErrors: this.preserveErrOnLoad() ? this.vm().searchErrors : [], // Keep on load error if present
    });

    this.loadRequest.set({
      code: filters.code,
      name: filters.name,
      pageNumber: page,
      pageSize: this.vm().pageSize,
      sort: [`${apiSortKey},${sort.direction}`],
    });
  }

  private setLoadErrorFromNavigation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const errorExists =
      this.route.snapshot.queryParamMap.get('applicantDetailFailedToLoad') ===
      'error';
    const state = history.state as { loadError?: string } | null;
    const errMsg = state?.loadError;

    if (!errorExists || !errMsg) {
      return;
    }

    this.preserveErrOnLoad.set(true);
    this.signalState.patch({
      searchErrors: [{ text: errMsg }],
    });
  }
}
