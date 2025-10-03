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
  openMenuForId: number | null = null;
  openPrintSelectForId: number | null = null;

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

  columns: TableColumn[] = [
    { header: 'Date', field: 'date' },
    { header: 'Time', field: 'time' },
    { header: 'Location', field: 'location' },
    { header: 'Description', field: 'description' },
    { header: 'Entries', field: 'entries', numeric: true },
    { header: 'Status', field: 'status' },
    { header: 'Actions', field: 'actions', sortable: false },
  ];

  status = [
    { label: 'Choose', value: 'choose' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  rows: ApplicationListRow[] = [];

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit(): void {
    this.loadApplicationsLists();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    void import('@ministryofjustice/frontend')
      .then(({ ButtonMenu }) => {
        const nodes = document.querySelectorAll<HTMLElement>(
          '[data-module="moj-button-menu"]',
        );

        for (const el of nodes) {
          const flagged = el as MojInitEl;
          if (flagged.__mojInit) {
            continue;
          }

          // use the instance so 'no-new' doesn't complain
          const instance = new ButtonMenu(flagged);
          if (typeof (instance as { init?: () => void }).init === 'function') {
            instance.init(); // some versions require explicit init
          }

          flagged.__mojInit = true;
        }
      })
      .catch(() => {
        // no-op for non-browser/test environments
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

  loadApplicationsLists(): void {
    // Hard-coded sample data for now
    this.rows = [
      {
        id: 101,
        date: '2025-09-29',
        time: '09:30',
        location: 'Birmingham',
        description: 'Morning list',
        entries: 12,
        status: 'Open',
      },
      {
        id: 102,
        date: '2025-09-29',
        time: '13:45',
        location: 'Birmingham',
        description: 'Afternoon list',
        entries: 8,
        status: 'Closed',
      },
      {
        id: 103,
        date: '2025-09-30',
        time: '10:00',
        location: 'Manchester',
        description: 'Applications block',
        entries: 16,
        status: 'Open',
      },
      {
        id: 104,
        date: '2025-09-30',
        time: '14:15',
        location: 'Manchester',
        description: 'Enforcement',
        entries: 5,
        status: 'Closed',
      },
      {
        id: 105,
        date: '2025-10-01',
        time: '09:00',
        location: 'Bristol',
        description: 'Housing list',
        entries: 20,
        status: 'Open',
      },
      {
        id: 106,
        date: '2025-10-01',
        time: '11:30',
        location: 'Bristol',
        description: 'Small claims',
        entries: 9,
        status: 'Open',
      },
      {
        id: 107,
        date: '2025-10-02',
        time: '10:45',
        location: 'Leeds',
        description: 'Family applications',
        entries: 14,
        status: 'Closed',
      },
      {
        id: 108,
        date: '2025-10-02',
        time: '15:00',
        location: 'Leeds',
        description: 'Costs review',
        entries: 6,
        status: 'Open',
      },
    ];
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
