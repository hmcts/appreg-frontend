import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';

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
import {
  ApplicationListEntriesApi,
  EntryGetSummaryDto,
  GetEntriesRequestParams,
} from '../../../generated/openapi';
import { ReferenceDataFacade } from '../../core/services/reference-data.facade';

import {
  hasAnyApplicationsEntrySearchParams,
  loadApplicationsEntrySearchQuery,
} from './util/query-helper';
import { mapEntrySummaryDtoToApplicationRow } from './util/row-helpers';

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
import {
  ApplicationRow,
  ApplicationsSearchFormValue,
} from '@shared-types/applications/applications-form';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { PlaceFieldsBase } from '@util/place-fields.base';

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
  ],
  templateUrl: './applications.html',
})
export class Applications extends PlaceFieldsBase implements OnInit, OnDestroy {
  private readonly refFacade = inject(ReferenceDataFacade);
  private readonly appListApi = inject(ApplicationListEntriesApi);

  private readonly destroy$ = new Subject<void>();

  isLoading: boolean = false;
  submitted: boolean = false;
  isSearch: boolean = false;

  // Error summary
  searchErrors: { id: string; text: string }[] = [];
  errorSummary: ErrorItem[] = [];

  rows: EntryGetSummaryDto[] = [];
  tableRows: ApplicationRow[] = [];

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

    this.resetFlags();

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
      filter: loadApplicationsEntrySearchQuery(
        this.form.getRawValue() as ApplicationsSearchFormValue,
      ),
    };

    this.isLoading = true;

    this.appListApi
      .getEntries(params, undefined, undefined, { transferCache: false })
      .subscribe({
        next: (page) => {
          this.rows = page?.content ?? [];
          this.tableRows = this.rows.map((r) =>
            mapEntrySummaryDtoToApplicationRow(r),
          );
          this.totalPages = page?.totalPages ?? 1;
          this.isLoading = false;
        },
        error: () => {
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

  get searchDisabled(): boolean {
    return !hasAnyApplicationsEntrySearchParams(
      this.form.getRawValue() as ApplicationsSearchFormValue,
    );
  }

  private resetFlags() {
    this.searchErrors = [];
    this.submitted = true;
    this.isSearch = true;
    this.rows = [];
  }
}
