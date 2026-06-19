import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin, map } from 'rxjs';

import {
  clearNotificationsPatch,
  defaultApplicationsSort,
  initialApplicationsState,
  searchErrorPatch,
  searchSuccessPatch,
  startSearchPatch,
} from './util/applications.state';
import { mapToRow } from './util/table-mapper';

import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { APPLICATIONS_ERROR_MAP } from '@constants/applications/error-messages';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import { PdfService } from '@core/services/pdf.service';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListEntriesApi,
  ApplicationListGetPrintDto,
  ApplicationListsApi,
  EntryGetFilterDto,
  EntryGetSummaryDto,
  GetEntriesRequestParams,
} from '@openapi';
import {
  ApplicationsSearchFormValue,
  ApplicationsSearchStateService,
  DEFAULT_APPLICATIONS_SEARCH_FORM,
  cloneApplicationsState,
} from '@services/applications/applications-search-state.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { ApplicationRow } from '@shared-types/applications/applications.type';
import { toStatus } from '@util/application-status-helpers';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { buildFormErrorSummary } from '@util/error-summary';
import { has } from '@util/has';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import {
  filterEntriesToPrint,
  handlePrintContinuous,
  handlePrintPage,
} from '@util/pdf-utils';
import { PlaceFieldsBase } from '@util/place-fields.base';
import {
  getVisibleSelectedRows,
  isAllMatchingSelected,
} from '@util/server-paginated-selection';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { addLocationValidatorsToForm } from '@validators/add-location-validators-to-form';

type AppErrorMap = typeof APPLICATIONS_ERROR_MAP;
type ControlName = keyof AppErrorMap;
type ApplicationsPrintRequest =
  | { ids: string[]; mode: 'page'; selectedRows: ApplicationRow[] }
  | { ids: string[]; mode: 'continuous'; selectedRows: ApplicationRow[] };

type ApplicationsPrintResponse = {
  dtos: ApplicationListGetPrintDto[];
  mode: 'page' | 'continuous';
  selectedRows: ApplicationRow[];
};

const APPLICATIONS_SORT_MAP: Record<string, string> = {
  date: 'date',
  applicant: 'applicantName',
  respondent: 'respondentName',
  title: 'applicationTitle',
  fee: 'feeRequired',
  resulted: 'isResulted',
  status: 'status',
};

const MAX_BULK_ROWS = 100;

