/*
Main component for /application-list/:id

Functionality:
  On page load:
    - Takes application list row from applications-list page and populates
    list-detail page
*/

import { isPlatformBrowser } from '@angular/common';
import {
  HttpContext,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import {
  Component,
  EnvironmentInjector,
  NgZone,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApplicationsListUpdateComponent } from './applications-list-update/applications-list-update.component';
import {
  ApplicationsListDetailState,
  UpdateReq,
  clearUpdateNotificationsPatch,
  initialApplicationsListDetailState,
  listDetailsReq,
  selectedRow,
  tableDataReq,
} from './util';
import { mapEntrySummaryRows } from './util/map-entry-summary-rows';

import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import {
  ApplicationsListDetailSearchComponent,
  ApplicationsListDetailSearchResult,
} from '@components/applications-list-detail-search/applications-list-detail-search.component';
import { toRow } from '@components/applications-list-entry-detail/util/routing-state-util';
import { buildSuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { AsyncJobProgressComponent } from '@components/async-job-progress/async-job-progress.component';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { HelpDetailsComponent } from '@components/help-details/help-details.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import {
  toCjaSuggestionItem,
  toCourtSuggestionItem,
} from '@components/suggestions/suggestions.types';
import {
  appListDetailColumns,
  appListDetailStatusOptions,
} from '@constants/application-list-detail-update/form-table-structure';
import { IF_MATCH } from '@context/concurrency-context';
import { PdfService } from '@core/services/pdf.service';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListEntriesApi,
  ApplicationListGetDetailDto,
  ApplicationListGetPrintDto,
  ApplicationListsApi,
  EntryIdsDto,
  EntryPage,
} from '@openapi';
import { ApplicationsListFormService } from '@services/applications-list/applications-list-form.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { PrintRequest } from '@shared-types/pdf/pdf.types';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenu, MojButtonMenuDirective } from '@util/moj-button-menu';
import {
  handlePrintContinuous as handlePrintContinuousPdf,
  handlePrintPage as handlePrintPagePdf,
} from '@util/pdf-utils';
import { PlaceFieldsBase } from '@util/place-fields.base';
import {
  ServerPaginatedSelectionPatch,
  buildPageSelectionPatch,
  buildSelectAllMatchingPatch,
  getVisibleSelectedRows,
  isAllMatchingSelected,
} from '@util/server-paginated-selection';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { trimToUndefined } from '@util/string-helpers';
import { parseTimeToDuration } from '@util/time-helpers';
import { ApplicationListRow } from '@util/types/application-list/types';
import { addLocationValidatorsToForm } from '@validators/add-location-validators-to-form';
import { closePermitted } from '@validators/applications-list-close.validator';

type ApplicationsListDetailHistoryState = {
  row?: ApplicationListRow;
  closeError?: {
    status?: number;
    title?: string;
    detail?: string;
  };
  moveError?: string;
  updateFeeError?: string;
};

