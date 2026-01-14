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
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  APPLICATIONS_LIST_CHOOSE_STATUS,
  APPLICATIONS_LIST_COLUMNS,
} from './util/applications-list.constants';
import {
  ApplicationsListState,
  clearNotificationsPatch,
  initialApplicationsListState,
} from './util/applications-list.state';
import { statusSummary } from './util/delete-status';
import { loadQuery } from './util/load-query';
import { hasAnyParams, toRow } from './util/routing-state-util';

import { DateInputComponent } from '@components/date-input/date-input.component';
import { DurationInputComponent } from '@components/duration-input/duration-input.component';
import { ErrorSummaryComponent } from '@components/error-summary/error-summary.component';
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
import { ApplicationsListFormService } from '@services/applications-list-form.service';
import { PdfService } from '@services/pdf.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { getHttpStatus, getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
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
export class ApplicationsList extends PlaceFieldsBase implements OnInit {
  // APIs
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appListsApi = inject(ApplicationListsApi);
  private readonly refFacade = inject(ReferenceDataFacade);
  private readonly pdf = inject(PdfService);
  private readonly formSvc = inject(ApplicationsListFormService);

  openMenuForId: string | null = null;
  openPrintSelectForId: string | null = null;

  // Initialise signal state
  private readonly signalState = createSignalState<ApplicationsListState>(
    initialApplicationsListState,
  );
  private readonly state = this.signalState.state;
  readonly vm = this.signalState.vm;

  // Create form
  override form = this.formSvc.createSearchForm();

  // API signals
  private readonly loadRequest =
    signal<GetApplicationListsRequestParams | null>(null);
  private readonly deleteRequest = signal<ApplicationListRow | null>(null);
  private readonly printPageRequest = signal<string | null>(null);
  private readonly printContinuousRequest = signal<{
    id: string;
    isClosed: boolean;
  } | null>(null);

