import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

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
import {
  IF_MATCH,
  ROW_VERSION,
} from '../../shared/context/concurrency-context';

import { ApplicationListsApi } from 'src/generated/openapi/api/application-lists.service';

type ApplicationListRow = {
  id: string;
  date: string;
  time: string;
  location: string;
  description: string;
  entries: number;
  status: 'Open' | 'Closed';
  deletable?: boolean;
  etag?: string | null;
  rowVersion?: string | null;
};

interface MojInitEl extends HTMLElement {
  __mojInit?: boolean;
}

function getHttpStatus(err: unknown): number {
  if (err instanceof HttpErrorResponse) {
    return err.status;
  }
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const s = (err as Record<string, unknown>)['status'];
    if (typeof s === 'number') {
      return s;
    }
  }
  return 0;
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
export class ApplicationsList implements OnInit, AfterViewInit {
  private _id: string | undefined; // kept only if you still need it elsewhere
  openMenuForId: string | null = null;
  openPrintSelectForId: string | null = null;

  // ✅ NEW: UI state for success/inline error + delete-in-progress
  banner: { type: 'success' | 'error' | null; text: string } = {
    type: null,
    text: '',
  };
  errorInline: string | null = null;
  deletingId: string | null = null;

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

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    // ✅ NEW: inject the generated API
    private readonly appListsApi: ApplicationListsApi,
  ) {}

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
    // Hard-coded sample data for now (ids as strings to match API)
    this.rows = [
      {
        id: '101',
        date: '2025-09-29',
        time: '09:30',
        location: 'Birmingham',
        description: 'Morning list',
        entries: 12,
        status: 'Open',
      },
      {
        id: '102',
        date: '2025-09-29',
        time: '13:45',
        location: 'Birmingham',
        description: 'Afternoon list',
        entries: 8,
        status: 'Closed',
      },
      {
        id: '103',
        date: '2025-09-30',
        time: '10:00',
        location: 'Manchester',
        description: 'Applications block',
        entries: 16,
        status: 'Open',
      },
      {
        id: '104',
        date: '2025-09-30',
        time: '14:15',
        location: 'Manchester',
        description: 'Enforcement',
        entries: 5,
        status: 'Closed',
      },
      {
        id: '105',
        date: '2025-10-01',
        time: '09:00',
        location: 'Bristol',
        description: 'Housing list',
        entries: 20,
        status: 'Open',
      },
      {
        id: '106',
        date: '2025-10-01',
        time: '11:30',
        location: 'Bristol',
        description: 'Small claims',
        entries: 9,
        status: 'Open',
      },
      {
        id: '107',
        date: '2025-10-02',
        time: '10:45',
        location: 'Leeds',
        description: 'Family applications',
        entries: 14,
        status: 'Closed',
      },
      {
        id: '108',
        date: '2025-10-02',
        time: '15:00',
        location: 'Leeds',
        description: 'Costs review',
        entries: 6,
        status: 'Open',
      },
    ];
  }

  async onDelete(row: ApplicationListRow): Promise<void> {
    if (row.deletable === false) {
      this.errorInline = 'This list cannot be deleted.';
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      const ok = window.confirm(
        'Are you sure you want to delete this Application List?',
      );
      if (!ok) {
        return;
      }
    }

    this.errorInline = null;
    this.banner = { type: null, text: '' };
    this.deletingId = row.id;

    const context = new HttpContext()
      .set(IF_MATCH, row.etag ?? null)
      .set(ROW_VERSION, row.rowVersion ?? null);

    try {
      const resp = await firstValueFrom(
        this.appListsApi.deleteApplicationList(
          { id: row.id },
          'response',
          false,
          { context },
        ),
      );

      if (resp.status === 200 || resp.status === 204) {
        this.rows = this.rows.filter((r) => r.id !== row.id);
        this.banner = {
          type: 'success',
          text: 'Application List deleted successfully',
        };
      }
    } catch (err: unknown) {
      const status = getHttpStatus(err);
      switch (status) {
        case 401:
          this.errorInline =
            'You are not signed in. Please sign in and try again.';
          break;
        case 403:
          this.errorInline = 'You do not have permission to delete this list.';
          break;
        case 404:
          this.errorInline =
            'Application List not found. Return to the Lists view.';
          break;
        case 409:
          this.errorInline =
            'This list has entries or is in a non-deletable state.';
          break;
        case 412:
          this.errorInline =
            'The list has changed. Refresh the page and try again.';
          break;
        default:
          this.banner = {
            type: 'error',
            text: 'Unable to delete list. Please try again later.',
          };
          break;
      }
    } finally {
      this.deletingId = null;
    }
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
