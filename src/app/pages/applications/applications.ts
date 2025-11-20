import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';

import { ApplicationListEntriesApi } from '../../../generated/openapi';
import { ReferenceDataFacade } from '../../core/services/reference-data.facade';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { Duration } from '../../shared/components/duration-input/duration-input.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
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
    SuggestionsComponent
  ],
  templateUrl: './applications.html',
})
export class Applications extends PlaceFieldsBase implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  override form = new FormGroup({
    date: new FormControl<string | null>(null),
    time: new FormControl<Duration | null>(null),
    applicantOrg: new FormControl<string>(''),
    registeredUser: new FormControl<string>(''),
    description: new FormControl<string>(''),
    status: new FormControl<string>('choose'),
    court: new FormControl<string>(''),
    location: new FormControl<string>(''),
    cja: new FormControl<string>(''),
  });

  currentPage = 1;
  totalPages = 5;

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
    { label: 'Choose', value: 'choose' },
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
  }

  loadApplications(): void {
    // TODO: fetch lists
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplications(); // fetch page `page`
  }
}