  columns: TableColumn[] = APPLICATIONS_LIST_COLUMNS;
  status = APPLICATIONS_LIST_CHOOSE_STATUS;

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refFacade);
  }

  // Registers signal-driven effects that watch request signals and run API calls,
  // then update state on success/error
  private setupEffects(): void {
    // TODO: Refactor error handling
    // Applications list search
    setupLoadEffect({
      request: this.loadRequest,
      load: (params) =>
        this.appListsApi.getApplicationLists(params, undefined, undefined, {
          transferCache: true,
        }),
      onSuccess: (page) => {
        const content: ApplicationListGetSummaryDto[] = page.content ?? [];
        this.signalState.patch({
          searchErrors: [],
          submitted: true,
          totalPages: page.totalPages ?? 0,
          rows: content.map((x) => toRow(x)),
          isLoading: false,
        });
      },
      onError: (err) => {
        const msg = getProblemText(err);
        this.signalState.patch({
          submitted: true,
          rows: [],
          totalPages: 0,
          isLoading: false,
          searchErrors: [{ id: 'search', text: msg }],
        });
      },
    });

    // Applications list delete
    setupLoadEffect({
      request: this.deleteRequest,
      load: (row) =>
        this.appListsApi
          .deleteApplicationList({ listId: row.id }, 'response', false, {
            context: new HttpContext()
              .set(IF_MATCH, row.etag ?? null)
              .set(ROW_VERSION, row.rowVersion ?? null),
          })
          .pipe(map((resp) => ({ row, resp }))),
      onSuccess: ({ row, resp }) => {
        if (resp.status === 200 || resp.status === 204) {
          this.signalState.patch({
            rows: this.state().rows.filter((r) => r.id !== row.id),
            deleteDone: true,
          });
        }
        this.signalState.patch({ deletingId: null });
        this.deleteRequest.set(null);
      },
      onError: (err) => {
        const status = getHttpStatus(err);
        this.signalState.patch({
          deleteInvalid: true,
          errorSummary: statusSummary(status),
          deletingId: null,
        });
        this.deleteRequest.set(null);
      },
    });

    // Applications list print page
    setupLoadEffect({
      request: this.printPageRequest,
      load: (id) =>
        this.appListsApi.printApplicationList(
          { listId: id },
          undefined,
          undefined,
          {
            transferCache: false,
          },
        ),
      onSuccess: async (dto) => {
        this.printPageRequest.set(null);
        if (!this.hasEntries(dto)) {
          this.showInline('No entries available to print');
          return;
        }

        try {
          if (isPlatformBrowser(this.platformId)) {
            await this.pdf.generatePagedApplicationListPdf(dto, {
              crestUrl: '/assets/govuk-crest.png',
            });
          }
        } catch {
          this.showInline('Unable to generate PDF. Please try again later');
        }
      },
      onError: (err) => {
        this.printPageRequest.set(null);
        const status = getHttpStatus(err);
        if (status === 404) {
          this.showInline('Application List not found');
        } else {
          this.showInline('Unable to generate PDF. Please try again later');
        }
      },
    });

    // Applications list print cont
    setupLoadEffect({
      request: this.printContinuousRequest,
      load: (req) =>
        this.appListsApi
          .printApplicationList({ listId: req.id }, undefined, undefined, {
            transferCache: false,
          })
          .pipe(map((dto) => ({ dto, isClosed: req.isClosed }))),
      onSuccess: async ({ dto, isClosed }) => {
        this.printContinuousRequest.set(null);
        if (!this.hasEntries(dto)) {
          this.showInline('No entries available to print');
          return;
        }

        try {
          if (isPlatformBrowser(this.platformId)) {
            await this.pdf.generateContinuousApplicationListsPdf(
              [dto],
              isClosed,
            );
          }
        } catch {
          this.showInline('Unable to generate PDF.');
        }
      },
      onError: () => {
        this.printContinuousRequest.set(null);
        this.showInline('Unable to generate PDF.');
      },
    });
  }

  // Initialise effects
  private readonly effects = this.setupEffects();

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? 'search';

    // Reset flag
    this.signalState.patch(clearNotificationsPatch());
    this.signalState.patch({ isSearch: true, rows: [] });

    const dateCtrl = this.form.controls.date;
    const timeCtrl = this.form.controls.time;
    const validationErrors: { id: string; text: string }[] = [];

    if (dateCtrl.errors?.['dateInvalid']) {
      validationErrors.push({
        id: 'date-day',
        text: dateCtrl.errors['dateErrorText'] as string,
      });
    }

    if (timeCtrl.errors?.['durationInvalid']) {
      validationErrors.push({
        id: 'time-hours',
        text: timeCtrl.errors['durationErrorText'] as string,
      });
    }

    // If any errors are found then return and do not run query
    if (validationErrors.length) {
      this.signalState.patch({
        submitted: true,
        searchErrors: validationErrors,
      });
      return;
    }

    const hasAny = hasAnyParams(this.form);

    if (action === 'search') {
      this.signalState.patch({
        submitted: true,
        isSearch: true,
        currentPage: 1,
      });
      this.loadApplicationsLists(hasAny);
    }
  }

  onDelete(row: ApplicationListRow): void {
    this.signalState.patch(clearNotificationsPatch());

    if (row.deletable === false) {
      this.signalState.patch({
        deleteInvalid: true,
        errorSummary: [{ text: 'This list cannot be deleted.' }],
      });
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

    this.signalState.patch({
      deleteDone: false,
      deleteInvalid: false,
      errorSummary: [],
      deletingId: row.id,
    });

    this.deleteRequest.set(row);
  }

  onPageChange(page: number): void {
    this.signalState.patch({ currentPage: page });
    const hasAny = hasAnyParams(this.form);
    this.loadApplicationsLists(hasAny);
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.openPrintSelectForId = null;
    this.openMenuForId = null;
  }

  onPrintPage(id: string): void {
    if (!id) {
      return;
    }

    this.signalState.patch(clearNotificationsPatch());
    this.printPageRequest.set(id);
  }

  onPrintContinuous(id: string, isClosed: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!id) {
      return;
    }

    this.signalState.patch(clearNotificationsPatch());

    this.printContinuousRequest.set({ id, isClosed });
  }

  protected isOpen(row: ApplicationListRow): boolean {
    return row.status === ApplicationListStatus.OPEN;
  }

  loadApplicationsLists(hasParams: boolean): void {
    if (this.state().isLoading) {
      return;
    }

    if (!hasParams) {
      this.signalState.patch({
        searchErrors: [
          ...this.state().searchErrors,
          {
            id: '',
            text: 'Invalid Search Criteria. At least one field must be entered.',
          },
        ],
      });
      return;
    }

    const params: GetApplicationListsRequestParams = {
      page: this.state().currentPage - 1,
      size: this.state().pageSize,
      ...(hasParams ? { filter: loadQuery(this.form) } : {}),
    };

    this.signalState.patch({ isLoading: true });
    this.loadRequest.set(params);
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

  private hasEntries(x: unknown): x is { entries: unknown[] } {
    if (!x || typeof x !== 'object') {
      return false;
    }
    const entries = (x as Record<string, unknown>)['entries'];
    return Array.isArray(entries) && entries.length > 0;
  }

  private showInline(message: string): void {
    this.signalState.patch({
      deleteInvalid: true,
      errorSummary: [{ text: message }],
    });
  }
}
