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
import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, NgZone, OnInit, PLATFORM_ID } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { FormRaw } from '../../core/models/forms/forms.types';
import { ReferenceDataFacade } from '../../core/services/reference-data.facade';
import { IF_MATCH } from '../../shared/context/concurrency-context';

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
import {
  Row,
  SelectableSortableTableComponent,
} from '@components/selectable-sortable-table/selectable-sortable-table.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  ApplicationListGetDetailDto,
  ApplicationListStatus,
  ApplicationListUpdateDto,
  ApplicationListsApi,
} from '@openapi';
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
  templateUrl: './applications-list-detail.html',
  styleUrls: ['./applications-list-detail.scss'],
})
export class ApplicationsListDetail extends PlaceFieldsBase implements OnInit {
  id!: string;
  private etag: string | null = null;

  currentPage = 1;
  totalPages = 0;

  pageSize = 10;

  selectedIds = new Set<string>();
  selectedRows: Row[] = [];

  isLoading = true;
  private hasPrefilledFromApi = false;

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

  rows: {
    id: string;
    sequenceNumber: number;
    accountNumber: string | null;
    applicant: string | null;
    respondent: string | null;
    postCode: string | null;
    title: string;
    feeReq: string;
    resulted: string;
  }[] = [];

  // Flags
  updateDone: boolean = false;
  updateInvalid: boolean = false;

