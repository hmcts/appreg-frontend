/*
TODO: ARCPOC-816 prio 1, we want to refactor this file to migrate to
signal based state. Core list/search/delete flow with many flags (submitted, isSearch etc), manual subscribe + takeUntil.

We want to start with this file which can serve as a template for other files

move flags/rows/paging/errors into a single state signal
replace load subscriptions with signal-driven effect
swap template bindings to vm().
*/

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
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';

import { statusSummary } from './util/delete-status';
import { loadQuery } from './util/load-query';

import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '@components/duration-input/duration-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PageHeaderComponent } from '@components/page-header/page-header.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { IF_MATCH, ROW_VERSION } from '@context/concurrency-context';
import {
  ApplicationListGetSummaryDto,
  ApplicationListStatus,
  ApplicationListsApi,
  GetApplicationListsRequestParams,
} from '@openapi';
import { PdfService } from '@services/pdf.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { has } from '@util/has';
import { getHttpStatus, getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { normaliseTime } from '@util/time-helpers';
import { ApplicationListRow } from '@util/types/application-list/types';

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
    MojButtonMenuDirective,
    PageHeaderComponent,
  ],
  templateUrl: './applications-list.html',
})
export class ApplicationsList
  extends PlaceFieldsBase
  implements OnInit, OnDestroy
{
  // APIs
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appListsApi = inject(ApplicationListsApi);
  private readonly refFacade = inject(ReferenceDataFacade);
  private readonly pdf = inject(PdfService);

  private readonly destroy$ = new Subject<void>();
  openMenuForId: string | null = null;
  openPrintSelectForId: string | null = null;

  // Flags
  submitted: boolean = false;
  isSearch: boolean = false;
  deleteDone: boolean = false;
  deleteInvalid: boolean = false;
  isLoading: boolean = false;

  // Error summary
  searchErrors: { id: string; text: string }[] = [];
  errorSummary: ErrorItem[] = [];

  deletingId: string | null = null;

  override form = new FormGroup({
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
  pageSize = 10;

  columns: TableColumn[] = [
    { header: 'Date', field: 'date' },
    { header: 'Time', field: 'time' },
    {
      header: 'Location',
      field: 'location',
      sortValue: (row) => this.buildTrailingNumericSortKey(row['location']),
    },
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

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refFacade);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? 'search';

    // Reset flag
    this.clearNotifications();
    this.isSearch = true;
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

    // If any errors are found then return and do not run query
    if (this.searchErrors.length) {
      this.submitted = true;
      return;
    }

    const hasAny = this.hasAnyParams();

    if (action === 'search') {
      this.submitted = true;
      this.isSearch = true;
      this.currentPage = 1;
      this.loadApplicationsLists(hasAny);
    }
  }

  async onDelete(row: ApplicationListRow): Promise<void> {
    this.clearNotifications();

    if (row.deletable === false) {
      this.deleteInvalid = true;
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
    this.errorSummary = [];
    this.deletingId = row.id;

    const context = new HttpContext()
      .set(IF_MATCH, row.etag ?? null)
      .set(ROW_VERSION, row.rowVersion ?? null);

    try {
      const resp = await firstValueFrom(
        this.appListsApi.deleteApplicationList(
          { listId: row.id },
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
      this.errorSummary = statusSummary(status);
    } finally {
      this.deletingId = null;
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    const hasAny = this.hasAnyParams();
    this.loadApplicationsLists(hasAny);
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.openPrintSelectForId = null;
    this.openMenuForId = null;
  }

  async onPrintPage(id: string): Promise<void> {
    if (!id) {
      return;
    }

    this.clearNotifications();

    try {
      const dto = await firstValueFrom(
        this.appListsApi.printApplicationList(
          { listId: id },
          undefined,
          undefined,
          {
            transferCache: false,
          },
        ),
      );

      const hasEntries = Array.isArray(dto.entries) && dto.entries.length > 0;
      if (!hasEntries) {
        this.showInline('No entries available to print');
        return;
      }

      if (isPlatformBrowser(this.platformId)) {
        await this.pdf.generatePagedApplicationListPdf(dto, {
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

  async onPrintContinuous(id: string, isClosed: boolean): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!id) {
      return;
    }

    this.clearNotifications();

    const hasEntries = (x: unknown): x is { entries: unknown[] } => {
      if (!x || typeof x !== 'object') {
        return false;
      }
      const entries = (x as Record<string, unknown>)['entries'];
      return Array.isArray(entries) && entries.length > 0;
    };

    try {
      const dto = await firstValueFrom(
        this.appListsApi.printApplicationList(
          { listId: id },
          undefined,
          undefined,
          { transferCache: false },
        ),
      );

      if (!hasEntries(dto)) {
        this.showInline('No entries available to print');
        return;
      }

      await this.pdf.generateContinuousApplicationListsPdf([dto], isClosed);
    } catch {
      this.showInline('Unable to generate PDF.');
    }
  }

  protected isOpen(row: ApplicationListRow): boolean {
    return row.status === ApplicationListStatus.OPEN;
  }

  loadApplicationsLists(hasParams: boolean): void {
    if (this.isLoading) {
      return;
    }

    if (!hasParams) {
      this.searchErrors.push({
        id: '',
        text: 'Invalid Search Criteria. At least one field must be entered.',
      });
      return;
    }

    const params: GetApplicationListsRequestParams = {
      page: this.currentPage - 1,
      size: this.pageSize,
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
      entries: x.entriesCount,
      status: x.status,
      deletable: x.status === ApplicationListStatus.OPEN,
      etag: null,
      rowVersion: null,
    };
  }

  private hasAnyParams(): boolean {
    return (
      has(this.form.value.date) ||
      has(this.form.value.time) ||
      has(this.form.value.description) ||
      has(this.form.value.status) ||
      has(this.form.value.court) ||
      has(this.form.value.location) ||
      has(this.form.value.cja)
    );
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

  private clearNotifications(): void {
    this.deleteDone = false;
    this.deleteInvalid = false;
    this.errorSummary = [];
    this.searchErrors = [];
    this.submitted = false;
  }

  private showInline(message: string): void {
    this.deleteInvalid = true;
    this.errorSummary = [{ text: message }];
  }

  private buildTrailingNumericSortKey(value: unknown): string {
    if (value === null) {
      return '';
    }

    let s: string;

    if (typeof value === 'string') {
      s = value.trim().toLowerCase();
    } else if (typeof value === 'number') {
      s = String(value);
    } else if (typeof value === 'boolean') {
      s = value ? 'true' : 'false';
    } else {
      return '';
    }

    if (s === '') {
      return '';
    }

    let i = s.length - 1;
    while (i >= 0) {
      const code = s.codePointAt(i);
      if (code === undefined) {
        break;
      }

      if (code < 48 || code > 57) {
        break;
      }
      i--;
    }

    if (i === s.length - 1) {
      return s;
    }

    const prefix = s.slice(0, i + 1);
    const numStr = s.slice(i + 1);
    const padded = numStr.padStart(4, '0');

    return `${prefix}${padded}`;
  }
}
