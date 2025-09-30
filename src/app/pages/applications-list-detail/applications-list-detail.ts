import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { DurationInputComponent } from '../../shared/components/duration-input/duration-input.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';

type DurationValue = { hours: string; minutes: string };

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
  ],
  templateUrl: './applications-list-detail.html',
})
export class ApplicationsListDetail implements AfterViewInit {
  id!: number;
  currentFragment: string | null = null;

  status = [
    { label: 'Choose', value: 'choose' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  currentPage = 1;
  totalPages = 5;

  form = new FormGroup({
    date: new FormControl<string | null>(null),
    time: new FormControl<string>(''),
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
    { header: 'Sequence number', field: 'sequenceNumber', sortable: true },
    { header: 'Account number', field: 'accountNumber', sortable: true },
    { header: 'Applicant', field: 'applicant', sortable: true },
    { header: 'Respondent', field: 'respondent', sortable: true },
    { header: 'Post code', field: 'postCode', sortable: true, numeric: true },
    { header: 'Title', field: 'title', sortable: true },
    { header: 'Fee req', field: 'feeReq', sortable: true },
    { header: 'Resulted', field: 'resulted', sortable: true },
    { header: 'Actions', field: 'actions' },
  ];

  ngAfterViewInit(): void {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
  }

  loadApplicationsLists(): void {
    // TODO: fetch lists
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplicationsLists(); // fetch page `page`
  }
}
