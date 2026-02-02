/*
Applications List
Main Component for page /applications-list

Functionality:
onSubmit():
  - GET request to Spring API which returns applications lists based on given params
  - If params are empty (user leaves fields empty or on default selected value) GET ALL is run
  - Populates query based on fields that are  !null/!undefined/!defaultValue

Delete:
  - Handled in applications-list-delete component

onPrintPage():
  - Fetch list by id and generate a paged PDF in the browser
  - If list is empty/missing or PDF fails, show inline message

onPrintContinuous():
  - Fetch list by id and generate a continuous PDF in the browser (uses isClosed which changes the title)
  - If list is empty or PDF fails, show inline message
*/

import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  HostListener,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { map, take } from 'rxjs/operators';

import {
  APPLICATIONS_LIST_CHOOSE_STATUS,
  APPLICATIONS_LIST_COLUMNS_ACTION,
  APPLICATIONS_LIST_ERROR_MESSAGES,
} from './util/applications-list.constants';
import {
  ApplicationsListState,
  clearNotificationsPatch,
  initialApplicationsListState,
} from './util/applications-list.state';
import { statusSummary } from './util/delete-status';
import { loadQuery } from './util/load-query';

import {
  hasAnyParams,
  toRow,
} from '@components/applications-list-entry-detail/util/routing-state-util';
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
import {
  ApplicationListGetSummaryDto,
  ApplicationListStatus,
  ApplicationListsApi,
  GetApplicationListsRequestParams,
} from '@openapi';
import { ApplicationListRecordsService } from '@services/application-list-records/application-list-records.service';
import { ApplicationsListFormService } from '@services/applications-list-form.service';
import { PdfService } from '@services/pdf.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import {
  ApplicationListSearchFormService,
  DEFAULT_STATE,
  SearchFormValue,
} from '@services/searchform/application-list-search-form.service';
import { getHttpStatus, getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { ApplicationListRow } from '@util/types/application-list/types';

type DeleteFlash = { kind: 'success' } | { kind: 'error'; code: number };

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
  templateUrl: './applications-list.component.html',
})
export class ApplicationsList extends PlaceFieldsBase implements OnInit {
  // APIs
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appListsApi = inject(ApplicationListsApi);
  private readonly refFacade = inject(ReferenceDataFacade);
  private readonly pdf = inject(PdfService);
  private readonly searchForm = inject(ApplicationListSearchFormService);
  private readonly formSvc = inject(ApplicationsListFormService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  openMenuForId: string | null = null;
  openPrintSelectForId: string | null = null;

  // Initialise signal state
  private readonly appListSignalState =
    createSignalState<ApplicationsListState>(initialApplicationsListState);
  private readonly appListState = this.appListSignalState.state;
  readonly vm = this.appListSignalState.vm;
  private readonly storedRecordsState = inject(ApplicationListRecordsService);
  readonly storedRecordsVm = this.storedRecordsState.vm;

  // allows you to initialise effect in ngOnInit()
  private readonly envInjector = inject(EnvironmentInjector);

  // Create form
  override form = this.formSvc.createSearchForm();

  // API signals
  private readonly loadRequest =
    signal<GetApplicationListsRequestParams | null>(null);
  private readonly printPageRequest = signal<string | null>(null);
  private readonly printContinuousRequest = signal<{
    id: string;
    isClosed: boolean;
  } | null>(null);

  columns: TableColumn[] = APPLICATIONS_LIST_COLUMNS_ACTION;
  status = APPLICATIONS_LIST_CHOOSE_STATUS;

  ngOnInit(): void {
    this.restoreFormValues();
    this.initPlaceFields(this.form, this.refFacade);

    // reset submitted to false when navigating back to prevent date/duration input errors
    this.storedRecordsState.patch({ submitted: false });

    // Initialise effects
    this.setupEffects();

    this.route.queryParamMap.pipe(take(1)).subscribe((q) => {
      const flash = this.readDeleteFlash(q);
      if (!flash) {
        return;
      }

      this.handleDeleteFlash(flash);
      this.clearFlashParams();
    });
  }

  restoreFormValues(): void {
    this.form.patchValue(this.searchForm.state(), { emitEvent: false });
  }

  clearSearch(): void {
    this.appListSignalState.patch(clearNotificationsPatch());
    this.appListSignalState.patch({ isSearch: false });
    this.storedRecordsState.patch({ submitted: false, rows: [] });
    this.searchForm.reset();
    this.form.reset(this.searchForm.state());

    // clear PlaceFieldsBase signal state
    this.resetPlaceSearch();
  }

  private resetPlaceSearch(): void {
    this.setCjaSearch('');
    this.patch({ filteredCja: [] });

    this.setCourthouseSearch('');
    this.patch({ filteredCourthouses: [] });
  }

  // Registers signal-driven effects that watch request signals and run API calls,
  // then update state on success/error
  private setupEffects(): void {
    // TODO: Use global error handling after ARCPOC-822 is done
    // Applications list search
    setupLoadEffect(
      {
        request: this.loadRequest,
        load: (params) =>
          this.appListsApi.getApplicationLists(params, undefined, undefined, {
            transferCache: true,
          }),
        onSuccess: (page) => {
          const content: ApplicationListGetSummaryDto[] = page.content ?? [];
          this.appListSignalState.patch({
            searchErrors: [],
            isLoading: false,
          });
          this.storedRecordsState.patch({
            submitted: true,
            totalPages: page.totalPages ?? 0,
            rows: content.map((x) => toRow(x)),
          });
          this.loadRequest.set(null); // Clears request signal
        },
        onError: (err) => {
          const msg = getProblemText(err);
          this.appListSignalState.patch({
            isLoading: false,
            searchErrors: [{ id: 'search', text: msg }],
          });
          this.storedRecordsState.patch({
            submitted: true,
            rows: [],
            totalPages: 0,
          });
          this.loadRequest.set(null);
        },
      },
      this.envInjector,
    );

    // Applications list print page
    setupLoadEffect(
      {
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
            this.showInline(APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint);
            return;
          }

          try {
            if (isPlatformBrowser(this.platformId)) {
              await this.pdf.generatePagedApplicationListPdf(dto, {
                crestUrl: '/assets/govuk-crest.png',
              });
            }
          } catch {
            this.showInline(APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateRetry);
          }
        },
        onError: (err) => {
          this.printPageRequest.set(null);
          const status = getHttpStatus(err);
          if (status === 404) {
            this.showInline(APPLICATIONS_LIST_ERROR_MESSAGES.listNotFound);
          } else {
            this.showInline(APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateRetry);
          }
        },
      },
      this.envInjector,
    );

