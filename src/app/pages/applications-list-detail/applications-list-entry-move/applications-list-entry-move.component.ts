import {
  Component,
  EnvironmentInjector,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ApplicationsListEntryMoveState,
  entryMoveClearPatch,
  initialApplicationsListEntryMoveState,
} from './util';

import {
  APPLICATIONS_LIST_COLUMNS_ACTION,
  APPLICATIONS_LIST_ERROR_MESSAGES,
  APPLICATIONS_LIST_FORM_ERROR_MESSAGES,
  APPLICATION_LIST_SORT_MAP,
} from '@components/applications-list/util/applications-list.constants';
import { loadQuery } from '@components/applications-list/util/load-query';
import { APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import {
  ApplicationEntriesResultContext,
  hasAnyParams,
  toRow,
} from '@components/applications-list-entry-detail/util/routing-state-util';
import { ApplicationsListFormComponent } from '@components/applications-list-form/applications-list-form.component';
import { buildSuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import {
  ApplicationListGetSummaryDto,
  ApplicationListsApi,
  GetApplicationListsRequestParams,
} from '@openapi';
import { ApplicationListRecordsService } from '@services/applications-list/application-list-records.service';
import { ApplicationsListFormService } from '@services/applications-list/applications-list-form.service';
import { buildApplicationsListErrorSummary } from '@services/applications-list/build-applications-list-error-summary';
import {
  ApplicationListSearchFormService,
  DEFAULT_STATE,
  SearchFormValue,
} from '@services/applications-list/searchform/application-list-search-form.service';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { getProblemText } from '@util/http-error-to-text';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { ApplicationListRow } from '@util/types/application-list/types';
import { cjaMustExistIfTypedValidator } from '@validators/cja-exists.validator';
import { courtMustExistIfTypedValidator } from '@validators/court-exists.validator';
import { courtLocCjaValidator } from '@validators/court-or-cja.validator';

@Component({
  selector: 'app-applications-list-entry-move',
  imports: [
    BreadcrumbsComponent,
    SortableTableComponent,
    PageHeaderComponent,
    ApplicationsListFormComponent,
    PaginationComponent,
    DateTimePipe,
    ReactiveFormsModule,
    ErrorSummaryComponent,
    NotificationBannerComponent,
  ],
  templateUrl: './applications-list-entry-move.component.html',
  styleUrl: './applications-list-entry-move.component.scss',
})
export class ApplicationsListEntryMoveComponent
  extends PlaceFieldsBase
  implements OnInit
{
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formSvc = inject(ApplicationsListFormService);
  private readonly searchForm = inject(ApplicationListSearchFormService);
  private readonly appListsApi = inject(ApplicationListsApi);
  private readonly envInjector = inject(EnvironmentInjector);

  // Initialise signal state
  private readonly moveEntrySignalState =
    createSignalState<ApplicationsListEntryMoveState>(
      initialApplicationsListEntryMoveState,
    );
  private readonly moveEntryState = this.moveEntrySignalState.state;
  private readonly moveEntryPatch = this.moveEntrySignalState.patch;
  readonly vm = this.moveEntrySignalState.vm;

  private readonly storedRecordsState = inject(ApplicationListRecordsService);
  readonly storedRecordsVm = this.storedRecordsState.vm;

  private readonly loadRequest =
    signal<GetApplicationListsRequestParams | null>(null);

  readonly searchFormState = this.searchForm.state;

  override form = this.formSvc.createSearchForm();
  suggestionsFacade = buildSuggestionsFacade(this);

  onCreateErrorClick = onCreateErrorClickFn;

  columnsEntries = APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS;
  columnsLists: TableColumn[] = APPLICATIONS_LIST_COLUMNS_ACTION;

  private readonly errorMap = APPLICATIONS_LIST_FORM_ERROR_MESSAGES;

  get createListState(): {
    createMoveTargetList: boolean;
    originalListId: string;
    entriesToMove: ApplicationEntriesResultContext[];
  } {
    return {
      createMoveTargetList: true,
      originalListId: this.moveEntryState().listId,
      entriesToMove: this.moveEntryState().selectedEntries,
    };
  }

  ngOnInit(): void {
    this.moveEntryPatch({
      listId: this.route.snapshot.paramMap.get('id') ?? undefined,
    });

    this.moveEntryPatch({
      selectedEntries:
        (
          history.state as {
            entriesToMove?: ApplicationEntriesResultContext[];
          }
        )?.entriesToMove ?? [],
    });

    if (
      !this.moveEntryState().listId ||
      !this.moveEntryState().selectedEntries.length
    ) {
      void this.router.navigate(['../'], { relativeTo: this.route });
    }

    this.setupEffects();

    this.form.addValidators([
      courtLocCjaValidator(),
      cjaMustExistIfTypedValidator({
        getTyped: () => this.state().cjaSearch ?? '',
        getValidCodes: () => this.state().cja.map((x) => x.code),
      }),
      courtMustExistIfTypedValidator({
        getTyped: () => this.state().courthouseSearch ?? '',
        getValidCodes: () =>
          this.state().courtLocations.map((x) => x.locationCode),
      }),
    ]);

    // We can only move to open applications lists, force status to open
    this.form.patchValue({ status: 'open' });

    this.storedRecordsState.patch({
      rows: [],
      totalPages: 0,
      currentPage: 0,
      submitted: false,
    });
  }

  onSearch(event: SubmitEvent): void {
    // Search applications list
    event.preventDefault();

    this.storedRecordsState.patch({ rows: [] });

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    const validationErrors = buildApplicationsListErrorSummary(
      this.form,
      this.errorMap,
    );
    if (validationErrors.length) {
      this.storedRecordsState.patch({ submitted: true });
      this.moveEntryPatch({ searchErrors: validationErrors });
      return;
    }

    this.loadApplicationsLists();
  }

  onSelect(targetList: ApplicationListRow): void {
    const { listId, selectedEntries } = this.moveEntryState();

    if (!listId || !targetList.id || !selectedEntries.length) {
      return;
    }

    this.moveEntryPatch({ targetListId: targetList.id });

    void this.router.navigate(
      ['/applications-list', listId, 'move', 'confirm'],
      {
        state: {
          entriesToMove: selectedEntries,
          targetList,
        },
      },
    );
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.moveEntryPatch({
      sortField: {
        key: APPLICATION_LIST_SORT_MAP[sort.key] ?? sort.key,
        direction: sort.direction,
      },
    });
  }

  onPageChange(page: number): void {
    this.storedRecordsState.patch({ currentPage: page });
    this.loadApplicationsLists();
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().searchErrors.find((e) => e.id === id);
  }

  toggleAdvancedSearch(): void {
    this.searchForm.patchState({
      isAdvancedSearch: !this.searchForm.state().isAdvancedSearch,
    });
  }

  clearSearch(): void {
    this.moveEntryPatch(entryMoveClearPatch());
    this.storedRecordsState.patch({ submitted: false, rows: [] });

    this.searchForm.reset();
    this.form.reset(this.searchForm.state());

    // clear PlaceFieldsBase signal state
    this.resetPlaceSearch();
  }

  private loadApplicationsLists(): void {
    this.moveEntryPatch(entryMoveClearPatch());
    this.moveEntryPatch({ isLoading: true });

    if (!hasAnyParams(this.form)) {
      this.moveEntryPatch({
        searchErrors: [
          ...this.moveEntryState().searchErrors,
          {
            id: '',
            text: APPLICATIONS_LIST_ERROR_MESSAGES.invalidSearchCriteria,
          },
        ],
      });
      return;
    }

    this.searchForm.setState({
      ...DEFAULT_STATE,
      ...this.form.getRawValue(),
      isAdvancedSearch: this.searchForm.state().isAdvancedSearch,
    } as SearchFormValue);

    const r = this.storedRecordsState.state();

    const paramSort = [
      `${this.moveEntryState().sortField.key},${this.moveEntryState().sortField.direction}`,
    ];

    const params: GetApplicationListsRequestParams = {
      pageNumber: r.currentPage,
      pageSize: r.pageSize,
      sort: paramSort,
      filter: loadQuery(this.form),
    };

    this.loadRequest.set(params);
  }

  private setupEffects(): void {
    setupLoadEffect(
      {
        request: this.loadRequest,
        load: (params) =>
          this.appListsApi.getApplicationLists(params, undefined, undefined, {
            transferCache: true,
          }),
        onSuccess: (page) => {
          const content: ApplicationListGetSummaryDto[] = page.content ?? [];
          this.moveEntryPatch({
            searchErrors: [],
            isLoading: false,
            searchDone: true,
          });
          this.storedRecordsState.patch({
            submitted: true,
            totalPages: page.totalPages ?? 0,
            rows: content.map((x) => toRow(x)),
          });
          this.loadRequest.set(null);
        },
        onError: (err) => {
          const msg = getProblemText(err);
          this.moveEntryPatch({
            isLoading: false,
            searchErrors: [{ id: 'search', text: msg }],
            searchDone: true,
          });
          this.storedRecordsState.patch({
            submitted: true,
            rows: [],
            totalPages: 0,
          });
          this.loadRequest.set(null);
        },
      },
      this.envInjector,
    );
  }

  private resetPlaceSearch(): void {
    this.setCjaSearch('');
    this.patch({ filteredCja: [] });

    this.setCourthouseSearch('');
    this.patch({ filteredCourthouses: [] });
  }
}
