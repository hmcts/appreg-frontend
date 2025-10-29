/*
Applications List
Main Component for page /applications-list

Functionality:
onSubmit():
  - GET request to Spring API which returns applications lists based on given params
  - If params are empty (user leaves fields empty or on default selected value) GET ALL is run
  - Populates query based on fields that are  !null/!undefined/!defaultValue
  Helper functions:
    src/app/pages/applications-list/util/has.ts
    src/app/pages/applications-list/util/to-status.ts
    src/app/pages/applications-list/util/load-query.ts
    src/app/pages/applications-list/util/time-helpers.ts

onDelete():
  - If not deletable, set errors and exit
  - Confirm in browser; cancel exits
  - Set deletingId; add ETag/rowVersion to HttpContext
  - DELETE list; 200/204 → remove row, mark done
  - Map 401/403/404/409/412/other to errorSummary
  - Always clear deletingId
*/

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, firstValueFrom, takeUntil } from 'rxjs';

import {
  ApplicationListGetSummaryDto,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
  GetApplicationListsRequestParams,
} from '../../../generated/openapi';
import { PdfService } from '../../core/services/pdf.service';
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
import { NotificationBannerComponent } from '../../shared/components/notification-banner/notification-banner.component';
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
  onCjaInputChange,
  onCourthouseInputChange,
  selectCja as selectCjaHelper,
  selectCourthouse as selectCourthouseHelper,
} from '../../shared/util/court-cja-text-suggestions';
import { has } from '../../shared/util/has';
import { normaliseTime } from '../../shared/util/time-helpers';
import { ApplicationListRow } from '../../shared/util/types/application-list/types';

import {
  getHttpStatus,
  getProblemText,
  statusSummary,
} from './util/delete-status';
import { loadQuery } from './util/load-query';

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
    SuccessBannerComponent,
    ErrorSummaryComponent,
    SuggestionsComponent,
    NotificationBannerComponent,
  ],
  templateUrl: './applications-list.html',
})
export class ApplicationsList implements OnInit, AfterViewInit, OnDestroy {
  private readonly _id: string | undefined;
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
  isLoading: boolean = false;

  // Error summary
  errorHint = '';
  searchErrors: { id: string; text: string }[] = [];
  errorSummary: ErrorItem[] = [];

  deletingId: string | null = null;

  form = new FormGroup({
    date: new FormControl<string | null>(null),
    time: new FormControl<Duration | null>(null),
    description: new FormControl<string>(''),
    status: new FormControl<string | null>(null),
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
    { label: 'Choose', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  rows: ApplicationListRow[] = [];

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly ref: ReferenceDataFacade,
    private readonly appListsApi: ApplicationListsApi,
    private readonly pdf: PdfService,
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

    void this.initMojMenus();
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

    this.errorHint = 'There is a problem';

    const dateCtrl = this.form.controls.date;
    const timeCtrl = this.form.controls.time;
    if (dateCtrl.errors?.['dateInvalid']) {
      this.searchErrors.push({
        id: 'date-day',
        text: dateCtrl.errors['dateErrorText'] as string,
      });
      return;
    }

    if (timeCtrl.errors?.['durationInvalid']) {
      this.searchErrors.push({
        id: 'time-hours',
        text: timeCtrl.errors['durationErrorText'] as string,
      });
      return;
    }

    const hasAny =
      has(this.form.value.date) ||
      has(this.form.value.time) ||
      has(this.form.value.description) ||
      has(this.form.value.status) ||
      has(this.form.value.court) ||
      has(this.form.value.location) ||
      has(this.form.value.cja);

    if (action === 'search') {
      this.submitted = true;
      this.isSearch = true;
      this.currentPage = 1;
      this.loadApplicationsLists(hasAny);
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
      const ok = globalThis.confirm(
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

      this.errorSummary = statusSummary(status);
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

  async onPrintPage(id: string): Promise<void> {
    if (!id) {
      return;
    }

    this.clearErrors();

    try {
      const dto = await firstValueFrom(
        this.appListsApi.printApplicationList({ id }, undefined, undefined, {
          transferCache: false,
        }),
      );

      const hasEntries = Array.isArray(dto.entries) && dto.entries.length > 0;
      if (!hasEntries) {
        this.showInline('No entries available to print');
        return;
      }

      if (isPlatformBrowser(this.platformId)) {
        await this.pdf.generateApplicationListPdf(dto, {
          crestUrl: '/assets/govuk-crest.png',
        });
      }
    } catch (err: unknown) {
      const status = getHttpStatus(err);
      if (status === 404) {
        this.showInline('Application List not found');
      } else {
        this.showInline('Unable to generate PDF. Please try again later');
      }
    }
  }

  onPrintContinuous(): void {}

  private afterRowsRendered(): void {
    setTimeout(() => {
      void this.initMojMenus();
    });
  }

  private async initMojMenus(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    void (await import('@ministryofjustice/frontend')
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
      }));
  }

  loadApplicationsLists(hasParams: boolean): void {
    if (this.isLoading) {
      return;
    }

    const params: GetApplicationListsRequestParams = {
      ...(hasParams ? { filter: loadQuery(this.form) } : {}),
    };

    this.isLoading = true;
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
          const content: ApplicationListGetSummaryDto[] = page.content ?? [];
          this.rows = content.map((x) => this.toRow(x));
          this.afterRowsRendered();
          this.isLoading = false;
        },
        error: (err) => {
          const msg = getProblemText(err);
          this.submitted = true;
          this.rows = [];
          this.totalPages = 0;
          this.isLoading = false;
          this.searchErrors = [{ id: 'search', text: msg }];
        },
      });
  }

  private toRow(x: ApplicationListGetSummaryDto): ApplicationListRow {
    return {
      id: x.id,
      date: x.date,
      time: normaliseTime(x.time) ?? '',
      location: x.location,
      description: x.description,
      entries: x.numberOfEntries,
      status: x.status,
      deletable: false,
      etag: null,
      rowVersion: null,
    };
  }

  onCourthouseInputChange(): void {
    this.filteredCourthouses = onCourthouseInputChange(
      this.form,
      this.courthouseSearch,
      this.courtLocations,
    );
  }

  onCjaInputChange(): void {
    this.filteredCja = onCjaInputChange(this.form, this.cjaSearch, this.cja);
  }

  selectCourthouse(
    c: { locationCode?: string } | CourtLocationGetSummaryDto,
  ): void {
    const { courthouseSearch, filteredCourthouses } = selectCourthouseHelper(
      this.form,
      c,
    );
    this.courthouseSearch = courthouseSearch;
    this.filteredCourthouses = filteredCourthouses;
  }

  selectCja(c: { code?: string } | CriminalJusticeAreaGetDto): void {
    const { cjaSearch, filteredCja } = selectCjaHelper(this.form, c);
    this.cjaSearch = cjaSearch;
    this.filteredCja = filteredCja;
  }

  focusField(id: string, e: Event): void {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }

  /* ----------------------- Local UI helper methods ---------------------- */

  /** Clear inline/banner error state in a typed, reusable way. */
  private clearErrors(): void {
    this.deleteInvalid = false;
    this.errorHint = '';
    this.errorSummary = [];
  }

  /** Show a single inline error message using the existing summary component. */
  private showInline(message: string): void {
    this.deleteInvalid = true;
    this.errorHint = 'There is a problem';
    this.errorSummary = [{ text: message }];
  }
}
