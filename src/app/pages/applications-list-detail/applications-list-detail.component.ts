/*
Main component for /application-list/:id

Functionality:
  On page load:
    - Takes application list row from applications-list page and populates
    list-detail page
*/

import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ApplicationsListUpdateComponent,
  closeValidationEntries,
} from './applications-list-update/applications-list-update.component';
import {
  ApplicationsListDetailState,
  initialApplicationsListDetailState,
} from './util/applications-list-detail.state';
import {
  DetailForm,
  Handoff,
  LoadDetailReq,
  UpdateReq,
  selectedRow,
} from './util/applications-list-detail.types';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { Duration } from '@components/duration-input/duration-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import { SelectableSortableTableComponent } from '@components/selectable-sortable-table/selectable-sortable-table.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { RESULT_ERROR_MESSAGES } from '@constants/application-list-detail-update/error-messages';
import {
  appListDetailColumns,
  appListDetailStatusOptions,
} from '@constants/application-list-detail-update/form-table-structure';
import { IF_MATCH } from '@context/concurrency-context';
import { Row } from '@core-types/table/row.types';
import { ApplicationListGetDetailDto, ApplicationListsApi } from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenu, MojButtonMenuDirective } from '@util/moj-button-menu';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { parseTimeToDuration } from '@util/time-helpers';
import { closePermitted } from '@validators/applications-list-close.validator';
import { cjaMustExistIfTypedValidator } from '@validators/cja-exists.validator';
import { courtLocCjaValidator } from '@validators/court-or-cja.validator';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ErrorSummaryComponent,
    SuccessBannerComponent,
    PageHeaderComponent,
    ApplicationsListUpdateComponent,
    SelectableSortableTableComponent,
    PaginationComponent,
    NotificationBannerComponent,
    MojButtonMenuDirective,
  ],
  templateUrl: './applications-list-detail.component.html',
  styleUrls: ['./applications-list-detail.component.scss'],
})
export class ApplicationsListDetail extends PlaceFieldsBase implements OnInit {
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly refField = inject(ReferenceDataFacade);
  private readonly appListApi = inject(ApplicationListsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly menus = inject(MojButtonMenu);

  id!: string;
  etag: string | null = null;

  private readonly detailSignalState =
    createSignalState<ApplicationsListDetailState>(
      initialApplicationsListDetailState,
    );

  readonly vm = this.detailSignalState.vm;

  private readonly loadRequest = signal<LoadDetailReq | null>(null);
  private readonly updateRequest = signal<UpdateReq | null>(null);
  entryIds: string[] = [];

  override form: DetailForm = new FormGroup(
    {
      date: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      time: new FormControl<Duration | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      description: new FormControl<string>('', {
        nonNullable: true,
        validators: [(c) => Validators.required(c)],
      }),
      status: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      court: new FormControl<string>(''),
      location: new FormControl<string>(''),
      cja: new FormControl<string>(''),
      duration: new FormControl<Duration | null>(null),
    },
    {
      validators: [
        courtLocCjaValidator(),
        cjaMustExistIfTypedValidator({
          getTyped: () => this.state().cjaSearch ?? '',
          getValidCodes: () => this.state().cja.map((x) => x.code),
        }),
        closePermitted({
          getEntries: () => closeValidationEntries(this.vm()),
        }),
      ],
    },
  );

  statusOptions = appListDetailStatusOptions;
  columns = appListDetailColumns;

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refField);

    this.setupEffects();

    const st = isPlatformBrowser(this.platformId)
      ? (history.state as { row?: Handoff })?.row
      : undefined;

    this.id = st?.id ?? this.route.snapshot.paramMap.get('id') ?? '';

