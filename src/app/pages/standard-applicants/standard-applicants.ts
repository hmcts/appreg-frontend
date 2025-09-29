import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

@Component({
  selector: 'app-standard-applicants',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    TextInputComponent,
    PaginationComponent,
    SortableTableComponent,
  ],
  templateUrl: './standard-applicants.html',
})
export class StandardApplicants {
  currentPage = 1;
  totalPages = 5;

  form = new FormGroup({
    code: new FormControl<string>(''),
    name: new FormControl<string>(''),
  });

  columns = [
    { header: 'Code', field: 'code', sortable: true, numeric: true },
    { header: 'Name', field: 'name', sortable: true },
    { header: 'Address line 1', field: 'address', sortable: true },
    { header: 'Use from', field: 'useFrom', sortable: true },
    { header: 'Use to', field: 'useTo', sortable: true },
    { header: 'Actions', field: 'actions' },
  ];

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement;
    const action = btn.value; // "search" or "create"

    if (action === 'search') {
      // handle search…
    } else {
      // handle create…
    }
  }

  loadStandardApplicants(): void {
    // TODO: fetch lists
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadStandardApplicants(); // fetch page `page`
  }
}
