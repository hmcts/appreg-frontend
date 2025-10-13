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
import { Subscription, firstValueFrom } from 'rxjs';

import {
  ApplicationListGetSummaryDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
} from '../../../generated/openapi';
import { ReferenceDataFacade } from '../../core/services/reference-data.facade';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '../../shared/components/duration-input/duration-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '../../shared/components/error-summary/error-summary.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import {
  SortableTableComponent,
  TableColumn,
} from '../../shared/components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import {
  IF_MATCH,
  ROW_VERSION,
} from '../../shared/context/concurrency-context';
import { attachLocationDisabler } from '../../shared/util/attach-location-disabler';
import {
  cjaMatches,
  courtMatches,
  filterSuggestions,
} from '../../shared/util/suggestions';

type UiExtras = {
  deletable?: boolean;
  etag?: string | null;
  rowVersion?: string | null;
};

type ApplicationListRow = Omit<
  ApplicationListGetSummaryDto,
  'numberOfEntries'
> & {
  entries: ApplicationListGetSummaryDto['numberOfEntries'];
} & UiExtras;

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
    SuccessBannerComponent,
    ErrorSummaryComponent,
    SuggestionsComponent,
  ],
  templateUrl: './applications-list.html',
})
export class ApplicationsList implements OnInit, AfterViewInit {
  private _id: string | undefined;
  private locationDisabler?: Subscription;
  openMenuForId: string | null = null;
  openPrintSelectForId: string | null = null;

  // CJA and Court locations store
  cja: CriminalJusticeAreaGetDto[] = [];
  filteredCja: CriminalJusticeAreaGetDto[] = [];
  cjaSearch = '';

  courtLocations: CourtLocationGetSummaryDto[] = [];
  filteredCourthouses: CourtLocationGetSummaryDto[] = [];
  courthouseSearch = '';

  // Flags
  submitted: boolean = false;
  isSearch: boolean = false;
  deleteDone = false;
  deleteInvalid = false;

  // Error summary
  errorHint = '';
  searchErrors: { id: string; text: string }[] = [];
  errorSummary: ErrorItem[] = [];

