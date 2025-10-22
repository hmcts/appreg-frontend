/* 
Main component for /application-list/:id

Functionality:
  onUpdate:
    - TODO finish header
*/

import { CommonModule } from '@angular/common';
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
import { attachLocationDisabler } from '../../shared/util/attach-location-disabler';
import { buildNormalizedPayload } from '../../shared/util/build-payload';
import { collectMissing } from '../../shared/util/collect-missing';
import {
  onCjaInputChange,
  onCourthouseInputChange,
  selectCja as selectCjaHelper,
  selectCourthouse as selectCourthouseHelper,
} from '../../shared/util/court-cja-text-suggestions';
import { focusField, onCreateErrorClick as onCreateErrorClickFn } from '../../shared/util/error-click';
import type { FormRaw } from '../../shared/util/types/application-list/types';
import { validateCourtVsLocOrCja } from '../../shared/util/validate-court-vs-loc-cja';


type DurationValue = { hours: string; minutes: string };

type DetailFormRaw = Omit<
  FormRaw<ApplicationListStatus>,
  'date' | 'time' | 'status'
> & {
  date: string | null;
  time: Duration | null;
  status: string | null;
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
  id!: number;
  currentFragment: string | null = null;
  private locationDisabler?: Subscription;
  private version = 0; // Used in update

  status = [
    { label: 'Choose', value: 'choose' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  currentPage = 1;
  totalPages = 5;

  form = new FormGroup({
    date: new FormControl<string | null>(null),
    time: new FormControl<Duration | null>(null),
    description: new FormControl<string>('', {
      validators: [(c) => Validators.required(c)],
    }),
    status: new FormControl<string>('', {
      validators: [(c) => Validators.required(c)],
    }),
    court: new FormControl<string>(''),
    location: new FormControl<string>(''),
    cja: new FormControl<string>(''),
    duration: new FormControl<DurationValue | null>(null),
  });

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

    if (this.form.invalid) {
      this.updateInvalid = true;
      this.errorHint = 'There is a problem...';
      this.buildErrorSummary();
      console.log(this.unpopField);
      return;
    }

    let payload: ApplicationListUpdateDto;
    try {
      const normalized = buildNormalizedPayload(raw);
      payload = {
        ...normalized,
        version: this.version,
      } as ApplicationListUpdateDto;

      console.log(payload);

      // this.appListApi
      //   .updateApplicationList({
      //     id: String(this.id),
      //     applicationListUpdateDto: payload,
      //   })
      //   .subscribe({
      //     next: () => {
      //       this.updateDone = true;
      //     },
      //     error: (err) => {
      //       const msg = err instanceof Error ? err.message : String(err);
      //       this.updateInvalid = true;
      //       this.errorHint = msg;
      //     },
      //   });
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
}
