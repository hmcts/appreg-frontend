import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { Duration } from '../../shared/components/duration-input/duration-input.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

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
  ],
  templateUrl: './applications.html',
})
export class Applications {
  form = new FormGroup({
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
    { header: 'Date', field: 'date', sortable: true },
    { header: 'Applicant', field: 'applicant', sortable: true },
    { header: 'Respondent', field: 'respondent', sortable: true },
    { header: 'Application title', field: 'title', sortable: true },
    { header: 'Fee', field: 'fee', sortable: true, numeric: false },
    { header: 'Resulted', field: 'resulted', sortable: true },
    { header: 'Status', field: 'status', sortable: true },
    { header: 'Actions', field: 'actions', sortable: false },
  ];

  status = [
    { label: 'Choose', value: 'choose' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

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