  deletingId: string | null = null;

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
    private readonly courtLocationApi: CourtLocationsApi,
    private readonly ref: ReferenceDataFacade,
    private readonly appListsApi: ApplicationListsApi,
  ) {}

  ngOnInit(): void {
    this.loadApplicationsLists();
    this.courthouseSearch = String(this.form.controls.court.value ?? '');
    this.cjaSearch = String(this.form.controls.cja.value ?? '');

    this.ref.courtLocations$.subscribe(
      (items) => (this.courtLocations = items),
    );
    this.ref.cja$.subscribe((items) => (this.cja = items));

    // Disable based fields
    this.locationDisabler = attachLocationDisabler({
      court: this.form.controls.court,
      location: this.form.controls.location,
      cja: this.form.controls.cja,
    });
  }

  ngOnDestroy(): void {
    this.locationDisabler?.unsubscribe();
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

          const instance = new ButtonMenu(flagged);
          if (typeof (instance as { init?: () => void }).init === 'function') {
            instance.init();
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

    // Reset flag
    this.searchErrors = [];
    this.submitted = false;
    this.isSearch = false;
    this.rows = [];

    // Get form values
    const query = {
      date: this.form.value.date,
      time: this.form.value.time,
      description: this.form.value.description,
      status: this.form.value.status,
      court: this.form.value.court,
      location: this.form.value.location,
      cja: this.form.value.cja,
    };

    this.errorHint = 'An error has occurred...';

    const dateCtrl = this.form.controls.date;
    const timeCtrl = this.form.controls.time;
    if (dateCtrl.errors?.['dateInvalid']) {
      this.searchErrors.push({
        id: 'date-day',
        text: dateCtrl.errors['dateErrorText'] as string,
      });
    }

    if (timeCtrl.errors?.['durationInvalid']) {
      this.searchErrors.push({
        id: 'time-hours',
        text: timeCtrl.errors['durationErrorText'] as string,
      });
    }

    const hasAny =
      query.date ||
      query.time ||
      query.description ||
      query.status ||
      query.court ||
      query.location ||
      query.cja;

    if (action === 'search') {
      this.submitted = true;
      this.isSearch = true;
      if (!hasAny) {
        // No values found in form, run GET ALL
        // TODO: run GET ALL

        // This is placeholder code
        this.rows = [
          {
            id: '101',
            date: '2025-09-29',
            time: '09:30',
            location: 'Birmingham',
            description: 'Morning list',
            entries: 12,
            status: ApplicationListStatus.OPEN,
          },
        ];
      } else {
        // Values found, run query with parameters
        // TODO: run GET with params

        // Placeholder code
        this.rows = [
          {
            id: '102',
            date: '2025-09-30',
            time: '09:31',
            location: 'Place',
            description: 'Morning list',
            entries: 12,
            status: ApplicationListStatus.OPEN,
          },
        ];
      }
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
        status: ApplicationListStatus.OPEN,
      },
      {
        id: '102',
        date: '2025-09-29',
        time: '13:45',
        location: 'Birmingham',
        description: 'Afternoon list',
        entries: 8,
        status: ApplicationListStatus.CLOSED,
      },
      {
        id: '103',
        date: '2025-09-30',
        time: '10:00',
        location: 'Manchester',
        description: 'Applications block',
        entries: 16,
        status: ApplicationListStatus.OPEN,
      },
      {
        id: '104',
        date: '2025-09-30',
        time: '14:15',
        location: 'Manchester',
        description: 'Enforcement',
        entries: 5,
        status: ApplicationListStatus.CLOSED,
      },
      {
        id: '105',
        date: '2025-10-01',
        time: '09:00',
        location: 'Bristol',
        description: 'Housing list',
        entries: 20,
        status: ApplicationListStatus.OPEN,
      },
      {
        id: '106',
        date: '2025-10-01',
        time: '11:30',
        location: 'Bristol',
        description: 'Small claims',
        entries: 9,
        status: ApplicationListStatus.OPEN,
      },
      {
        id: '107',
        date: '2025-10-02',
        time: '10:45',
        location: 'Leeds',
        description: 'Family applications',
        entries: 14,
        status: ApplicationListStatus.CLOSED,
      },
      {
        id: '108',
        date: '2025-10-02',
        time: '15:00',
        location: 'Leeds',
        description: 'Costs review',
        entries: 6,
        status: ApplicationListStatus.OPEN,
      },
    ];
  }

  onCourthouseInputChange(): void {
    this.form.controls.court.setValue(this.courthouseSearch || '');
    this.filteredCourthouses = filterSuggestions(
      this.courtLocations,
      this.courthouseSearch,
      courtMatches,
    );
  }

  onCjaInputChange(): void {
    this.form.controls.cja.setValue(this.cjaSearch || '');
    this.filteredCja = filterSuggestions(this.cja, this.cjaSearch, cjaMatches);
  }

  selectCourthouse(c: { locationCode?: string }): void {
    const label = c.locationCode ?? '';
    this.courthouseSearch = label;
    this.form.controls.court.setValue(label);
    this.filteredCourthouses = [];
  }

  selectCja(c: { code?: string }): void {
    const label = c.code ?? '';
    this.cjaSearch = label;
    this.form.controls.cja.setValue(label);
    this.filteredCja = [];
  }

  focusField(id: string, e: Event): void {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }

  async onDelete(row: ApplicationListRow): Promise<void> {
    if (row.deletable === false) {
      this.deleteInvalid = true;
      this.errorHint = 'There is a problem';
      this.errorSummary = [{ text: 'This list cannot be deleted.' }];
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

    this.deleteDone = false;
    this.deleteInvalid = false;
    this.errorHint = '';
    this.errorSummary = [];
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
        this.deleteDone = true;
      }
    } catch (err: unknown) {
      const status = getHttpStatus(err);
      this.deleteInvalid = true;
      this.errorHint = 'There is a problem';

      switch (status) {
        case 401:
          this.errorSummary = [
            {
              text: 'You are not signed in. Please sign in and try again.',
              href: '/sign-in',
            },
          ];
          break;
        case 403:
          this.errorSummary = [
            {
              text: 'You do not have permission to delete this list.',
              href: '/applications-list#sortable-table',
            },
          ];
          break;
        case 404:
          this.errorSummary = [
            {
              text: 'Application List not found. Return to the Lists view.',
              href: '/applications-list#sortable-table',
            },
          ];
          break;
        case 409:
          this.errorSummary = [
            {
              text: 'This list has entries or is in a non-deletable state.',
              href: '/applications-list#sortable-table',
            },
          ];
          break;
        case 412:
          this.errorSummary = [
            {
              text: 'The list has changed. Refresh the page and try again.',
              href: '/applications-list#sortable-table',
            },
          ];
          break;
        default:
          this.errorSummary = [
            {
              text: 'Unable to delete list. Please try again later.',
              href: '/applications-list#sortable-table',
            },
          ];
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

  @HostListener('document:click')
  onDocClick(): void {
    this.openPrintSelectForId = null;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.openMenuForId = null;
  }

  onPrint(): void {}

  onPrintContinuous(): void {}
}
