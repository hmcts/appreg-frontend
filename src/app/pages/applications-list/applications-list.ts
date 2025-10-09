import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { merge } from 'rxjs';

import {
  ApplicationListGetSummaryDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
  ListApplicationListsRequestParams,
} from '../../..//generated/openapi';
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
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

interface MojInitEl extends HTMLElement {
  __mojInit?: boolean;
}

// Reuse the generated model for queries but remove ID
export type ApplicationListGetQuery = Omit<ApplicationListGetSummaryDto, 'id'>;

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
    SuggestionsComponent,
    SuggestionsComponent,
  ],
  templateUrl: './applications-list.html',
})
export class ApplicationsList implements OnInit, AfterViewInit {
  private _id: number | undefined;
  openMenuForId: number | null = null;
  openPrintSelectForId: number | null = null;

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

  // Error summary
  errorHint = 'There is a problem';
  searchErrors: { id: string; text: string }[] = [];

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

  // Error summary
  errorHint = 'There is a problem';
  searchErrors: { id: string; text: string }[] = [];

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

  rows: ApplicationListGetSummaryDto[] = [];

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly cjaApi: CriminalJusticeAreasApi,
    private readonly courtLocationApi: CourtLocationsApi,
    private readonly applistApi: ApplicationListsApi,
  ) {}

  ngOnInit(): void {
    this.loadApplicationsLists(false); // Load all on init
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

    // Reset flag
    this.searchErrors = [];
    this.submitted = false;
    this.isSearch = false;
    this.rows = [];

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
      this.has(this.form.value.date) ||
      this.has(this.form.value.time) ||
      this.has(this.form.value.description) ||
      this.has(this.form.value.status) ||
      this.has(this.form.value.court) ||
      this.has(this.form.value.location) ||
      this.has(this.form.value.cja);

    if (action === 'search') {
      this.submitted = true;
      this.isSearch = true;

      this.loadApplicationsLists(hasAny);
    }
  }

  loadApplicationsLists(hasParams: boolean): void {
    // Hard-coded sample data for now

    if (!hasParams) {
      // GET ALL Applications lists
      this.applistApi.listApplicationLists().subscribe({
        next: (page) => {
          this.rows = page.content ?? [];
        },
        error: () => {
          this.rows = [];
        },
      });
    } else {
      const query = this.loadQuery();
      console.log(query);
      this.rows = [];
    }
  }

  private loadQuery(): ListApplicationListsRequestParams {
    // Load Query and ensure it conforms to model
    const { date, time, description, status, court, location, cja } =
      this.form.getRawValue();

    // ListApplicationListsRequestParams interface. DELETE WHEN DONE
    /* dateFrom?: string;
    dateTo?: string;
    courtLocationCode?: string;
    status?: ApplicationListStatus;
    page?: number;
    size?: number;
    sort?: Array<string>; */

    const query: ListApplicationListsRequestParams = {
      dateFrom: date?.trim(),
      time: this.toTimeString(time),
      description: description?.trim(),
      toStatus: this.toStatus(status),
      court: court?.trim(),
      location: location?.trim(),
      cja: cja?.trim(),
    };

    return query;
  }

  private toStatus(s: unknown): ApplicationListStatus {
    switch (String(s).toUpperCase()) {
      case 'OPEN':
        return ApplicationListStatus.OPEN;
      case 'CLOSED':
        return ApplicationListStatus.CLOSED;
      default:
        throw new Error('Invalid status');
    }
  }

  private toTimeString = (
    t: { hours: number | null; minutes: number | null } | null,
  ): string => {
    const hours = t?.hours;
    const minutes = t?.minutes;
    if (hours === null || minutes === null) {
      throw new Error('time required');
    }

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}:00`;
  };

  private loadCJAs(): void {
    this.cjaApi.getCriminalJusticeAreas().subscribe({
      next: (page) => {
        this.cja = page.content ?? [];
        // console.log(this.cja); // Sanity check
      },
      error: () => {
        this.cja = [];
      },
    });
  }

  private loadCourtLocations(): void {
    this.courtLocationApi.getCourtLocations().subscribe({
      next: (page) => {
        this.courtLocations = page.content ?? [];
        // console.log(this.courtLocations); // Sanity check
      },
      error: () => {
        this.courtLocations = [];
      },
    });
  }

  onCourthouseInputChange(): void {
    const q = this.courthouseSearch.trim().toLowerCase();
    this.form.controls.court.setValue(this.courthouseSearch || '');

    if (!q) {
      this.filteredCourthouses = [];
      return;
    }

    // filter by name or code; cap results to avoid long lists
    this.filteredCourthouses = this.courtLocations
      .filter(
        (c) =>
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.locationCode ?? '').toLowerCase().includes(q),
      )
      .slice(0, 20);
  }

  // called when user clicks a suggestion
  selectCourthouse(c: CourtLocationGetSummaryDto): void {
    const label = c.locationCode ?? '';
    this.courthouseSearch = label;
    this.form.controls.court.setValue(label);
    this.filteredCourthouses = [];
  }

  onCjaInputChange(): void {
    const q = this.cjaSearch.trim().toLowerCase();
    this.form.controls.cja.setValue(this.cjaSearch || '');

    if (!q) {
      this.filteredCja = [];
      return;
    }

    // filter by name or code; cap results to avoid long lists
    this.filteredCja = this.cja
      .filter(
        (c) =>
          (c.code ?? '').toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q),
      )
      .slice(0, 20);
  }

  // called when user clicks a suggestion
  selectCja(c: CriminalJusticeAreaGetDto): void {
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

  private has(x: unknown): boolean {
    return x !== null && x !== undefined && x !== '' && x !== 'choose';
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