    // Applications list print cont
    setupLoadEffect(
      {
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
            this.showInline(APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint);
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
            this.showInline(
              APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateGeneric,
            );
          }
        },
        onError: () => {
          this.printContinuousRequest.set(null);
          this.showInline(APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateGeneric);
        },
      },
      this.envInjector,
    );
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? 'search';

    // Reset flag
    this.appListSignalState.patch(clearNotificationsPatch());
    this.appListSignalState.patch({ isSearch: true });
    this.storedRecordsState.patch({ rows: [] });

    const dateCtrl = this.form.controls.date;
    const timeCtrl = this.form.controls.time;
    const validationErrors: { id: string; text: string }[] = [];

    //TODO: Should use new validation pattern in ALE update
    // Using generic summary/child functions to retrieve messages from central error object

    // CJA validation
    const cjaTyped = (this.state().cjaSearch ?? '').trim();
    const cjaCode = String(this.form.controls.cja.value ?? '').trim();

    if (cjaTyped) {
      const isKnownCode = this.state().cja.some((x) => x.code === cjaCode);

      if (!isKnownCode) {
        validationErrors.push({
          id: 'cja',
          text: APPLICATIONS_LIST_ERROR_MESSAGES.cjaNotFound,
        });
      }
    }

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
      this.storedRecordsState.patch({ submitted: true });
      this.appListSignalState.patch({
        searchErrors: validationErrors,
      });
      return;
    }

    const hasAny = hasAnyParams(this.form);

    if (action === 'search') {
      this.storedRecordsState.patch({ submitted: true, currentPage: 1 });
      this.appListSignalState.patch({
        isSearch: true,
      });
      this.loadApplicationsLists(hasAny);
    }
  }

  onPageChange(page: number): void {
    this.storedRecordsState.patch({ currentPage: page });
    const hasAny = hasAnyParams(this.form);
    this.loadApplicationsLists(hasAny);
  }

  onCjaSearchChange(value: string): void {
    this.setCjaSearch(value);

    this.form.controls.cja.setValue('');

    // refresh suggestions list
    this.onCjaInputChange();
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

    this.appListSignalState.patch(clearNotificationsPatch());
    this.printPageRequest.set(id);
  }

  onPrintContinuous(id: string, isClosed: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!id) {
      return;
    }

    this.appListSignalState.patch(clearNotificationsPatch());

    this.printContinuousRequest.set({ id, isClosed });
  }

  protected isOpen(row: ApplicationListRow): boolean {
    return row.status === ApplicationListStatus.OPEN;
  }

  loadApplicationsLists(hasParams: boolean): void {
    if (this.appListState().isLoading) {
      return;
    }

    if (!hasParams) {
      this.appListSignalState.patch({
        searchErrors: [
          ...this.appListState().searchErrors,
          {
            id: '',
            text: APPLICATIONS_LIST_ERROR_MESSAGES.invalidSearchCriteria,
          },
        ],
      });
      return;
    }

    this.searchForm.setState({
      ...DEFAULT_STATE,
      ...this.form.getRawValue(),
    } as SearchFormValue);

    const r = this.storedRecordsState.state();

    const params: GetApplicationListsRequestParams = {
      page: r.currentPage - 1,
      size: r.pageSize,
      ...(hasParams ? { filter: loadQuery(this.form) } : {}),
    };

    this.appListSignalState.patch({ isLoading: true });
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
    this.appListSignalState.patch({
      deleteInvalid: true,
      errorSummary: [{ text: message }],
    });
  }

  private handleDeleteFlash(flash: DeleteFlash): void {
    this.appListSignalState.patch(clearNotificationsPatch());

    if (flash.kind === 'success') {
      this.appListSignalState.patch({
        deleteDone: true,
        deleteInvalid: false,
        errorSummary: [],
      });
      return;
    }

    if (flash.kind === 'error') {
      this.appListSignalState.patch({
        deleteDone: false,
        deleteInvalid: true,
        errorSummary: statusSummary(flash.code),
      });
    }
  }

  private clearFlashParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { delete: null, code: null },
      replaceUrl: true,
    });
  }

  private readDeleteFlash(q: ParamMap): DeleteFlash | null {
    const del = q.get('delete');
    if (del === 'success') {
      return { kind: 'success' };
    }

    if (del === 'error') {
      const raw = q.get('code');
      const code = raw ? Number(raw) : NaN;
      return { kind: 'error', code: Number.isFinite(code) ? code : 500 };
    }

    return null;
  }
}
