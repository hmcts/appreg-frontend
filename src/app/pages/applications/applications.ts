import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';

import {
  ApplicationListEntriesApi,
  EntryGetFilterDto,
  EntryGetSummaryDto,
  GetEntriesRequestParams,
} from '../../../generated/openapi';
import { ReferenceDataFacade } from '../../core/services/reference-data.facade';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '../../shared/components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '../../shared/components/notification-banner/notification-banner.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { toStatus } from '../../shared/util/application-status-helpers';
import { has } from '../../shared/util/has';
import { PlaceFieldsBase } from '../../shared/util/place-fields.base';

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
  ],
  templateUrl: './applications.html',
})
export class Applications extends PlaceFieldsBase implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading: boolean = false;
  submitted: boolean = false;
  isSearch: boolean = false;

  // Error summary
  errorHint: string = 'There is a problem';
  searchErrors: { id: string; text: string }[] = [];
  errorSummary: ErrorItem[] = [];

  rows: EntryGetSummaryDto[] = [];

  override form = new FormGroup({
    date: new FormControl<string | null>(null),
    applicantOrg: new FormControl<string>(''),
    respondentOrg: new FormControl<string>(''),
    applicantSurname: new FormControl<string>(''),
    respondentSurname: new FormControl<string>(''),
    location: new FormControl<string>(''),
    standardApplicantCode: new FormControl<string>(''),
    respondentPostcode: new FormControl<string>(''),
    accountReference: new FormControl<string>(''),
    court: new FormControl<string>(''),
    cja: new FormControl<string>(''),
    status: new FormControl<string | null>(null),
  });

  currentPage = 1;
  totalPages = 5;
  pageSize = 10;

  columns = [
    { header: 'Date', field: 'date' },
    { header: 'Applicant', field: 'applicant' },
    { header: 'Respondent', field: 'respondent' },
    { header: 'Application title', field: 'title' },
    { header: 'Fee', field: 'fee' },
    { header: 'Resulted', field: 'resulted' },
    { header: 'Status', field: 'status' },
    { header: 'Actions', field: 'actions', sortable: false },
  ];

  status = [
    { label: 'Choose', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  constructor(
    private readonly refFacade: ReferenceDataFacade,
    private readonly appListApi: ApplicationListEntriesApi,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refFacade);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? 'search';

    // Reset flag
    this.searchErrors = [];
    this.submitted = true;
    this.isSearch = true;
    this.rows = [];

    if (action === 'search') {
      this.loadApplications();
    }
  }

  loadApplications(): void {
    if (this.isLoading === true) {
      // Prevent query when query is already running
      return;
    }

    const dateCtrl = this.form.controls.date;
    if (dateCtrl.errors?.['dateInvalid']) {
      this.searchErrors.push({
        id: 'date-day',
        text: dateCtrl.errors['dateErrorText'] as string,
      });
    }

    if (this.searchErrors.length) {
      return;
    }

    const params: GetEntriesRequestParams = {
      page: this.currentPage - 1,
      size: this.pageSize,
      filter: this.loadQuery(),
    };

    this.isLoading = true;

    this.appListApi
      .getEntries(params, undefined, undefined, { transferCache: false })
      .subscribe({
        next: (page) => {
          this.rows = page?.content ?? [];
          this.totalPages = page?.totalPages ?? 1;
          this.isLoading = false;
        },
        error: () => {
          this.errorHint = 'There is a problem';
          this.searchErrors.push({
            id: '',
            text: 'There was a problem retrieving the applications. Try again.',
          });
          this.isLoading = false;
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplications(); // fetch page `page`
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

  get searchDisabled(): boolean {
    return !this.hasAnyParams();
  }
}
