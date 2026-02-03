/**
 * TODO: arcpoc-816
 * prio 3
 * Refactor large detail view with paging/selection, multiple flags, subscribe without takeUntil.
 */

/*
Main component for /application-list/:id

Functionality:
  On page load:
    - Takes application list row from applications-list page and populates
    list-detail page
  onUpdate:
    - Input validation
    - Window confirmation of update
    - Create payload with If-match etag in header
    - PUT request sent with payload and row ID
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
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ApplicationsListDetailState,
  initialApplicationsListDetailState,
} from './util/applications-list-detail.state';

import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '@components/duration-input/duration-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { SelectableSortableTableComponent } from '@components/selectable-sortable-table/selectable-sortable-table.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { IF_MATCH } from '@context/concurrency-context';
import { FormRaw } from '@core-types/forms/forms.types';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListGetDetailDto,
  ApplicationListStatus,
  ApplicationListUpdateDto,
  ApplicationListsApi,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { buildNormalizedPayload } from '@util/build-payload';
import { collectMissing } from '@util/collect-missing';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getProblemText } from '@util/http-error-to-text';
import { validateCourtVsLocOrCja } from '@util/location-suggestion-helpers';
import { MojButtonMenu, MojButtonMenuDirective } from '@util/moj-button-menu';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { parseTimeToDuration } from '@util/time-helpers';
import {
  DateControlErrors,
  DurationControlErrors,
  TimeControlErrors,
} from '@util/types/applications-list-entry/types';

type DetailFormRaw = Omit<
  FormRaw<ApplicationListStatus>,
  'date' | 'time' | 'status'
> & {
  date: string | null;
  time: Duration | null;
  status: string | null;
};

type Handoff = {
  id: string;
  date: string | null;
  time: string | null;
  description: string | null;
  status: ApplicationListStatus;
  location: string;
  etag: string | null;
  version: number;
};

type selectedRow = {
  id: string;
  sequenceNumber: number;
  accountNumber: string | null;
  applicant: string | null;
  respondent: string | null;
  postCode: string | null;
  title: string;
  feeReq: 'Yes' | 'No';
  resulted: 'Yes' | 'No';
};

type LoadDetailReq = { id: string; page: number; size: number };
type UpdateReq = {
  id: string;
  payload: ApplicationListUpdateDto;
  etag: string | null;
};

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DurationInputComponent,
    DateInputComponent,
    TextInputComponent,
    SelectInputComponent,
    PaginationComponent,
    BreadcrumbsComponent,
    SuggestionsComponent,
    ErrorSummaryComponent,
    SuccessBannerComponent,
    PageHeaderComponent,
    SelectableSortableTableComponent,
    MojButtonMenuDirective,
    NotificationBannerComponent,
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
  private etag: string | null = null;

  private readonly detailSignalState =
    createSignalState<ApplicationsListDetailState>(
      initialApplicationsListDetailState,
    );

  readonly vm = this.detailSignalState.vm;

  private readonly loadRequest = signal<LoadDetailReq | null>(null);
  private readonly updateRequest = signal<UpdateReq | null>(null);

  override form = new FormGroup({
    date: new FormControl<string | null>(null),
    time: new FormControl<Duration | null>(null),
    description: new FormControl<string>('', {
      validators: [(c) => Validators.required(c)],
    }),
    status: new FormControl<string | null>(null),
    court: new FormControl<string>(''),
    location: new FormControl<string>(''),
    cja: new FormControl<string>(''),
    duration: new FormControl<Duration | null>(null),
  });

  statusOptions = [
    { value: '', label: 'Choose status' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ];

  columns = [
    { header: 'Sequence number', field: 'sequenceNumber' },
    { header: 'Account number', field: 'accountNumber' },
    { header: 'Applicant', field: 'applicant' },
    { header: 'Respondent', field: 'respondent' },
    { header: 'Post code', field: 'postCode' },
    { header: 'Title', field: 'title' },
    { header: 'Fee req', field: 'feeReq' },
    { header: 'Resulted', field: 'resulted' },
    { header: 'Actions', field: 'actions', sortable: false },
  ];

  RESULT_ERROR_MESSAGES = {
    singleResulted: 'This application has already been resulted.',
    allResulted: 'These applications have already been resulted.',
  };

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
    setupLoadEffect(
      {
        request: this.loadRequest,

        load: (req: LoadDetailReq) =>
          this.appListApi.getApplicationList(
            { listId: req.id, page: req.page, size: req.size },
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
          });

          this.loadRequest.set(null);

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
          this.loadRequest.set(null);
        },
      },
      this.envInjector,
    );

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
              ? this.mapUpdateError(httpErr)
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
      page: vm.currentPage - 1,
      size: vm.pageSize,
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
          ? this.RESULT_ERROR_MESSAGES.singleResulted
          : this.RESULT_ERROR_MESSAGES.allResulted;

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

  onUpdate(): void {
    // reset flags/errors
    this.detailSignalState.patch({
      updateInvalid: false,
      updateDone: false,
      errorSummary: [],
      errorHint: '',
    });

    const raw = this.form.getRawValue() as DetailFormRaw;

    const conflict = validateCourtVsLocOrCja(raw);
    if (conflict) {
      this.detailSignalState.patch({
        updateInvalid: true,
        errorHint: conflict,
      });
      return;
    }

    //CJA Validation
    const cjaTyped = (this.state().cjaSearch ?? '').trim();
    const cjaCode = String(raw.cja ?? '').trim();
    if (cjaTyped) {
      const exists = this.state().cja.some((x) => x.code === cjaCode);
      if (!exists) {
        this.detailSignalState.patch({
          updateInvalid: true,
          errorSummary: [
            { id: 'cja', text: APPLICATIONS_LIST_ERROR_MESSAGES.cjaNotFound },
          ],
        });
        return;
      }
    }

    // build validation errors
    const errors = this.buildErrorSummaryItems();
    if (errors.length) {
      this.detailSignalState.patch({
        updateInvalid: true,
        errorHint: 'There is a problem',
        errorSummary: errors,
      });
      return;
    }

    // build payload
    const dur = this.form.controls.duration.value;
    const durationHours = this.toNum(dur?.hours);
    const durationMinutes = this.toNum(dur?.minutes);

    try {
      const normalized = buildNormalizedPayload(raw);
      const payload: ApplicationListUpdateDto = {
        ...normalized,
        ...(Number.isInteger(durationHours) ? { durationHours } : {}),
        ...(Number.isInteger(durationMinutes) ? { durationMinutes } : {}),
      } as ApplicationListUpdateDto;

      this.updateRequest.set({ id: this.id, payload, etag: this.etag });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.detailSignalState.patch({
        updateInvalid: true,
        errorHint: msg,
      });
    }
  }

  // TODO: Temporary function for bug fix ARCPOC-852, this component needs to be refactored to use cleaner error handling for the different scenarios
  // e.g. generic object to hold error state & messages, id's. Utilise generic error-summary functions for form errors
  private mapUpdateError(err: HttpErrorResponse): ErrorItem[] {
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

  // —— Select-all behaviour helpers ————————————————

  private readonly formatDisplayText = (
    v: string | null | undefined,
  ): string => {
    if (v === null || v === undefined) {
      return '—';
    }

    const trimmed = v.trim();

    if (trimmed === '') {
      return '—';
    }

    return v;
  };

  private buildErrorSummaryItems(): ErrorItem[] {
    const { date, time, duration } = this.form.controls;
    const dateErrors = date.errors as DateControlErrors;
    const timeErrors = time.errors as TimeControlErrors;
    const durationErrors = duration.errors as DurationControlErrors;
    const durationValue = duration.value;

    const items: ErrorItem[] = collectMissing(
      this.form.getRawValue() as DetailFormRaw,
      {
        dateInvalid: !!dateErrors?.dateInvalid,
        dateErrorText: dateErrors?.dateErrorText ?? '',
        durationErrorText: timeErrors?.durationErrorText ?? '',
      },
    );

    if (durationErrors && durationValue) {
      const { hours, minutes } = durationValue;

      const hoursInvalid = hours === null || Number.isNaN(hours);
      const minutesInvalid = minutes === null || Number.isNaN(minutes);

      if (hoursInvalid && durationErrors.hoursErrorText) {
        items.push({
          id: 'duration-hours',
          text: durationErrors.hoursErrorText,
        });
      }

      if (minutesInvalid && durationErrors.minutesErrorText) {
        items.push({
          id: 'duration-minutes',
          text: durationErrors.minutesErrorText,
        });
      }
    }

    return items;
  }

  private readonly toNum = (
    v: string | number | null | undefined,
  ): number | undefined => {
    if (v === null || v === undefined) {
      return undefined;
    }

    if (typeof v === 'number') {
      return Number.isFinite(v) ? v : undefined;
    }

    const s = v.trim();
    if (s === '') {
      return undefined;
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

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

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().errorSummary.find((e) => e.id === id);
  }
}
