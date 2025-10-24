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
import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  ApplicationListStatus,
  ApplicationListUpdateDto,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
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
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import {
  IF_MATCH,
  ROW_VERSION,
} from '../../shared/context/concurrency-context';
import { attachLocationDisabler } from '../../shared/util/attach-location-disabler';
import { buildNormalizedPayload } from '../../shared/util/build-payload';
import { collectMissing } from '../../shared/util/collect-missing';
import {
  onCjaInputChange,
  onCourthouseInputChange,
  selectCja as selectCjaHelper,
  selectCourthouse as selectCourthouseHelper,
} from '../../shared/util/court-cja-text-suggestions';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '../../shared/util/error-click';
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
  court: string;
  location: string;
  cja: string;
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
    SortableTableComponent,
    PaginationComponent,
    BreadcrumbsComponent,
    SuggestionsComponent,
    ErrorSummaryComponent,
    SuccessBannerComponent,
  ],
  templateUrl: './applications-list-detail.html',
})
export class ApplicationsListDetail implements AfterViewInit, OnInit {
  id!: string;
  currentFragment: string | null = null;
  private locationDisabler?: Subscription;
  private version: number = 0; // Used in update
  private etag: string | null = null;

  currentPage = 1;
  totalPages = 5;

  form = new FormGroup({
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

  // Flags
  updateDone: boolean = false;
  updateInvalid: boolean = false;

  // Error logging
  unpopField: ErrorItem[] = [];
  errorHint: string = '';
  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  // CJA + Court location vars
  cja: CriminalJusticeAreaGetDto[] = [];
  filteredCja: CriminalJusticeAreaGetDto[] = [];
  cjaSearch = '';

  courtLocations: CourtLocationGetSummaryDto[] = [];
  filteredCourthouses: CourtLocationGetSummaryDto[] = [];
  courthouseSearch = '';

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly ref: ReferenceDataFacade,
    private readonly appListApi: ApplicationListsApi,
  ) {}

  ngOnInit(): void {
    this.courthouseSearch = String(this.form.controls.court.value ?? '');
    this.cjaSearch = String(this.form.controls.cja.value ?? '');

    this.ref.courtLocations$.subscribe(
      (items) => (this.courtLocations = items),
    );
    this.ref.cja$.subscribe((items) => (this.cja = items));

    // Disable based fields
    this.locationDisabler = attachLocationDisabler({
      court: this.form.controls.court,
      location: this.form.controls.location,
      cja: this.form.controls.cja,
    });

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

  ngAfterViewInit(): void {
    // Not implemented yet
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

    const toNum = (v: string | undefined): number | undefined => {
      const s = v === null ? '' : String(v).trim();
      if (s === '') {
        return undefined;
      }
      const n = Number(s);
      return Number.isFinite(n) ? n : undefined;
    };

    const dur = this.form.controls.duration.value;
    const durationHours = toNum(dur?.hours);
    const durationMinutes = toNum(dur?.minutes);
    const isDurHours = durationHours !== undefined;
    const isDurMins = durationMinutes !== undefined;

    let payload: ApplicationListUpdateDto;
    try {
      const normalized = buildNormalizedPayload(raw);
      payload = {
        ...normalized,
        version: this.version,
        ...(isDurHours ? { durationHours } : {}),
        ...(isDurMins ? { durationMinutes } : {}),
      } as ApplicationListUpdateDto;

      const context = new HttpContext()
        .set(IF_MATCH, this.etag ?? null)
        .set(ROW_VERSION, String(this.version));

      this.appListApi
        .updateApplicationList(
          {
            id: String(this.id),
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
    this.loadApplicationsLists(); // fetch page `page`
  }

  onCourthouseInputChange(): void {
    this.filteredCourthouses = onCourthouseInputChange(
      this.form,
      this.courthouseSearch,
      this.courtLocations,
    );
  }

  onCjaInputChange(): void {
    this.filteredCja = onCjaInputChange(this.form, this.cjaSearch, this.cja);
  }

  selectCourthouse(
    c: { locationCode?: string } | CourtLocationGetSummaryDto,
  ): void {
    const { courthouseSearch, filteredCourthouses } = selectCourthouseHelper(
      this.form,
      c,
    );
    this.courthouseSearch = courthouseSearch;
    this.filteredCourthouses = filteredCourthouses;
  }

  selectCja(c: { code?: string } | CriminalJusticeAreaGetDto): void {
    const { cjaSearch, filteredCja } = selectCjaHelper(this.form, c);
    this.cjaSearch = cjaSearch;
    this.filteredCja = filteredCja;
  }

  private buildErrorSummary(): void {
    const de = this.form.controls.date.errors as {
      dateInvalid?: boolean;
      dateErrorText?: string;
    } | null;
    const te = this.form.controls.time.errors as {
      durationErrorText?: string;
    } | null;

    this.unpopField = collectMissing(this.form.getRawValue() as DetailFormRaw, {
      dateInvalid: !!de?.dateInvalid,
      dateErrorText: de?.dateErrorText ?? '',
      durationErrorText: te?.durationErrorText ?? '',
    });
  }

  private prefillPlaceFieldsFromSummary(name: string): void {
    if (!name) {
      return;
    }

    console.log(this.courtLocations, this.cja, name);

    // Match court || cja
    const court = this.courtLocations.find(
      (c) => c.name ?? c.locationCode ?? '' === name,
    );
    if (court) {
      console.log('court hit');
      this.form.patchValue({
        court: court.locationCode,
      });
      return;
    }

    const area = this.cja.find((a) => a.code ?? a.description ?? '' === name);
    if (area) {
      console.log('cja hit');
      this.form.patchValue({ cja: area.code });
      return;
    }

    // fallback - set to null
    this.form.patchValue({ location: '', court: '', cja: '' });
  }
}
