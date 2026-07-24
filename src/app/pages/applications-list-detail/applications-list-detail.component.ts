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
  computed,
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
  ApplicationListEntryBulkActionPreviewRequestDto,
  ApplicationListEntryBulkActionSelectionDto,
  ApplicationListGetDetailDto,
  ApplicationListGetPrintDto,
  ApplicationListsApi,
  BulkActionPreviewResponseDto,
  BulkActionSelectionType,
  BulkActionType,
  EntryPage,
  PrintApplicationListsRequestParams,
} from '@openapi';
import { ApplicationsListFormService } from '@services/applications-list/applications-list-form.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { BulkPrintRequest } from '@shared-types/pdf/pdf.types';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getHttpStatus, getProblemText } from '@util/http-error-to-text';
import { MojButtonMenu, MojButtonMenuDirective } from '@util/moj-button-menu';
import {
  handlePrintContinuous as handlePrintContinuousPdf,
  handlePrintPage as handlePrintPagePdf,
} from '@util/pdf-utils';
import { PlaceFieldsBase } from '@util/place-fields.base';
import {
  ServerPaginatedSelectionPatch,
  buildPageSelectionPatch,
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
  private readonly printRequest = signal<BulkPrintRequest | null>(null);

  private readonly loadFailed = signal(false);
  readonly submitAttempt = signal(0);
  private selectAllRequestVersion = 0;

  override form = this.appListFormService.createUpdateForm();

  statusOptions = appListDetailStatusOptions;
  columns = appListDetailColumns;

  suggestionsFacade = buildSuggestionsFacade(this);

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  readonly tableRows = computed(() => this.vm().rows);

  readonly tableSelectedIds = computed(() => {
    const vm = this.vm();

    if (!vm.isFilterSelection) {
      return vm.selectedIds;
    }

    return new Set(
      this.tableRows()
        .map((row) => row['id'])
        .filter(
          (id): id is string =>
            typeof id === 'string' && !vm.excludedEntryIds.has(id),
        ),
    );
  });

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

      const uploadState = history.state as { msg: string; jobId: string };

      if (!uploadState.msg || !uploadState.jobId) {
        return;
      }

      this.vm().bulkUploadDone = true;
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
      updateFeesDone: false,
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

    // GET /application-lists/print
    setupLoadEffect(
      {
        request: this.printRequest,
        load: (req: BulkPrintRequest) =>
          this.appListApi.printApplicationLists(
            {
              bulkGetApplicationListEntriesRequestDto:
                req.body.bulkGetApplicationListEntriesRequestDto,
            },
            undefined,
            undefined,
            {
              transferCache: false,
            },
          ),
        onSuccess: async (dto) => {
          const mode = this.printRequest()?.mode;
          this.printRequest.set(null);

          if (!mode) {
            return;
          }

          try {
            if (!dto?.length) {
              this.detailSignalState.patch({
                errorSummary: [
                  {
                    text: APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint,
                  },
                ],
              });
              return;
            }

            if (mode === 'page') {
              await this.handlePrintPage(dto);
              return;
            }

            await this.handlePrintContinuous(dto);
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
    const vm = this.vm();
    return vm.isFilterSelection
      ? Math.max(vm.totalEntries - vm.excludedEntryIds.size, 0)
      : vm.selectedIds.size;
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
    const excludedEntryIds = new Set(vm.excludedEntryIds);

    if (vm.isFilterSelection) {
      const visibleIds = this.tableRows().map((row) => row['id']) as string[];
      for (const id of visibleIds) {
        if (!selectedIds.has(id)) {
          excludedEntryIds.add(id);
        } else {
          excludedEntryIds.delete(id);
        }
      }
    }

    this.detailSignalState.patch({
      selectedIds,
      allMatchingSelected: vm.isFilterSelection
        ? excludedEntryIds.size === 0
        : isAllMatchingSelected(selectedIds, vm.totalEntries),
      excludedEntryIds,
    });
  }

  onSelectedRowsChange(rows: Row[]): void {
    this.detailSignalState.patch({ selectedRows: rows });
  }

  onHeaderSelectAllChange(checked: boolean): void {
    if (checked) {
      this.onSelectAllMatchingClick();
      return;
    }

    this.clearSelection();
  }

  onSelectAllMatchingClick(): void {
    if (!this.id) {
      this.detailSignalState.patch({ isSelectingAll: false });
      return;
    }

    const visibleRows = this.tableRows();
    const selectedIds = new Set(
      visibleRows.map((row) => row['id']),
    ) as Set<string>;

    this.detailSignalState.patch({
      isSelectingAll: false,
      selectedIds,
      selectedRows: visibleRows,
      allMatchingSelected: true,
      errorSummary: [],
      errorHint: '',
      isFilterSelection: true,
      excludedEntryIds: new Set<string>(),
    });
  }

  clearSelection(): void {
    this.invalidateSelectAllRequest();
    this.detailSignalState.patch({
      selectedIds: new Set<string>(),
      selectedRows: [],
      isSelectingAll: false,
      allMatchingSelected: false,
      isFilterSelection: false,
      excludedEntryIds: new Set<string>(),
    });
  }

  async onUpdateOfficialsButtonClick(): Promise<void> {
    const preview = await this.getBulkPreview(BulkActionType.UPDATE_OFFICIALS);

    if (!preview) {
      return;
    }

    const rows = mapEntrySummaryRows(preview.entries);

    // clear any prior messages
    this.detailSignalState.patch({ errorSummary: [], errorHint: '' });

    const updateOfficialsApplications = rows.map((r) => ({
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
    const preview = await this.getBulkPreview(BulkActionType.RESULT_SELECTED);

    if (!preview) {
      return;
    }

    const rows = mapEntrySummaryRows(preview.entries);

    // clear any prior messages
    this.detailSignalState.patch({ errorSummary: [], errorHint: '' });

    const resultingApplications = rows.map((r) => ({
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
    const preview = await this.getBulkPreview(
      BulkActionType.UPDATE_FEE_DETAILS,
    );

    if (!preview) {
      return;
    }

    const rows = mapEntrySummaryRows(preview.entries);

    // clear any prior messages
    this.detailSignalState.patch(clearUpdateNotificationsPatch());

    const eligibleCount = preview?.eligibleCount;
    const ineligibleCount = preview?.ineligibleCount;

    if (eligibleCount === 0) {
      this.detailSignalState.patch({
        errorSummary: [
          {
            text: 'Cannot update application(s) that do not require a fee',
          },
        ],
      });
      return;
    }

    const rowsToUpdate = rows.filter((row) => row.feeReq === 'Yes');

    const entriesToUpdateFee = rowsToUpdate.map((r) => ({
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
        removedApplicationsWarning: ineligibleCount !== 0,
        entriesToUpdateFee,
      },
    });
  }

  async onMoveButtonClick(): Promise<void> {
    const preview = await this.getBulkPreview(BulkActionType.MOVE_ENTRIES);

    if (!preview) {
      return;
    }

    const rows = mapEntrySummaryRows(preview.entries);

    this.detailSignalState.patch(clearUpdateNotificationsPatch());

    const entriesToMove = rows.map((r) => ({
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

  async onPrintContinuousClick(): Promise<void> {
    // clear any prior messages
    this.detailSignalState.patch(clearUpdateNotificationsPatch());
    this.detailSignalState.patch({ pdfLoading: true });
    if (!this.id) {
      this.detailSignalState.patch({ pdfLoading: false });
      return;
    }

    const preview = await this.getBulkPreview(BulkActionType.PRINT_CONTINUOUS);

    if (!preview) {
      this.detailSignalState.patch({ pdfLoading: false });
      return;
    }

    const entryIds = preview.entryIds;

    const params: PrintApplicationListsRequestParams = {
      bulkGetApplicationListEntriesRequestDto: {
        listIds: [this.id],
        ...(entryIds.length !== 0 && {
          entryIds: [...new Set(entryIds)], // Omitting this returns all entries
        }),
      },
    };

    this.printRequest.set({
      body: params,
      mode: 'continuous',
    });
  }

  async onPrintPageClick(): Promise<void> {
    // clear any prior messages
    this.detailSignalState.patch(clearUpdateNotificationsPatch());
    this.detailSignalState.patch({ pdfLoading: true });
    if (!this.id) {
      this.detailSignalState.patch({ pdfLoading: false });
      return;
    }

    const preview = await this.getBulkPreview(BulkActionType.PRINT_PAGE);

    if (!preview) {
      this.detailSignalState.patch({ pdfLoading: false });
      return;
    }

    const entryIds = preview.entryIds;

    const params: PrintApplicationListsRequestParams = {
      bulkGetApplicationListEntriesRequestDto: {
        listIds: [this.id],
        ...(entryIds.length !== 0 && {
          entryIds: [...new Set(entryIds)], // Omitting this returns all entries
        }),
      },
    };

    this.printRequest.set({
      body: params,
      mode: 'page',
    });
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
      isFilterSelection: false,
      excludedEntryIds: new Set<string>(),
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
      isFilterSelection: false,
      excludedEntryIds: new Set<string>(),
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

  private invalidateSelectAllRequest(): void {
    this.selectAllRequestVersion += 1;
  }

  private async getBulkPreview(
    action: BulkActionType,
    entryIds?: Set<string>,
    forceIds = false,
  ): Promise<BulkActionPreviewResponseDto | null> {
    const vm = this.vm();
    const listId = this.id;
    const isFilterSelection = vm.isFilterSelection && !forceIds;

    const selectionParams: ApplicationListEntryBulkActionSelectionDto = {
      selectionType: isFilterSelection
        ? BulkActionSelectionType.FILTER
        : BulkActionSelectionType.IDS,
      ...(!isFilterSelection && {
        entryIds: [...(entryIds ?? vm.selectedIds)],
      }),
      ...(isFilterSelection && {
        filter: vm.getFilters,
      }),
      ...(isFilterSelection &&
        vm.excludedEntryIds.size > 0 && {
          excludedEntryIds: [...vm.excludedEntryIds],
        }),
    };

    const params: ApplicationListEntryBulkActionPreviewRequestDto = {
      action,
      selection: selectionParams,
    };

    try {
      const response = await firstValueFrom(
        this.appListEntriesApi.applicationListEntryBulkActionPreview({
          listId,
          applicationListEntryBulkActionPreviewRequestDto: params,
        }),
      );
      this.detailSignalState.patch({ previewRows: response });
      return response;
    } catch (err) {
      const code = getHttpStatus(err);
      let msg: string;

      if (code === 413) {
        msg =
          'Affected rows exceeds 1050. Please reduce the number of rows selected';
      } else {
        msg = getProblemText(err);
      }

      this.detailSignalState.patch({ errorSummary: [{ text: msg }] });
      return null;
    }
  }

  private async handlePrintPage(
    dto: ApplicationListGetPrintDto[],
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
    dto: ApplicationListGetPrintDto[],
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