    if (isPlatformBrowser(this.platformId)) {
      this.loadApplicationsLists();
    }
  }

  private setupEffects(): void {
    // GET /application-lists/{listId}/entries
    setupLoadEffect(
      {
        request: this.loadRequest,
        load: (req: LoadDetailReq) =>
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
              selectedIds: new Set<string>(),
            });
            this.entryIds = [];
            this.loadRequest.set(null);
            return;
          }

          this.etag = res.headers.get('ETag') ?? this.etag;

          const vm = this.vm();

          if (!vm.hasPrefilledFromApi) {
            this.prefillFromApi(dto);
            this.detailSignalState.patch({ hasPrefilledFromApi: true });
          }

          const items = dto.entriesSummary ?? [];
          const rows: selectedRow[] = items.map((e) => ({
            id: e.uuid,
            sequenceNumber: e.sequenceNumber,
            accountNumber: e.accountNumber ?? null,
            applicant: e.applicant ?? null,
            respondent: e.respondent ?? null,
            postCode: e.postCode ?? null,
            title: e.applicationTitle,
            feeReq: e.feeRequired ? 'Yes' : 'No',
            resulted: e.result ? 'Yes' : 'No',
          }));

          const total = dto.entriesCount ?? items.length;
          const pageSize = vm.pageSize;
          const totalPages = total > pageSize ? Math.ceil(total / pageSize) : 0;

          const visible = new Set(rows.map((r) => r.id));
          const selectedIds = new Set(
            [...vm.selectedIds].filter((id) => visible.has(id)),
          );

          this.detailSignalState.patch({
            isLoading: false,
            updateInvalid: false,
            errorHint: '',
            errorSummary: [],
            rows,
            totalPages,
            selectedIds,
            entriesDetails: [],
          });

          this.loadRequest.set(null);
          this.entryIds = rows.map((r) => r.id);

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
          this.detailSignalState.patch({
            isLoading: false,
            updateInvalid: true,
            errorHint: getProblemText(err),
            errorSummary: [{ text: getProblemText(err) }],
            rows: [],
            totalPages: 0,
            selectedIds: new Set<string>(),
          });
          this.entryIds = [];
          this.loadRequest.set(null);
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
  }

  get noEntries(): boolean {
    const vm = this.vm();
    return !vm.isLoading && !vm.updateInvalid && (vm.rows?.length ?? 0) === 0;
  }

  loadApplicationsLists(): void {
    if (!this.id) {
      return;
    }

    this.detailSignalState.patch({ isLoading: true });
    const vm = this.vm();

    this.loadRequest.set({
      id: this.id,
      pageNumber: vm.currentPage - 1,
      pageSize: vm.pageSize,
    });
  }

  onSelectedRowsChange(rows: Row[]): void {
    this.detailSignalState.patch({ selectedRows: rows });
  }

  onResultButtonClick(): void {
    const selected = this.vm().selectedRows as selectedRow[];

    const resultedApplications = selected.filter((r) => r.resulted === 'Yes');
    const unResultedApplications = selected.filter((r) => r.resulted === 'No');

    // clear any prior messages
    this.detailSignalState.patch({ errorSummary: [], errorHint: '' });

    if (unResultedApplications.length === 0) {
      const message =
        resultedApplications.length === 1
          ? RESULT_ERROR_MESSAGES.singleResulted
          : RESULT_ERROR_MESSAGES.allResulted;

      this.detailSignalState.patch({
        updateInvalid: true,
        errorHint: 'There is a problem',
        errorSummary: [{ text: message }],
      });
      return;
    }

    const resultingApplications = unResultedApplications.map((r) => ({
      sequenceNumber: r.sequenceNumber,
      applicant: r.applicant,
      respondent: r.respondent,
      title: r.title,
    }));

    const mixedResultedAndUnresultedApplications =
      resultedApplications.length > 0 && unResultedApplications.length > 0;

    void this.router.navigate(['result-selected'], {
      relativeTo: this.route,
      state: { resultingApplications, mixedResultedAndUnresultedApplications },
    });
  }

  readonly patchStateFn = (
    patch: Partial<ApplicationsListDetailState>,
  ): void => {
    this.detailSignalState.patch(patch);
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
      selectedIds: new Set(), // same behaviour as today
    });
    this.loadApplicationsLists();
  }

  async openUpdate(row: Partial<selectedRow>): Promise<void> {
    await this.router.navigate(['/applications-list', row.id, 'update'], {
      state: {
        appListId: this.id,
        resultApplicantContext: {
          applicant: row.applicant,
          respondent: row.respondent,
          title: row.title,
        },
      },
      queryParams: { appListId: this.id },
    });
  }

  private prefillFromApi(dto: ApplicationListGetDetailDto): void {
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
      this.selectCourthouse({
        locationCode: dto.courtCode,
        name: dto.courtName ?? undefined,
      });
    } else if (dto.cjaCode) {
      const area = this.state().cja.find((a) => a.code === dto.cjaCode) ?? {
        code: dto.cjaCode,
      };
      this.selectCja(area);

      this.form.patchValue({
        location: dto.otherLocationDescription,
      });
    }
  }
}
