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
import { Subject, Subscription, firstValueFrom, takeUntil } from 'rxjs';

import {
  ApplicationListGetFilterDto,
  ApplicationListGetSummaryDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
  GetApplicationListsRequestParams,
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
  private readonly destroy$ = new Subject<void>();
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
  deleteDone: boolean = false;
  deleteInvalid: boolean = false;

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
  pageSize = 25;

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
    private readonly cjaApi: CriminalJusticeAreasApi,
    private readonly ref: ReferenceDataFacade,
    private readonly appListsApi: ApplicationListsApi,
  ) {}

  ngOnInit(): void {
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
    this.destroy$.next();
    this.destroy$.complete();
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
      this.currentPage = 1;
      this.loadApplicationsLists(hasAny);
    }
  }

  loadApplicationsLists(hasParams: boolean): void {
    const q: ApplicationListGetFilterDto = hasParams ? this.loadQuery() : {};

    const params: GetApplicationListsRequestParams = {
      filter: q,
      page: 0,
      size: this.pageSize,
      sort: ['date,desc', 'time,desc'],
    };

    this.appListsApi
      .getApplicationLists(params, undefined, undefined, {
        transferCache: false,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.searchErrors = [];
          this.submitted = true;
          this.totalPages = page.totalPages ?? 0;
          const content = page.content ?? [];
          this.rows = content.map((x) => this.toRow(x));
        },
        error: (err) => {
          this.submitted = true;
          this.rows = [];
          this.totalPages = 0;
          const msg =
            err instanceof Error ? err.message : 'Unable to load lists';
          this.searchErrors = [{ id: 'search', text: msg }];
        },
      });
  }

  private loadQuery(): ApplicationListGetFilterDto {
    const raw = this.form.getRawValue() as {
      date?: string | null;
      time?: Duration | null;
      description?: string | null;
      status?: string | null;
      court?: string | null;
      location?: string | null;
      cja?: string | null;
    };

    const query: Partial<ApplicationListGetFilterDto> = {};

    const set = <K extends keyof ApplicationListGetFilterDto>(
      k: K,
      v: ApplicationListGetFilterDto[K] | undefined,
    ) => {
      if (v !== undefined && v !== null && v !== '') {
        query[k] = v;
      }
    };

    set('date', raw.date || undefined);
    set('time', this.toTimeString(raw.time));
    set('description', raw.description || undefined);
    set('status', this.toStatus(raw.status));
    set('courtLocationCode', raw.court || undefined);
    set('otherLocationDescription', raw.location || undefined);
    set('cjaCode', raw.cja || undefined);

    return query as ApplicationListGetFilterDto;
  }

  private toRow(x: ApplicationListGetSummaryDto): ApplicationListRow {
    return {
      id: x.id,
      date: x.date,
      time: x.time ?? '',
      location: x.location,
      description: x.description,
      entries: x.numberOfEntries,
      status: x.status,
      deletable: false,
      etag: null,
      rowVersion: null,
    };
  }

  private toStatus(
    s: string | null | undefined,
  ): ApplicationListStatus | undefined {
    const v = s?.trim();
    if (!v || v.toLowerCase() === 'choose') {
      return undefined;
    }

    switch (v.toUpperCase()) {
      case 'OPEN':
        return ApplicationListStatus.OPEN;
      case 'CLOSED':
        return ApplicationListStatus.CLOSED;
      default:
        return undefined;
    }
  }

  private toTimeString(v: Duration | null | undefined): string | undefined {
    if (!v) {
      return undefined;
    }
    const { hours, minutes } = v;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}`;
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

  private has(x: unknown): boolean {
    return x !== null && x !== undefined && x !== '' && x !== 'choose';
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
