import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID, TransferState } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
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
import {
  SortableTableComponent,
  TableColumn,
} from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

type ApplicationListRow = {
  id: number;
  date: string;
  time: string;
  location: string;
  description: string;
  entries: number;
  status: 'Open' | 'Closed';
};

interface MojInitEl extends HTMLElement {
  __mojInit?: boolean;
}

interface MojInitEl extends HTMLElement {
  __mojInit?: boolean;
}

type ApplicationListRow = {
  id: number;
  date: string;
  time: string;
  location: string;
  description: string;
  entries: number;
  status: 'Open' | 'Closed';
};

interface MojInitEl extends HTMLElement {
  __mojInit?: boolean;
}

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
    // TODO: Use cache where possible


    this.loadCJAs();
    this.loadCourtLocations();

    // Disable based fields
    const court = this.form.controls.court;
    const location = this.form.controls.location;
    const cja = this.form.controls.cja;

    const has = (v: string | null) => !!v && v.trim().length > 0;
    const syncDisable = () => {
      const hasCourt = has(court.value);
      const hasLoc = has(location.value);
      const hasCja = has(cja.value);

      if (hasCourt) {
        court.enable({ emitEvent: false });
        location.disable({ emitEvent: false });
        cja.disable({ emitEvent: false });
      } else if (hasLoc || hasCja) {
        court.disable({ emitEvent: false });
        location.enable({ emitEvent: false });
        cja.enable({ emitEvent: false });
      } else {
        court.enable({ emitEvent: false });
        location.enable({ emitEvent: false });
        cja.enable({ emitEvent: false });
      }
    };

    merge(
      court.valueChanges,
      location.valueChanges,
      cja.valueChanges,
    ).subscribe(() => syncDisable());
    syncDisable();

    // Suggestions
    const currentCourthouse = this.form.controls.court.value;
    if (typeof currentCourthouse === 'string' && currentCourthouse.trim()) {
      this.courthouseSearch = currentCourthouse;
    }

    const currentCja = this.form.controls.cja.value;
    if (typeof currentCja === 'string' && currentCja.trim()) {
      this.cjaSearch = currentCja;
    }

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
  }

  onResultSelected(): void {}

  // Close when clicking anywhere else
  @HostListener('document:click')
  onDocClick(): void {
    this.openPrintSelectForId = null;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.openMenuForId = null;
  }

  onPrint(): void {
    // TODO: your print flow per row
  }

  onPrintContinuous(): void {
    // TODO: your continuous print flow per row
  }
}