const APPLICATION_LIST_DETAIL_SORT_MAP: Record<string, string> = {
  sequenceNumber: 'sequenceNumber',
  accountNumber: 'accountReference',
  applicant: 'applicantName',
  respondent: 'respondentName',
  postCode: 'respondentPostcode',
  title: 'applicationTitle',
  feeReq: 'feeRequired',
  resulted: 'resulted',
};

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    PaginationComponent,
    BreadcrumbsComponent,
    ErrorSummaryComponent,
    SuccessBannerComponent,
    PageHeaderComponent,
    ApplicationsListUpdateComponent,
    SortableTableComponent,
    PaginationComponent,
    MojButtonMenuDirective,
    ApplicationsListDetailSearchComponent,
    AsyncJobProgressComponent,
    HelpDetailsComponent,
    NotificationBannerComponent,
  ],
  templateUrl: './applications-list-detail.component.html',
  styleUrls: ['./applications-list-detail.component.scss'],
})
export class ApplicationsListDetail extends PlaceFieldsBase implements OnInit {
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly appListFormService = inject(ApplicationsListFormService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly refField = inject(ReferenceDataFacade);
  private readonly appListApi = inject(ApplicationListsApi);
  private readonly pdf = inject(PdfService);
  private readonly appListEntriesApi = inject(ApplicationListEntriesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly menus = inject(MojButtonMenu);

  id!: string;
  listRow: ApplicationListRow | undefined = undefined;
  etag: string | null = null;
  entryCount: number = 0;

  bulkUploadJobId = signal('');
  bulkUploadedEntryIds: string[] | undefined = [];

  private readonly detailSignalState =
    createSignalState<ApplicationsListDetailState>(
      initialApplicationsListDetailState,
    );

  readonly vm = this.detailSignalState.vm;

  private readonly tableDataRequest = signal<tableDataReq | null>(null);
  private readonly listDetailRequest = signal<listDetailsReq | null>(null);
  private readonly updateRequest = signal<UpdateReq | null>(null);
  private readonly printRequest = signal<PrintRequest | null>(null);

  private readonly loadFailed = signal(false);
  readonly submitAttempt = signal(0);
  private selectAllRequestVersion = 0;

  override form = this.appListFormService.createUpdateForm();

  statusOptions = appListDetailStatusOptions;
  columns = appListDetailColumns;

  suggestionsFacade = buildSuggestionsFacade(this);

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refField);
    this.detailSignalState.patch(clearUpdateNotificationsPatch());
    this.setSuccessBanner();
    this.setCloseErrorFromNavigation();
    this.setMoveErrorFromNavigation();
    this.setUpdateFeeErrorFromNavigation();

    //Attach validators
    addLocationValidatorsToForm(this.form, () => this.state());
    this.form.addValidators([closePermitted()]);

    this.setupEffects();

    const st = isPlatformBrowser(this.platformId)
      ? (history.state as { row?: ApplicationListRow })?.row
      : undefined;

    this.id = st?.id ?? this.route.snapshot.paramMap.get('id') ?? '';
    this.entryCount = st?.entriesCount ?? 0;

    if (isPlatformBrowser(this.platformId)) {
      this.loadApplicationsLists();
    }
  }

  onTabSelected(tab: string): void {
    if (tab !== 'applications') {
      return;
    }

    const vm = this.vm();

    if (vm.errorSummary.length > 0 || vm.updateInvalid) {
      this.resetErrorSummary();
    } else if (vm.updateDone || vm.updateOfficialsDone) {
      this.resetSuccessBanner();
    }
  }

  private resetErrorSummary(): void {
    this.detailSignalState.patch({
      errorSummary: [],
      errorHint: '',
      preserveErrorSummaryOnLoad: false,
      updateInvalid: false,
    });
  }

  private resetSuccessBanner(): void {
    this.detailSignalState.patch({
      updateDone: false,
      updateOfficialsDone: false,
    });
  }

  setSuccessBanner(): void {
    if (this.route.snapshot.queryParamMap.get('listCreated') === 'true') {
      this.vm().createDone = true;
      const createState = history.state as ApplicationsListDetailHistoryState;
      this.listRow = createState.row ?? undefined;
    }

    if (
      this.route.snapshot.queryParamMap.get('moveEntriesSuccessful') === 'true'
    ) {
      this.vm().moveDone = true;
    }

    if (
      this.route.snapshot.queryParamMap.get('updateOfficialsSuccessful') ===
      'true'
    ) {
      this.vm().updateOfficialsDone = true;
    }

    if (
      this.route.snapshot.queryParamMap.get('bulkFeeUpdateSuccessful') ===
      'true'
    ) {
      this.vm().updateFeesDone = true;
    }

    if (this.route.snapshot.queryParamMap.get('bulkUploadSuccess') === 'true') {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      this.vm().bulkUploadDone = true;
      const uploadState = history.state as { msg: string; jobId: string };
      const returnedJobId = uploadState.jobId;
      this.bulkUploadJobId.set(returnedJobId);

      this.vm().bulkUploadBannerText = `${uploadState.msg}`;
    }
  }

  private setCloseErrorFromNavigation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isCloseError =
      this.route.snapshot.queryParamMap.get('close') === 'error';
    const code = Number(this.route.snapshot.queryParamMap.get('code'));
    const closeState = history.state as ApplicationsListDetailHistoryState;
    const closeError = closeState.closeError;

