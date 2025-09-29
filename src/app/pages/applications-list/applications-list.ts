import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApplicationListPage, ApplicationListsApi } from '../../../generated/openapi';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '../../shared/components/duration-input/duration-input.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateInputComponent,
    DurationInputComponent,
    TextInputComponent,
    SelectInputComponent,
    RouterLink,
    PaginationComponent,
    SortableTableComponent,
  ],
  templateUrl: './applications-list.html',
})
export class ApplicationsList implements OnInit {
  private _id: number | undefined;

  // ✅ Message rendered at the top of the page
  loginMsg: string | undefined;

  // Reactive form backing the template
  form = new FormGroup({
    date: new FormControl<string | null>(null),
    time: new FormControl<Duration | null>(null),
    description: new FormControl<string>(''),
    status: new FormControl<string>('choose'),
    court: new FormControl<string>(''),
    location: new FormControl<string>(''),
    cja: new FormControl<string>(''),
  });

  currentPage = 1;
  totalPages = 5;

  tableRows: {
    id: number;
    date: string;
    time: string;
    location: string;
    description: string;
    entries: number | string;
    status: string;
  }[] = [];

  constructor(private readonly listsApi: ApplicationListsApi) {}

  ngOnInit(): void {
    this.loadApplications();

    // 👇 Tiny SSR-friendly call to compute a “you have N lists” message
    // Passing 'body' selects the overload that returns ApplicationListPage (typed).
    this.listsApi.listApplicationLists({ page: 0, size: 1 }, 'body').subscribe({
      next: (page: ApplicationListPage) => {
        const total =
          (page).totalElements ??
          ((page).content?.length ?? 0);

        this.loginMsg = `Signed in successfully. You have ${total} application list${total === 1 ? '' : 's'}.`;
      },
      error: () => {
        // Non-fatal: still show the page if this probe fails for any reason
        this.loginMsg = 'Signed in successfully. Not calling backend';
      },
    });
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? 'search';

    if (action === 'search') {
      // TODO: handle search using `values`
    } else if (action === 'create') {
      // TODO: handle create using `values`
    }
  }

  loadApplications(): void {
    // TODO: fetch and map the current page of lists into `tableRows`
  }

  onDelete(id: number): void {
    this._id = id;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplications(); // fetch page `page`
  }
}