  // Error logging
  unpopField: ErrorItem[] = [];
  errorHint: string = '';
  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly refField: ReferenceDataFacade,
    private readonly appListApi: ApplicationListsApi,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly menus: MojButtonMenu,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refField);

    const st = isPlatformBrowser(this.platformId)
      ? (history.state as { row?: Handoff })?.row
      : undefined;

    this.id = st?.id ?? this.route.snapshot.paramMap.get('id') ?? '';

    if (isPlatformBrowser(this.platformId)) {
      this.loadApplicationsLists();
    }
  }

  get noEntries(): boolean {
    return (
      !this.isLoading && !this.updateInvalid && (this.rows?.length ?? 0) === 0
    );
  }

  loadApplicationsLists(): void {
    if (!this.id) {
      return;
    }

    this.isLoading = true;

    this.appListApi
      .getApplicationList(
        {
          listId: String(this.id),
          page: this.currentPage - 1,
          size: this.pageSize,
        },
        'response',
        false,
        { transferCache: false },
      )
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {
          const dto = res.body!;
          this.etag = res.headers.get('ETag') ?? this.etag;

          if (!this.hasPrefilledFromApi) {
            this.prefillFromApi(dto);
            this.hasPrefilledFromApi = true;
          }

          const items = dto?.entriesSummary ?? [];
          // map API items → table rows
          this.rows = items.map((e) => ({
            id: e.uuid,
            sequenceNumber: e.sequenceNumber,
            accountNumber: this.formatDisplayText(e.accountNumber),
            applicant: this.formatDisplayText(e.applicant),
            respondent: this.formatDisplayText(e.respondent),
            postCode: this.formatDisplayText(e.postCode),
            title: e.applicationTitle,
            feeReq: e.feeRequired ? 'Yes' : 'No',
            resulted: e.result ? 'Yes' : 'No',
          }));

          // compute total pages
          const total = dto?.entriesCount ?? items.length;
          this.totalPages =
            total > this.pageSize ? Math.ceil(total / this.pageSize) : 0;

          // success → clear any prior error banner
          this.updateInvalid = false;
          this.errorHint = '';

          // keep selection in sync with visible rows
          this.reconcileSelectionToVisible();

          // Re-init MOJ button menus AFTER DOM paint (browser-only)
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
        error: (err) => {
          this.updateInvalid = true;
          this.errorHint = getProblemText(err);
          this.rows = [];
          this.totalPages = 0;
          this.selectedIds.clear();
        },
      });
  }

  onResultButtonClick(): void {
    const selectedRows = this.selectedRows as selectedRow[];
    const resultedApplications: selectedRow[] = selectedRows.filter(
      (r) => r.resulted === 'Yes',
    );
    const unResultedApplications: selectedRow[] = selectedRows.filter(
      (r) => r.resulted === 'No',
    );
    let mixedResultedAndUnresultedApplications!: boolean;
    this.unpopField = [];

    if (this.selectedRows.length === 0) {
      this.unpopField.push({
        text: 'No applications selected. Please select at least one application to result.',
      });
      return;
    }

    if (unResultedApplications.length === 0) {
      const message =
        resultedApplications.length === 1
          ? 'This application has already been resulted.'
          : 'These applications have already been resulted.';

      this.unpopField.push({ text: message });
      return;
    }

    const resultingApplications = unResultedApplications.map((r) => ({
      sequenceNumber: r.sequenceNumber,
      applicant: r.applicant,
      respondent: r.respondent,
      title: r.title,
    }));

    if (resultedApplications.length > 0 && unResultedApplications.length > 0) {
      mixedResultedAndUnresultedApplications = true;
    } else {
      mixedResultedAndUnresultedApplications = false;
    }

    void this.router.navigate(['result-selected'], {
      relativeTo: this.route,
      state: { resultingApplications, mixedResultedAndUnresultedApplications },
    });
  }

  onSelectedRowsChange(rows: Row[]): void {
    this.selectedRows = rows;
  }

  onUpdate(): void {
    this.updateInvalid = false;
    this.unpopField = [];
    this.updateDone = false;

    const raw = this.form.getRawValue() as DetailFormRaw;

    const conflict = validateCourtVsLocOrCja(raw);
    if (conflict) {
      this.updateInvalid = true;
      this.errorHint = conflict;

      return;
    }

    this.buildErrorSummary();

    if (this.unpopField.length) {
      this.updateInvalid = true;
      this.errorHint = 'There is a problem...';

      return;
    }

    // Confirmation window
    if (isPlatformBrowser(this.platformId)) {
      const ok = globalThis.confirm(
        'Are you sure you want to update this Application List?',
      );
      if (!ok) {
        return;
      }
    }

    const dur = this.form.controls.duration.value;
    const durationHours = this.toNum(dur?.hours);
    const durationMinutes = this.toNum(dur?.minutes);
    const isDurHours = durationHours !== undefined;
    const isDurMins = durationMinutes !== undefined;

    let payload: ApplicationListUpdateDto;
    try {
      const normalized = buildNormalizedPayload(raw);
      payload = {
        ...normalized,
        ...(isDurHours && Number.isInteger(durationHours)
          ? { durationHours }
          : {}),
        ...(isDurMins && Number.isInteger(durationMinutes)
          ? { durationMinutes }
          : {}),
      } as ApplicationListUpdateDto;

      const context = new HttpContext().set(IF_MATCH, this.etag ?? null);

      this.appListApi
        .updateApplicationList(
          {
            listId: String(this.id),
            applicationListUpdateDto: payload,
          },
          'response',
          false,
          { context },
        )
        .subscribe({
          next: (res) => {
            this.etag = res.headers.get('ETag') ?? this.etag;
            this.updateDone = true;
          },
          error: (err: HttpErrorResponse) => {
            this.updateInvalid = true;
            this.setHttpError(err);
          },
        });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.updateInvalid = true;
      this.errorHint = msg;
      return;
    }
  }

  // TO DO: Temporary function for bug fix ARCPOC-852, this component needs to be refactored to use cleaner error handling for the different scenarios
  // e.g. generic object to hold error state & messages, id's. Utilise generic error-summary functions for form errors
  private setHttpError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 412:
        this.unpopField.push({
          text: 'Resource changed. Reload and try again.',
        });
        break;
      case 404:
        this.unpopField.push({ id: 'court', text: getProblemText(err) });
        break;
      default:
        this.unpopField.push({ text: getProblemText(err) });
        break;
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;

    // —— Select-all behaviour fix option:
    // Clear any previous selections when changing pages to avoid stale state.
    // (If you prefer to persist across pages, remove this line and rely on reconcileSelectionToVisible)
    this.selectedIds.clear();

    this.loadApplicationsLists();
  }

  async openUpdate(entryId: string): Promise<void> {
    await this.router.navigate(['/applications-list', entryId, 'update'], {
      state: { appListId: this.id },
      queryParams: { appListId: this.id },
    });
  }

  // —— Select-all behaviour helpers ————————————————

  /** Keep selection limited to IDs visible on the current page. */
  private reconcileSelectionToVisible(): void {
    const visible = new Set(this.rows.map((r) => r.id));
    this.selectedIds = new Set(
      [...this.selectedIds].filter((id) => visible.has(id)),
    );
  }

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

  private buildErrorSummary(): void {
    const { date, time, duration } = this.form.controls;
    const dateErrors = date.errors as DateControlErrors;
    const timeErrors = time.errors as TimeControlErrors;
    const durationErrors = duration.errors as DurationControlErrors;
    const durationValue = duration.value;

    this.unpopField = collectMissing(this.form.getRawValue() as DetailFormRaw, {
      dateInvalid: !!dateErrors?.dateInvalid,
      dateErrorText: dateErrors?.dateErrorText ?? '',
      durationErrorText: timeErrors?.durationErrorText ?? '',
    });

    if (durationErrors && durationValue) {
      const { hours, minutes } = durationValue;
      const hoursInvalid = hours === null || Number.isNaN(hours);
      const minutesInvalid = minutes === null || Number.isNaN(minutes);

      const hoursText = durationErrors.hoursErrorText;
      const minutesText = durationErrors.minutesErrorText;

      if (hoursInvalid && hoursText) {
        this.unpopField.push({
          id: 'duration-hours',
          text: hoursText,
        });
      }

      if (minutesInvalid && minutesText) {
        this.unpopField.push({
          id: 'duration-minutes',
          text: minutesText,
        });
      }
    }
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
      const area = this.cja.find((a) => a.code === dto.cjaCode) ?? {
        code: dto.cjaCode,
      };
      this.selectCja(area);

      this.form.patchValue({
        location: dto.otherLocationDescription,
      });
    }
  }
}