    if (!isCloseError || !code || !closeError) {
      return;
    }

    const text = closeError.detail?.trim() || closeError.title?.trim();
    if (!text) {
      return;
    }

    this.detailSignalState.patch({
      updateInvalid: true,
      errorHint: 'There is a problem',
      errorSummary: [{ id: 'status-close', href: '#status', text }],
      preserveErrorSummaryOnLoad: true,
    });
  }

  private setMoveErrorFromNavigation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isMoveError =
      this.route.snapshot.queryParamMap.get('move') === 'error';
    const moveState = history.state as ApplicationsListDetailHistoryState;
    const moveError = moveState.moveError;

    if (!isMoveError || !moveError) {
      return;
    }

    if (!moveError) {
      return;
    }

    this.detailSignalState.patch({
      updateInvalid: true,
      errorHint: 'There is a problem',
      errorSummary: [{ id: '', href: '', text: moveError }],
      preserveErrorSummaryOnLoad: true,
    });
  }

  private setUpdateFeeErrorFromNavigation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isFeeError =
      this.route.snapshot.queryParamMap.get('updateFee') === 'error';
    const feeState = history.state as ApplicationsListDetailHistoryState;
    const feeError = feeState.updateFeeError;

    if (!isFeeError || !feeError) {
      return;
    }

    if (!feeError) {
      return;
    }

    this.detailSignalState.patch({
      updateInvalid: true,
      errorHint: 'There is a problem',
      errorSummary: [{ id: '', href: '', text: feeError }],
      preserveErrorSummaryOnLoad: true,
    });
  }

  private setupEffects(): void {
    // GET /application-lists/{listId} for list details info
    setupLoadEffect(
      {
        request: this.listDetailRequest,
        load: (req: listDetailsReq) =>
          this.appListApi.getApplicationList(
            {
              listId: req.id,
              pageNumber: req.pageNumber,
              pageSize: req.pageSize,
            },
            'response',
            false,
            { transferCache: false },
          ),

        onSuccess: (res: HttpResponse<ApplicationListGetDetailDto>) => {
          const dto = res.body;
          if (!dto) {
            this.detailSignalState.patch({
              isLoading: false,
              updateInvalid: true,
              errorHint: 'No data returned from server.',
              errorSummary: [{ text: 'No data returned from server.' }],
              rows: [],
              totalPages: 0,
              totalEntries: 0,
              selectedIds: new Set<string>(),
              selectedRows: [],
              allMatchingSelected: false,
            });
            this.listDetailRequest.set(null);
            return;
          }

          this.etag = res.headers.get('ETag') ?? this.etag;

          const vm = this.vm();

          if (!vm.hasPrefilledFromApi) {
            this.prefillFromApi(dto);
            this.detailSignalState.patch({ hasPrefilledFromApi: true });
          }

          this.patchLoadSuccessState({});

          this.listDetailRequest.set(null);

          if (isPlatformBrowser(this.platformId)) {
            this.ngZone.runOutsideAngular(() => {
              requestAnimationFrame(() => {
                const root =
                  document.getElementById('sortable-table') ?? document;
                void this.menus.initAll(root);
              });
            });
          }
        },
        onError: (err: unknown) => {
          this.loadFailed.set(true);

          this.detailSignalState.patch({
            isLoading: false,
            updateInvalid: true,
            errorHint: getProblemText(err),
            errorSummary: [{ text: getProblemText(err) }],
            rows: [],
            totalPages: 0,
            totalEntries: 0,
            selectedIds: new Set<string>(),
            selectedRows: [],
            allMatchingSelected: false,
          });
          this.listDetailRequest.set(null);
        },
      },
      this.envInjector,
    );

    // GET /application-lists/{listId}/entries for table data, with pagination
    setupLoadEffect(
      {
        request: this.tableDataRequest,
        load: (req: tableDataReq) =>
          this.appListEntriesApi.getApplicationListEntries(
            {
              listId: req.id,
              pageNumber: req.pageNumber,
              pageSize: req.pageSize,
              sort: req.sort,
              filter: req.filter,
            },
            'response',
            false,
            { transferCache: false },
          ),

        onSuccess: (res: HttpResponse<EntryPage>) => {
          const dto = res.body;
          if (!dto) {
            this.detailSignalState.patch({
              isLoading: false,
              updateInvalid: true,
              errorHint: 'No data returned from server.',
              errorSummary: [{ text: 'No data returned from server.' }],
              rows: [],
              totalPages: 0,
              totalEntries: 0,
              selectedIds: new Set<string>(),
              selectedRows: [],
              allMatchingSelected: false,
            });
            this.tableDataRequest.set(null);
            return;
          }

          const rows = mapEntrySummaryRows(dto.content);

          const total = dto.totalElements ?? rows.length;
          const pageSize = this.vm().pageSize;
          const totalPages = total > pageSize ? Math.ceil(total / pageSize) : 0;

          this.patchLoadSuccessState(
            buildPageSelectionPatch({
              rows,
              totalPages,
              totalEntries: total,
              currentSelectedIds: this.vm().selectedIds,
            }),
          );

          this.tableDataRequest.set(null);
        },

        onError: (err: unknown) => {
          this.loadFailed.set(true);

          // append to existing errors if we already have data, otherwise replace (e.g. on first load)
          this.detailSignalState.patch({
            isLoading: false,
            updateInvalid: true,
            errorHint: getProblemText(err),
            errorSummary: [{ text: getProblemText(err) }],
            rows: [],
            totalPages: 0,
            totalEntries: 0,
            selectedIds: new Set<string>(),
            selectedRows: [],
            allMatchingSelected: false,
          });
          this.tableDataRequest.set(null);
        },
      },
      this.envInjector,
    );

    // PUT /application-lists/{listId}/entries/{entryId}
    setupLoadEffect(
      {
        request: this.updateRequest,
        load: (req: UpdateReq) => {
          const context = new HttpContext().set(IF_MATCH, req.etag ?? null);
          return this.appListApi.updateApplicationList(
            { listId: req.id, applicationListUpdateDto: req.payload },
            'response',
            false,
            { context },
          );
        },
        onSuccess: (res: HttpResponse<ApplicationListGetDetailDto>) => {
          this.etag = res.headers.get('ETag') ?? this.etag;
          this.detailSignalState.patch({
            updateDone: true,
            updateInvalid: false,
            errorHint: '',
            errorSummary: [],
          });
          this.updateRequest.set(null);
        },
        onError: (err: unknown) => {
          const httpErr = err instanceof HttpErrorResponse ? err : undefined;

          this.detailSignalState.patch({
            updateInvalid: true,
            errorHint: 'There is a problem',
            errorSummary: httpErr
              ? this.mapUpdateHttpError(httpErr)
              : [{ text: getProblemText(err) }],
          });

          this.updateRequest.set(null);
        },
      },
      this.envInjector,
    );

    // GET /application-lists/{listId}/print
    setupLoadEffect(
      {
        request: this.printRequest,
        load: (req: PrintRequest) =>
          this.appListApi.printApplicationList(
            { listId: req.id },
            undefined,
            undefined,
            {
              transferCache: false,
            },
          ),
        onSuccess: async (dto) => {
          const mode = this.printRequest()?.mode;
          this.printRequest.set(null);
          try {
            const filteredDto = this.filterEntriesToPrint(dto);

            if (mode === 'page') {
              await this.handlePrintPage(filteredDto);
              return;
            }

            await this.handlePrintContinuous(filteredDto);
          } finally {
            this.detailSignalState.patch({ pdfLoading: false });
          }
        },
        onError: (err) => {
          this.printRequest.set(null);
          this.detailSignalState.patch({ pdfLoading: false });
          const errMsg = getProblemText(err);
          this.detailSignalState.patch({
            errorSummary: [
              {
                text: errMsg,
              },
            ],
          });
        },
      },
      this.envInjector,
    );
  }

  get noEntries(): boolean {
    const vm = this.vm();
    return !vm.isLoading && !vm.updateInvalid && (vm.rows?.length ?? 0) === 0;
  }

  get selectedCount(): number {
    return this.vm().selectedIds.size;
  }

  get hasSelection(): boolean {
    return this.selectedCount > 0;
  }

  get canUseBulkActions(): boolean {
    return this.hasSelection && !this.vm().isSelectingAll;
  }

  loadListDetailsInfo(): void {
    if (!this.id) {
      return;
    }

    this.loadFailed.set(false);
    this.detailSignalState.patch({ isLoading: true });
    const vm = this.vm();
    const apiSortKey =
      APPLICATION_LIST_DETAIL_SORT_MAP[vm.sortField.key] ?? vm.sortField.key;
    const paramSort = [`${apiSortKey},${vm.sortField.direction}`];

    // replace with table details req
    this.listDetailRequest.set({
      id: this.id,
      pageNumber: vm.currentPage,
      pageSize: vm.pageSize,
    });

    this.tableDataRequest.set({
      id: this.id,
      pageNumber: vm.currentPage,
      pageSize: vm.pageSize,
      sort: paramSort,
      filter: vm.getFilters,
    });
  }

  loadApplicationsLists(): void {
    this.loadListDetailsInfo();
  }

  onSelectedIdsChange(ids: Set<string>): void {
    const vm = this.vm();
    const selectedIds = new Set(ids);

    this.detailSignalState.patch({
      selectedIds,
      selectedRows: getVisibleSelectedRows(vm.rows, selectedIds),
      allMatchingSelected: isAllMatchingSelected(selectedIds, vm.totalEntries),
    });
  }

  onSelectedRowsChange(rows: Row[]): void {
    this.detailSignalState.patch({ selectedRows: rows });
  }

  onHeaderSelectAllChange(checked: boolean): void {
    if (checked) {
      void this.onSelectAllMatchingClick();
      return;
    }

    this.clearSelection();
  }

  async onSelectAllMatchingClick(): Promise<void> {
    if (!this.id) {
      return;
    }

    const requestVersion = this.nextSelectAllRequestVersion();
    const vm = this.vm();
    const previousSelection = {
      selectedIds: new Set(vm.selectedIds),
      selectedRows: [...vm.selectedRows],
      allMatchingSelected: vm.allMatchingSelected,
    };
    const visibleIds = new Set(
      vm.rows
        .map((row) => row['id'])
        .filter(
          (id): id is string | number =>
            typeof id === 'string' || typeof id === 'number',
        )
        .map(String),
    );
    const optimisticSelectedIds = new Set([
      ...previousSelection.selectedIds,
      ...visibleIds,
    ]);

    this.detailSignalState.patch({
      isSelectingAll: true,
      selectedIds: optimisticSelectedIds,
      selectedRows: [...vm.rows],
      allMatchingSelected:
        visibleIds.size > 0 && visibleIds.size === vm.totalEntries,
      errorSummary: [],
      errorHint: '',
    });

    try {
      const dto = await firstValueFrom(
        this.appListEntriesApi.getApplicationListEntryIds({
          listId: this.id,
          filter: this.vm().getFilters,
        }),
      );

      if (requestVersion !== this.selectAllRequestVersion) {
        return;
      }

      this.applySelectAllMatching(dto);
    } catch (err) {
      if (requestVersion !== this.selectAllRequestVersion) {
        return;
      }

      const errMsg = getProblemText(err);
      this.detailSignalState.patch({
        isSelectingAll: false,
        ...previousSelection,
        updateInvalid: true,
        errorHint: errMsg,
        errorSummary: [{ text: errMsg }],
      });
    }
  }

  clearSelection(): void {
    this.invalidateSelectAllRequest();
    this.detailSignalState.patch({
      selectedIds: new Set<string>(),
      selectedRows: [],
      isSelectingAll: false,
      allMatchingSelected: false,
    });
  }

  async onUpdateOfficialsButtonClick(): Promise<void> {
    const selected = (await this.resolveSelectedRows()) as selectedRow[];

    if (selected.length === 0) {
      return;
    }

    // clear any prior messages
    this.detailSignalState.patch({ errorSummary: [], errorHint: '' });

    const updateOfficialsApplications = selected.map((r) => ({
      id: r.id,
      sequenceNumber: r.sequenceNumber,
      applicant: r.applicant,
      respondent: r.respondent,
      title: r.title,
    }));

    await this.router.navigate(['update-officials'], {
      relativeTo: this.route,
      state: {
        updateOfficialsApplications,
      },
    });
  }

  async onResultButtonClick(): Promise<void> {
    const selected = (await this.resolveSelectedRows()) as selectedRow[];

    if (selected.length === 0) {
      return;
    }

    // clear any prior messages
    this.detailSignalState.patch({ errorSummary: [], errorHint: '' });

    const resultingApplications = selected.map((r) => ({
      id: r.id,
      sequenceNumber: r.sequenceNumber,
      applicant: r.applicant,
      respondent: r.respondent,
      title: r.title,
    }));

    await this.router.navigate(['result-selected'], {
      relativeTo: this.route,
      state: {
        resultingApplications,
      },
    });
  }

  async onUpdateFeeButtonClick(): Promise<void> {
    const selected = (await this.resolveSelectedRows()) as selectedRow[];

    if (selected.length === 0) {
      return;
    }

    // clear any prior messages
    this.detailSignalState.patch({ errorSummary: [], errorHint: '' });

    // Exclude entries with no fee required
    const selectedFeesRequired = selected.filter(
      (element) => element.feeReq !== 'No',
    );

    if (selectedFeesRequired.length === 0) {
      this.detailSignalState.patch({
        errorSummary: [
          {
            text: 'Cannot update application(s) that do not require a fee',
            href: '',
            id: '',
          },
        ],
      });
      return;
    }

    const entriesToUpdateFee = selectedFeesRequired.map((r) => ({
      id: r.id,
      applicant: r.applicant,
      respondent: r.respondent,
      title: r.title,
      feeRequired: r.feeReq,
      resulted: r.resulted,
    }));

    await this.router.navigate(['bulk-update-fee'], {
      relativeTo: this.route,
      state: {
        removedApplicationsWarning:
          selectedFeesRequired.length < selected.length,
        entriesToUpdateFee,
      },
    });
  }

  async onMoveButtonClick(): Promise<void> {
    const selected = (await this.resolveSelectedRows()) as selectedRow[];

    if (selected.length === 0) {
      return;
    }

    this.detailSignalState.patch(clearUpdateNotificationsPatch());

    const entriesToMove = selected.map((r) => ({
      id: r.id,
      applicant: r.applicant,
      respondent: r.respondent,
      title: r.title,
      feeRequired: r.feeReq,
      resulted: r.resulted,
    }));

    await this.router.navigate(['move'], {
      relativeTo: this.route,
      state: {
        entriesToMove,
      },
    });
  }

  async onBulkUploadBannerClick(): Promise<void> {
    await this.bulkImportGetIds(this.bulkUploadJobId());

    if (!this.bulkUploadedEntryIds?.length) {
      this.detailSignalState.patch({
        errorSummary: [
          { text: 'Failed to get new bulk uploaded applications' },
        ],
      });
      return;
    }

    // Set selected Ids as bulkUploadedEntryIds and then let existing function handle the rest
    this.detailSignalState.patch({
      selectedIds: new Set(this.bulkUploadedEntryIds),
    });

    void this.onUpdateFeeButtonClick();
  }

  onPrintContinuousClick(): void {
    // clear any prior messages
    this.detailSignalState.patch(clearUpdateNotificationsPatch());
    this.detailSignalState.patch({ pdfLoading: true });
    if (!this.id) {
      this.detailSignalState.patch({ pdfLoading: false });
      return;
    }

    this.printRequest.set({
      id: this.id,
      mode: 'continuous',
    });
  }

  onPrintPageClick(): void {
    // clear any prior messages
    this.detailSignalState.patch(clearUpdateNotificationsPatch());
    this.detailSignalState.patch({ pdfLoading: true });
    if (!this.id) {
      this.detailSignalState.patch({ pdfLoading: false });
      return;
    }

    this.printRequest.set({ id: this.id, mode: 'page' });
  }

  readonly patchStateFn = (
    patch: Partial<ApplicationsListDetailState>,
  ): void => {
    this.detailSignalState.patch(patch);
  };

  readonly incrementSubmitAttemptFn = (): void => {
    this.submitAttempt.update((attempt) => attempt + 1);
  };

  readonly setUpdateRequestFn = (req: UpdateReq | null): void => {
    this.updateRequest.set(req);
  };

  private mapUpdateHttpError(err: HttpErrorResponse): ErrorItem[] {
    switch (err.status) {
      case 412:
        return [{ text: 'Resource changed. Reload and try again.' }];

      case 404:
        // preserve your old behaviour: anchor to court field
        return [{ id: 'court', text: getProblemText(err) }];

      default:
        return [{ text: getProblemText(err) }];
    }
  }

  onPageChange(page: number): void {
    this.detailSignalState.patch({
      currentPage: page,
      selectedRows: [],
    });
    this.loadListDetailsInfo();
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.detailSignalState.patch({
      sortField: {
        key: sort.key,
        direction: sort.direction,
      },
      currentPage: 0,
    });

    this.loadListDetailsInfo();
  }

  onSearchStarted(
    filters: ApplicationsListDetailSearchResult['reqFilter'],
  ): void {
    this.submitAttempt.update((attempt) => attempt + 1);
    this.invalidateSelectAllRequest();
    this.detailSignalState.patch({
      currentPage: 0,
      getFilters: filters,
      selectedIds: new Set<string>(),
      selectedRows: [],
      isSelectingAll: false,
      allMatchingSelected: false,
    });
  }

  onSearchResult(result: ApplicationsListDetailSearchResult): void {
    const hasErrors = result.errors.length > 0;
    const filters = result.reqFilter;

    this.invalidateSelectAllRequest();
    this.detailSignalState.patch({
      currentPage: 0,
      rows: result.rows,
      totalPages: result.totalPages,
      totalEntries: result.totalEntries,
      selectedIds: new Set<string>(),
      selectedRows: [],
      allMatchingSelected: false,
      updateInvalid: hasErrors,
      errorSummary: hasErrors ? result.errors : [],
      preserveErrorSummaryOnLoad: false,
      getFilters: filters,
    });
  }

  async openUpdate(row: Partial<selectedRow>): Promise<void> {
    await this.router.navigate(
      ['/applications-list', this.id, 'update-entry', row.id],
      {
        state: {
          appListId: this.id,
          resultApplicantContext: {
            applicant: row.applicant,
            respondent: row.respondent,
            title: row.title,
          },
        },
      },
    );
  }

  private async bulkImportGetIds(jobId: string): Promise<void> {
    const id = trimToUndefined(jobId);

    if (!id) {
      return;
    }

    try {
      const newEntryIds = await firstValueFrom(
        this.appListEntriesApi.getBulkResultApplicationListEntriesByJobId({
          jobId: id,
        }),
      );

      if (!newEntryIds.length) {
        this.vm().errorSummary = [
          { text: 'Failed to get new bulk uploaded IDs' },
        ];
        return;
      }

      this.bulkUploadedEntryIds = newEntryIds;
    } catch (err) {
      const msg = getProblemText(err);

      this.detailSignalState.patch({
        errorSummary: [{ text: msg }],
        bulkUploadDone: false,
      });
    }
  }

  private patchLoadSuccessState(
    patch: Partial<ServerPaginatedSelectionPatch>,
  ): void {
    if (this.loadFailed()) {
      return;
    }

    const vm = this.vm();
    const preserveErrorSummary = vm.preserveErrorSummaryOnLoad;

    this.detailSignalState.patch({
      ...patch,
      isLoading: false,
      updateInvalid: preserveErrorSummary ? vm.updateInvalid : false,
      errorHint: preserveErrorSummary ? vm.errorHint : '',
      errorSummary: preserveErrorSummary ? vm.errorSummary : [],
      preserveErrorSummaryOnLoad: preserveErrorSummary,
    });
  }

  private filterEntriesToPrint(
    dto: ApplicationListGetPrintDto,
  ): ApplicationListGetPrintDto {
    const selectedIds = this.detailSignalState.state().selectedIds;

    const filteredEntries = dto.entries.filter((entry) =>
      selectedIds.has(entry.id),
    );

    return {
      ...dto,
      entries: filteredEntries,
    };
  }

  private applySelectAllMatching(dto: EntryIdsDto): void {
    this.detailSignalState.patch({
      isSelectingAll: false,
      ...buildSelectAllMatchingPatch(
        dto.ids ?? [],
        this.vm().rows,
        this.vm().totalEntries,
      ),
    });
  }

  private async resolveSelectedRows(): Promise<Row[]> {
    const vm = this.vm();

    if (vm.selectedIds.size === 0) {
      return vm.selectedRows;
    }

    if (vm.selectedIds.size === vm.selectedRows.length) {
      return vm.selectedRows;
    }

    const selectedIds = new Set(vm.selectedIds);
    const apiSortKey =
      APPLICATION_LIST_DETAIL_SORT_MAP[vm.sortField.key] ?? vm.sortField.key;
    const sort = [`${apiSortKey},${vm.sortField.direction}`];
    const pageCount =
      vm.totalPages > 0 ? vm.totalPages : vm.totalEntries > 0 ? 1 : 0;
    const selectedRows: Row[] = [];

    for (let pageNumber = 0; pageNumber < pageCount; pageNumber += 1) {
      const page = await firstValueFrom(
        this.appListEntriesApi.getApplicationListEntries({
          listId: this.id,
          pageNumber,
          pageSize: vm.pageSize,
          sort,
          filter: vm.getFilters,
        }),
      );

      const rows = mapEntrySummaryRows(page.content ?? []);
      for (const row of rows) {
        if (selectedIds.has(row.id)) {
          selectedRows.push(row);
        }
      }

      if (selectedRows.length === selectedIds.size) {
        break;
      }
    }

    this.detailSignalState.patch({ selectedRows });

    return selectedRows;
  }

  private nextSelectAllRequestVersion(): number {
    this.selectAllRequestVersion += 1;
    return this.selectAllRequestVersion;
  }

  private invalidateSelectAllRequest(): void {
    this.selectAllRequestVersion += 1;
  }

  private async handlePrintPage(
    dto: ApplicationListGetPrintDto,
  ): Promise<void> {
    await handlePrintPagePdf(dto, {
      pdf: this.pdf,
      isBrowser: isPlatformBrowser(this.platformId),
      onError: (message) => this.patchPrintError(message),
      noEntriesMessage: APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint,
      generateErrorMessage: APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateRetry,
      crestUrl: '/assets/govuk-crest.png',
    });
  }

  private async handlePrintContinuous(
    dto: ApplicationListGetPrintDto,
  ): Promise<void> {
    await handlePrintContinuousPdf(dto, {
      pdf: this.pdf,
      isBrowser: isPlatformBrowser(this.platformId),
      onError: (message) => this.patchPrintError(message),
      noEntriesMessage: APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint,
      generateErrorMessage: APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateGeneric,
      isClosed: false,
    });
  }

  private patchPrintError(message: string): void {
    this.detailSignalState.patch({
      errorSummary: [{ text: message }],
    });
  }

  private prefillFromApi(dto: ApplicationListGetDetailDto): void {
    this.listRow ??= toRow(dto);
    this.listRow.etag = this.etag; // This isn't stored in the DTO

    this.entryCount = dto.entriesCount ?? this.entryCount;

    this.form.patchValue({
      date: dto.date ?? null,
      time: parseTimeToDuration(dto.time),
      description: dto.description ?? '',
      status: dto.status?.toLowerCase() ?? null,
      duration:
        dto.durationHours !== null || dto.durationMinutes !== null
          ? // Duration is returned differently to time sadly so we have to assign like this
            {
              hours: dto.durationHours ?? null,
              minutes: dto.durationMinutes ?? null,
            }
          : null,
    });

    if (dto.courtCode) {
      this.selectCourthouse(
        toCourtSuggestionItem({
          locationCode: dto.courtCode,
          name: dto.courtName ?? '',
        }),
      );
    } else if (dto.cjaCode) {
      const area =
        this.state().cja.find((a) => a.code === dto.cjaCode) ??
        toCjaSuggestionItem({
          code: dto.cjaCode,
          description: '',
        });
      this.selectCja(area);

      this.form.patchValue({
        location: dto.otherLocationDescription,
      });
    }
  }
}
