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
import { HttpContext } from '@angular/common/http';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ApplicationListStatus,
  ApplicationListUpdateDto,
  ApplicationListsApi,
} from '../../../generated/openapi';
import { ReferenceDataFacade } from '../../core/services/reference-data.facade';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '../../shared/components/duration-input/duration-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '../../shared/components/error-summary/error-summary.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SelectableSortableTableComponent } from '../../shared/components/selectable-sortable-table/selectable-sortable-table.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import {
  IF_MATCH,
  ROW_VERSION,
} from '../../shared/context/concurrency-context';
import { buildNormalizedPayload } from '../../shared/util/build-payload';
import { collectMissing } from '../../shared/util/collect-missing';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '../../shared/util/error-click';
import { MojButtonMenuDirective } from '../../shared/util/moj-button-menu';
import { PlaceFieldsBase } from '../../shared/util/place-fields.base';
import type { FormRaw } from '../../shared/util/types/application-list/types';
import { validateCourtVsLocOrCja } from '../../shared/util/validate-court-vs-loc-cja';
import {
  getHttpStatus,
  getProblemText,
} from '../applications-list/util/delete-status';


type DurationValue = { hours: string; minutes: string };

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
    SelectableSortableTableComponent,
    MojButtonMenuDirective,
  ],
  templateUrl: './applications-list-detail.html',
})
export class ApplicationsListDetail extends PlaceFieldsBase implements OnInit {
  id!: string;
  currentFragment: string | null = null;
  private version = 0;
  private etag: string | null = null;

  currentPage = 1;
  totalPages = 5;

  selectedIds = new Set<string>();

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
    duration: new FormControl<DurationValue | null>(null),
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

  rows = [
    {
      id: 'list-0001',
      sequenceNumber: 1,
      accountNumber: '12345678',
      applicant: 'Jane Smith',
      respondent: 'John Smith',
      postCode: 'SW1A 1AA',
      title: 'Interim order',
      feeReq: 'Yes',
      resulted: 'No',
    },
    {
      id: 'list-0002',
      sequenceNumber: 2,
      accountNumber: '87654321',
      applicant: 'Acme Ltd',
      respondent: 'Doe Holdings',
      postCode: 'M1 2AB',
      title: 'Variation',
      feeReq: 'No',
      resulted: 'Yes',
    },
    {
      id: 'list-0003',
      sequenceNumber: 3,
      accountNumber: '11223344',
      applicant: 'Robert Brown',
      respondent: 'City Council',
      postCode: 'B2 4QA',
      title: 'Permission to appeal',
      feeReq: 'Yes',
      resulted: 'No',
    },
  ];

  // Flags
  updateDone = false;
  updateInvalid = false;

  // Error logging
  unpopField: ErrorItem[] = [];
  errorHint = '';
  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly refField: ReferenceDataFacade,
    private readonly appListApi: ApplicationListsApi,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refField);

    // Set application list row
    const st = (history.state as { row?: Handoff }).row;
    if (st) {
      this.prefillPlaceFieldsFromSummary(st.location);
      this.id = st.id;
      this.etag = st.etag;
      this.version = st.version ?? this.version;
      this.form.patchValue({
        date: st.date ?? null,
        time: st.time
          ? { hours: +st.time.slice(0, 2), minutes: +st.time.slice(3, 5) }
          : null,
        description: st.description ?? '',
        status: st.status.trim().toLowerCase(),
        duration: null,
      });
    }
  }

  onSubmit(): void {
    // Submission is only on list-details -> Update
    if (this.form.invalid) {
      this.form.markAllAsTouched();
    }
  }

  loadApplicationsLists(): void {
    // TODO: fetch lists
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

      const context = new HttpContext()
        .set(IF_MATCH, this.etag ?? null)
        .set(ROW_VERSION, String(this.version));

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
          error: (err) => {
            this.updateInvalid = true;
            const errorStatus = getHttpStatus(err);
            if (errorStatus === 412) {
              this.errorHint = 'Resource changed. Reload and try again.';
              return;
            }
            this.errorHint = getProblemText(err);
          },
        });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.updateInvalid = true;
      this.errorHint = msg;
      return;
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplicationsLists();
  }

  private buildErrorSummary(): void {
    const de = this.form.controls.date.errors as {
      dateInvalid?: boolean;
      dateErrorText?: string;
    } | null;
    const te = this.form.controls.time.errors as {
      durationErrorText?: string;
    } | null;
    const durErr = this.form.controls.duration.errors as {
      durationErrorText?: string;
    } | null;
    const dur = this.form.controls.duration.value as Duration | null;

    this.unpopField = collectMissing(this.form.getRawValue() as DetailFormRaw, {
      dateInvalid: !!de?.dateInvalid,
      dateErrorText: de?.dateErrorText ?? '',
      durationErrorText: te?.durationErrorText ?? '',
    });

    if (durErr?.durationErrorText) {
      if (dur?.hours !== null) {
        this.unpopField.push({
          id: 'duration-hours',
          text: durErr.durationErrorText,
        });
      }
      if (dur?.minutes !== null) {
        this.unpopField.push({
          id: 'duration-minutes',
          text: durErr.durationErrorText,
        });
      }
    }
  }

  private prefillPlaceFieldsFromSummary(name: string | null | undefined): void {
    if (!name?.trim()) {
      return;
    }

    // Prevent attempting to load form if CJA and court locations aren't loaded
    if (!this.courtLocations.length && !this.cja.length) {
      return;
    }

    const raw = name.trim();
    const label = raw.toLowerCase();

    const area = this.cja.find(
      (a) =>
        a.code === raw ||
        (a.description ?? a.code ?? '').toLowerCase() === label,
    );
    if (area) {
      this.selectCja({ code: area.code });
      this.form.patchValue({ court: '', location: '' });
      return;
    }

    const court = this.courtLocations.find(
      (c) =>
        c.locationCode === raw ||
        (c.name ?? c.locationCode ?? '').toLowerCase() === label,
    );
    if (court) {
      this.selectCourthouse({ locationCode: court.locationCode });
      this.form.patchValue({ cja: '', location: '' });
      return;
    }

    // Fallback: treat as "other location"
    this.form.patchValue({ location: raw, court: '', cja: '' });
    this.courthouseSearch = '';
    this.cjaSearch = '';
  }

  private readonly toNum = (v: string | undefined): number | undefined => {
    const s = v === null ? '' : String(v).trim();
    if (s === '') {
      return undefined;
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };
}