export const ApplicationsColumns = [
  { header: 'Date', field: 'date', wrap: false },
  { header: 'Applicant', field: 'applicant' },
  { header: 'Respondent', field: 'respondent' },
  { header: 'Application title', field: 'title' },
  { header: 'Fee', field: 'fee' },
  { header: 'Resulted', field: 'resulted' },
  { header: 'Status', field: 'status' },
  { header: 'Actions', field: 'actions', sortable: false },
];

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    SortableTableComponent,
    DateInputComponent,
    TextInputComponent,
    PaginationComponent,
    SelectInputComponent,
    SuggestionsComponent,
    ErrorSummaryComponent,
    NotificationBannerComponent,
    MojButtonMenuDirective,
    DateTimePipe,
  ],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
})
export class Applications extends PlaceFieldsBase implements OnInit {
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly refFacade = inject(ReferenceDataFacade);
  private readonly appListEntryApi = inject(ApplicationListEntriesApi);
  private readonly appListApi = inject(ApplicationListsApi);
  private readonly pdf = inject(PdfService);
  private readonly searchState = inject(ApplicationsSearchStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly appState = createSignalState(initialApplicationsState);
  readonly vm = this.appState.vm;
  private readonly patchApp = this.appState.patch;

  readonly tableRows = computed(() => this.vm().rows.map(mapToRow));

  private readonly errorMap = APPLICATIONS_ERROR_MAP;

  private readonly printRequest = signal<ApplicationsPrintRequest | null>(null);
  private selectAllRequestVersion = 0;

  override form = new FormGroup({
    date: new FormControl<string | null>(null),
    applicantOrg: new FormControl<string>(''),
    respondentOrg: new FormControl<string>(''),
    applicantSurname: new FormControl<string>(''),
    respondentSurname: new FormControl<string>(''),
    location: new FormControl<string>(''),
    standardApplicantCode: new FormControl<string>(''),
    respondentPostcode: new FormControl<string>('', {
      validators: [Validators.maxLength(8)],
    }),
    accountReference: new FormControl<string>(''),
    court: new FormControl<string>(''),
    cja: new FormControl<string>(''),
    status: new FormControl<string | null>(null),
  });

  columns = ApplicationsColumns;

  status = [
    { label: 'Choose', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints

  get selectedCount(): number {
    return this.vm().selectedIds.size;
  }

  get hasSelection(): boolean {
    return this.selectedCount > 0;
  }

  get canUseBulkActions(): boolean {
    return this.hasSelection && !this.vm().isSelectingAll;
  }

  ngOnInit(): void {
    this.restoreSearchState();
    this.initPlaceFields(this.form, this.refFacade);
    this.setupEffects();

    addLocationValidatorsToForm(this.form, () => this.state());
  }

  private restoreSearchState(): void {
    const snapshot = this.searchState.state();

    this.form.reset(snapshot.form, { emitEvent: false });
    this.appState.state.set(cloneApplicationsState(snapshot.state));
  }

  private setupEffects(): void {
    // GET /application-lists/{listId}/print
    setupLoadEffect(
      {
        request: this.printRequest,
        load: (req: ApplicationsPrintRequest) => {
          return forkJoin(
            req.ids.map((listId) =>
              this.appListApi.printApplicationList(
                { listId },
                undefined,
                undefined,
                {
                  transferCache: false,
                },
              ),
            ),
          ).pipe(
            map(
              (dtos): ApplicationsPrintResponse => ({
                dtos,
                mode: req.mode,
                selectedRows: req.selectedRows,
              }),
            ),
          );
        },
        onSuccess: async (response) => {
          this.printRequest.set(null);

          const filteredDtos = response.dtos.map((dto) =>
            filterEntriesToPrint(dto, response.selectedRows),
          );

          if (response.mode === 'page') {
            await handlePrintPage(filteredDtos, {
              pdf: this.pdf,
              isBrowser: isPlatformBrowser(this.platformId),
              onError: (message) => this.patchPrintError(message),
              noEntriesMessage:
                APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint,
              generateErrorMessage:
                APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateRetry,
              crestUrl: '/assets/govuk-crest.png',
            });
            return;
          }

          await handlePrintContinuous(filteredDtos, {
            pdf: this.pdf,
            isBrowser: isPlatformBrowser(this.platformId),
            onError: (message) => this.patchPrintError(message),
            noEntriesMessage: APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint,
            generateErrorMessage:
              APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateGeneric,
            isClosed: false,
          });
        },
        onError: (err) => {
          this.printRequest.set(null);
          const errMsg = getProblemText(err);
          this.patchPrintError(errMsg);
        },
      },
      this.envInjector,
    );
  }

  onSubmit(e: SubmitEvent): void {
    e.preventDefault();
    this.invalidateSelectAllRequest();

    this.patchApp({
      ...clearNotificationsPatch(),
      submitted: true,
      isSearch: true,
    });

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    const validationErrors = this.buildErrorSummary();
    if (validationErrors.length) {
      this.patchApp({
        searchErrors: validationErrors,
        isSelectingAll: false,
      });
      return;
    }

    if (!this.hasAnyParams()) {
      this.patchApp({
        searchErrors: [
          {
            text: APPLICATIONS_LIST_ERROR_MESSAGES.invalidSearchCriteria,
            id: 'search-error',
          },
        ],
        isSelectingAll: false,
      });
      return;
    }

    const filter = this.loadQuery();

    this.patchApp({
      currentPage: 0,
      rows: [],
      sortField: defaultApplicationsSort(),
      selectedIds: new Set<string>(),
      selectedRows: [],
      allMatchingSelected: false,
      isSelectingAll: false,
    });

    this.loadApplications(filter);
  }

  async onPrintContinuousClick(): Promise<void> {
    const request = await this.buildPrintRequest('continuous');
    if (!request) {
      return;
    }

    this.printRequest.set(request);
  }

  async onPrintPageClick(): Promise<void> {
    const request = await this.buildPrintRequest('page');
    if (!request) {
      return;
    }

    this.printRequest.set(request);
  }

  onUpdateNotesClick(): void {
    /** TODO: ARCPOC-1333 */
  }

  async onResultSelectedClick(): Promise<void> {
    if (this.vm().selectedIds.size > MAX_BULK_ROWS) {
      this.patchApp({
        errorSummary: [{ text: 'Please select less than 100 rows' }],
      });
      return;
    }

    let rows: ApplicationRow[] = [];
    try {
      rows = await this.resolveSelectedRows();
    } catch (err) {
      this.patchApp({
        errorSummary: [
          { text: `Failed to resolve selected rows: ${getProblemText(err)}` },
        ],
      });
      return;
    }

    if (!rows.length) {
      this.patchApp({
        errorSummary: [{ text: 'Please select rows to result them' }],
      });
      return;
    }

    const rowsToResult = rows.filter(
      (row) => row.status.trim().toLowerCase() !== 'closed',
    );

    // Only result status = 'open' applications
    if (!rowsToResult.length) {
      this.patchApp({
        errorSummary: [{ text: 'You can only result open application(s)' }],
      });
      return;
    }

    // Exclude status as we can only result open applications
    const entriesToResult = rowsToResult.map((row) => ({
      id: row.id,
      listId: row.applicationListId,
      date: row.date,
      applicant: row.applicant,
      respondent: row.respondent,
      title: row.title,
    }));

    await this.router.navigate(['result-selected'], {
      relativeTo: this.route,
      state: {
        entriesToResult,
        ignoredSelected: rows.length > rowsToResult.length,
      },
    });
  }

  private async buildPrintRequest(
    mode: ApplicationsPrintRequest['mode'],
  ): Promise<ApplicationsPrintRequest | null | void> {
    this.patchApp(clearNotificationsPatch());

    if (this.vm().selectedIds.size > MAX_BULK_ROWS) {
      this.patchApp({
        errorSummary: [{ text: 'Please select less than 100 rows' }],
      });
      return;
    }

    let selectedRows: ApplicationRow[];
    try {
      selectedRows = await this.resolveSelectedRows();
    } catch (err) {
      this.patchPrintError(getProblemText(err));
      return null;
    }

    if (selectedRows.length === 0) {
      return null;
    }

    const selectedRowsListIds = this.getArrOfPrintListId(selectedRows);

    return {
      ids: selectedRowsListIds,
      mode,
      selectedRows,
    };
  }

  loadApplications(filterOverride?: EntryGetFilterDto): void {
    if (this.vm().isLoading) {
      return;
    }

    const apiSortKey =
      APPLICATIONS_SORT_MAP[this.vm().sortField.key] ?? this.vm().sortField.key;
    const params: GetEntriesRequestParams = {
      pageNumber: this.vm().currentPage,
      pageSize: this.vm().pageSize,
      sort: [`${apiSortKey},${this.vm().sortField.direction}`],
      filter: filterOverride ?? this.loadQuery(),
    };

    this.patchApp({ ...startSearchPatch(), ...clearNotificationsPatch() });

    this.appListEntryApi
      .getEntries(params, undefined, undefined, { transferCache: false })
      .subscribe({
        next: (page) => {
          const rows = page?.content ?? ([] as EntryGetSummaryDto[]);
          this.patchApp({
            ...searchSuccessPatch(
              rows,
              page?.totalPages ?? 1,
              page?.totalElements ?? 0,
            ),
            getFilters: params.filter ?? {},
          });
          this.saveSearchState();
        },
        error: () => {
          this.patchApp(searchErrorPatch());
        },
      });
  }

  onPageChange(page: number): void {
    this.patchApp({ currentPage: page });
    this.loadApplications(this.vm().getFilters); // fetch page `page`
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.patchApp({
      sortField: {
        key: sort.key,
        direction: sort.direction,
      },
      currentPage: 0,
    });
    this.loadApplications(this.vm().getFilters);
  }

  onSelectedIdsChange(selectedIds: Set<string>): void {
    this.patchApp({
      selectedIds,
      allMatchingSelected: isAllMatchingSelected(
        selectedIds,
        this.vm().totalEntries,
      ),
    });
  }

  onSelectedRowsChange(rows: Row[]): void {
    const visibleIds = new Set(this.tableRows().map((row) => row.id));
    const selectedRowsFromOtherPages = this.vm().selectedRows.filter(
      (row) => !visibleIds.has(row.id),
    );

    this.patchApp({
      selectedRows: [
        ...selectedRowsFromOtherPages,
        ...(rows as ApplicationRow[]),
      ],
    });
  }

  async onHeaderSelectAllChange(checked: boolean): Promise<void> {
    if (checked) {
      await this.onSelectAllMatchingClick();
      return;
    }

    this.clearSelection();
  }

  clearSearch(): void {
    this.invalidateSelectAllRequest();
    this.appState.state.set(cloneApplicationsState(initialApplicationsState));
    this.searchState.reset();

    this.form.reset(DEFAULT_APPLICATIONS_SEARCH_FORM);

    this.patch({
      courthouseSearch: '',
      cjaSearch: '',
      filteredCourthouses: [],
      filteredCja: [],
    });
  }

  // Helpers
  private hasAnyParams(): boolean {
    const v = this.form.getRawValue();

    return (
      has(v.date) ||
      has(v.applicantOrg) ||
      has(v.respondentOrg) ||
      has(v.applicantSurname) ||
      has(v.respondentSurname) ||
      has(v.location) ||
      has(v.standardApplicantCode) ||
      has(v.respondentPostcode) ||
      has(v.accountReference) ||
      has(v.court) ||
      has(v.cja) ||
      has(v.status)
    );
  }

  private loadQuery(): EntryGetFilterDto {
    const v = this.form.getRawValue();
    const filter: EntryGetFilterDto = {};

    if (v.date?.trim()) {
      filter.date = v.date.trim();
    }

    if (v.court?.trim()) {
      filter.courtCode = v.court.trim();
    }

    if (v.location?.trim()) {
      filter.otherLocationDescription = v.location.trim();
    }

    if (v.cja?.trim()) {
      filter.cjaCode = v.cja.trim();
    }

    if (v.applicantOrg?.trim()) {
      filter.applicantOrganisation = v.applicantOrg.trim();
    }

    if (v.applicantSurname?.trim()) {
      filter.applicantSurname = v.applicantSurname.trim();
    }

    if (v.respondentOrg?.trim()) {
      filter.respondentOrganisation = v.respondentOrg.trim();
    }

    if (v.respondentSurname?.trim()) {
      filter.respondentSurname = v.respondentSurname.trim();
    }

    if (v.respondentPostcode?.trim()) {
      filter.respondentPostcode = v.respondentPostcode.trim();
    }

    if (v.standardApplicantCode?.trim()) {
      filter.standardApplicantCode = v.standardApplicantCode.trim();
    }

    if (v.accountReference?.trim()) {
      filter.accountReference = v.accountReference.trim();
    }

    if (v.status) {
      filter.status = toStatus(v.status);
    }

    return filter;
  }

  private getArrOfPrintListId(selectedRows: ApplicationRow[]): string[] {
    if (!selectedRows.length) {
      return [];
    }

    return [
      ...new Set(
        selectedRows
          .map((row) => row.applicationListId?.trim())
          .filter((id): id is string => !!id),
      ),
    ];
  }

  private async onSelectAllMatchingClick(): Promise<void> {
    const requestVersion = this.nextSelectAllRequestVersion();
    const vm = this.vm();
    const previousSelection = {
      selectedIds: new Set(vm.selectedIds),
      selectedRows: [...vm.selectedRows],
      allMatchingSelected: vm.allMatchingSelected,
    };
    const visibleRows = this.tableRows();
    const visibleIds = new Set(
      visibleRows
        .map((row) => row.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    );
    const optimisticSelectedIds = new Set([
      ...previousSelection.selectedIds,
      ...visibleIds,
    ]);
    const selectedRowsFromOtherPages = previousSelection.selectedRows.filter(
      (row) => !visibleIds.has(row.id),
    );

    this.patchApp({
      ...clearNotificationsPatch(),
      isSelectingAll: true,
      selectedIds: optimisticSelectedIds,
      selectedRows: [...selectedRowsFromOtherPages, ...visibleRows],
      allMatchingSelected:
        visibleIds.size > 0 && visibleIds.size === vm.totalEntries,
    });

    try {
      const dto = await firstValueFrom(
        this.appListEntryApi.getEntryIds({
          filter: vm.getFilters,
        }),
      );

      if (requestVersion !== this.selectAllRequestVersion) {
        return;
      }

      this.applySelectAllMatching(dto.ids ?? []);
    } catch (err) {
      if (requestVersion !== this.selectAllRequestVersion) {
        return;
      }

      const errMsg = getProblemText(err);
      this.patchApp({
        ...previousSelection,
        isSelectingAll: false,
        errorSummary: [{ text: errMsg }],
      });
    }
  }

  toggleAdvancedSearch(): void {
    const isAdvancedSearch = !this.vm().isAdvancedSearch;

    this.patchApp({ isAdvancedSearch });
    this.searchState.setAdvancedSearch(isAdvancedSearch);
  }

  private saveSearchState(): void {
    this.searchState.save(this.searchFormValue(), this.vm());
  }

  private searchFormValue(): ApplicationsSearchFormValue {
    const value = this.form.getRawValue();

    return {
      date: value.date ?? null,
      applicantOrg: value.applicantOrg ?? '',
      respondentOrg: value.respondentOrg ?? '',
      applicantSurname: value.applicantSurname ?? '',
      respondentSurname: value.respondentSurname ?? '',
      location: value.location ?? '',
      standardApplicantCode: value.standardApplicantCode ?? '',
      respondentPostcode: value.respondentPostcode ?? '',
      accountReference: value.accountReference ?? '',
      court: value.court ?? '',
      cja: value.cja ?? '',
      status: value.status ?? null,
      isAdvancedSearch: this.vm().isAdvancedSearch,
    };
  }

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, this.errorMap);
  }

  private patchPrintError(message: string): void {
    this.patchApp({
      errorSummary: [{ text: message }],
    });
  }

  private applySelectAllMatching(ids: string[]): void {
    const selectedIds = new Set(ids);

    this.patchApp({
      isSelectingAll: false,
      selectedIds,
      selectedRows: getVisibleSelectedRows(
        this.tableRows(),
        selectedIds,
      ) as ApplicationRow[],
      allMatchingSelected: isAllMatchingSelected(
        selectedIds,
        this.vm().totalEntries,
      ),
    });
  }

  private clearSelection(): void {
    this.invalidateSelectAllRequest();
    this.patchApp({
      selectedIds: new Set<string>(),
      selectedRows: [],
      allMatchingSelected: false,
      isSelectingAll: false,
    });
  }

  private async resolveSelectedRows(): Promise<ApplicationRow[]> {
    const vm = this.vm();

    if (vm.selectedIds.size === 0) {
      return vm.selectedRows;
    }

    if (vm.selectedIds.size === vm.selectedRows.length) {
      return vm.selectedRows;
    }

    const selectedIds = new Set(vm.selectedIds);
    const apiSortKey =
      APPLICATIONS_SORT_MAP[vm.sortField.key] ?? vm.sortField.key;
    let pageCount = 0;
    if (vm.totalPages > 0) {
      pageCount = vm.totalPages;
    } else if (vm.totalEntries > 0) {
      pageCount = 1;
    }
    const selectedRows: ApplicationRow[] = [];

    for (let pageNumber = 0; pageNumber < pageCount; pageNumber += 1) {
      const page = await firstValueFrom(
        this.appListEntryApi.getEntries({
          pageNumber,
          pageSize: vm.pageSize,
          sort: [`${apiSortKey},${vm.sortField.direction}`],
          filter: vm.getFilters,
        }),
      );

      const rows = (page.content ?? []).map(mapToRow);
      for (const row of rows) {
        if (selectedIds.has(row.id)) {
          selectedRows.push(row);
        }
      }

      if (selectedRows.length === selectedIds.size) {
        break;
      }
    }

    this.patchApp({ selectedRows });

    return selectedRows;
  }

  private nextSelectAllRequestVersion(): number {
    this.selectAllRequestVersion += 1;
    return this.selectAllRequestVersion;
  }

  private invalidateSelectAllRequest(): void {
    this.selectAllRequestVersion += 1;
  }

  isControlInvalid<C extends ControlName>(controlName: C): boolean {
    const c = this.form.get(String(controlName));
    return !!(this.vm().submitted && c && c.invalid);
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().searchErrors.find((e) => e.id === id);
  }

  getControlErrorMessages<C extends ControlName>(controlName: C): string[] {
    const c = this.form.get(String(controlName));
    if (!c?.errors) {
      return [];
    }

    const msgMap = this.errorMap[controlName];
    const msgs: string[] = [];

    for (const k of Object.keys(c.errors)) {
      if (!(k in msgMap)) {
        continue;
      }
      const errorKey = k as keyof typeof msgMap;
      msgs.push(msgMap[errorKey]);
    }

    return msgs;
  }
}
