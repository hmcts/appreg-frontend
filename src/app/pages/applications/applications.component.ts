import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';

import {
  clearNotificationsPatch,
  initialApplicationsState,
  searchErrorPatch,
  searchSuccessPatch,
  startSearchPatch,
} from './util/applications.state';
import { mapToRow } from './util/table-mapper';

import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { APPLICATIONS_ERROR_MAP } from '@constants/applications/error-messages';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import { PdfService } from '@core/services/pdf.service';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListEntriesApi,
  ApplicationListGetPrintDto,
  ApplicationListsApi,
  EntryGetFilterDto,
  EntryGetSummaryDto,
  GetEntriesRequestParams,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { ApplicationRow } from '@shared-types/applications/applications.type';
import { toStatus } from '@util/application-status-helpers';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { buildFormErrorSummary } from '@util/error-summary';
import { has } from '@util/has';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { filterEntriesToPrint } from '@util/pdf-utils';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { cjaMustExistIfTypedValidator } from '@validators/cja-exists.validator';
import { courtMustExistIfTypedValidator } from '@validators/court-exists.validator';
import { courtLocCjaValidator } from '@validators/court-or-cja.validator';

type AppErrorMap = typeof APPLICATIONS_ERROR_MAP;
type ControlName = keyof AppErrorMap;
type ApplicationsPrintRequest =
  | { id: string; mode: 'page' }
  | { ids: string[]; mode: 'continuous'; selectedRows: ApplicationRow[] };

type ApplicationsPrintResponse =
  | { dto: ApplicationListGetPrintDto; mode: 'page' }
  | {
      dtos: ApplicationListGetPrintDto[];
      mode: 'continuous';
      selectedRows: ApplicationRow[];
    };
@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    SortableTableComponent,
    DateInputComponent,
    TextInputComponent,
    PaginationComponent,
    SelectInputComponent,
    SuggestionsComponent,
    ErrorSummaryComponent,
    NotificationBannerComponent,
    MojButtonMenuDirective,
    DateTimePipe,
  ],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
})
export class Applications extends PlaceFieldsBase implements OnInit {
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly refFacade = inject(ReferenceDataFacade);
  private readonly appListEntryApi = inject(ApplicationListEntriesApi);
  private readonly appListApi = inject(ApplicationListsApi);
  private readonly pdf = inject(PdfService);

  private readonly appState = createSignalState(initialApplicationsState);
  readonly vm = this.appState.vm;
  private readonly patchApp = this.appState.patch;

  readonly tableRows = computed(() => this.vm().rows.map(mapToRow));

  private readonly errorMap = APPLICATIONS_ERROR_MAP;

  private readonly printRequest = signal<ApplicationsPrintRequest | null>(null);

  override form = new FormGroup(
    {
      date: new FormControl<string | null>(null),
      applicantOrg: new FormControl<string>(''),
      respondentOrg: new FormControl<string>(''),
      applicantSurname: new FormControl<string>(''),
      respondentSurname: new FormControl<string>(''),
      location: new FormControl<string>(''),
      standardApplicantCode: new FormControl<string>(''),
      respondentPostcode: new FormControl<string>('', {
        validators: [Validators.maxLength(8)],
      }),
      accountReference: new FormControl<string>(''),
      court: new FormControl<string>(''),
      cja: new FormControl<string>(''),
      status: new FormControl<string | null>(null),
    },
    {
      validators: [
        courtLocCjaValidator(),
        cjaMustExistIfTypedValidator({
          getTyped: () => this.state().cjaSearch ?? '',
          getValidCodes: () => this.state().cja.map((x) => x.code),
        }),
        courtMustExistIfTypedValidator({
          getTyped: () => this.state().courthouseSearch ?? '',
          getValidCodes: () =>
            this.state().courtLocations.map((x) => x.locationCode),
        }),
      ],
    },
  );

  columns = [
    { header: 'Date', field: 'date' },
    { header: 'Applicant', field: 'applicant' },
    { header: 'Respondent', field: 'respondent' },
    { header: 'Application title', field: 'title' },
    { header: 'Fee', field: 'fee' },
    { header: 'Resulted', field: 'resulted' },
    { header: 'Status', field: 'status' },
    { header: 'Actions', field: 'actions', sortable: false },
  ];

  status = [
    { label: 'Choose', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refFacade);
    this.setupEffects();
  }

  private setupEffects(): void {
    // GET /application-lists/{listId}/print
    setupLoadEffect(
      {
        request: this.printRequest,
        load: (req: ApplicationsPrintRequest) => {
          if (req.mode === 'continuous') {
            return forkJoin(
              req.ids.map((listId) =>
                this.appListApi.printApplicationList(
                  { listId },
                  undefined,
                  undefined,
                  {
                    transferCache: false,
                  },
                ),
              ),
            ).pipe(
              map(
                (dtos): ApplicationsPrintResponse => ({
                  dtos,
                  mode: 'continuous',
                  selectedRows: req.selectedRows,
                }),
              ),
            );
          }

          return this.appListApi
            .printApplicationList({ listId: req.id }, undefined, undefined, {
              transferCache: false,
            })
            .pipe(
              map(
                (dto): ApplicationsPrintResponse => ({
                  dto,
                  mode: 'page',
                }),
              ),
            );
        },
        onSuccess: async (response) => {
          this.printRequest.set(null);

          const sourceDtos =
            response.mode === 'continuous' ? response.dtos : [response.dto];
          const selectedRows =
            response.mode === 'continuous'
              ? response.selectedRows
              : this.appState.state().selectedRows;
          const filteredDtos = sourceDtos.map((dto) =>
            filterEntriesToPrint(dto, selectedRows),
          );

          if (response.mode === 'continuous') {
            const printableDtos = filteredDtos.filter(
              (dto) => dto.entries.length,
            );

            if (!printableDtos.length) {
              this.patchPrintError(
                APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint,
              );
              return;
            }

            try {
              if (isPlatformBrowser(this.platformId)) {
                await this.pdf.generateContinuousApplicationListsPdf(
                  printableDtos,
                  false,
                );
              }
            } catch {
              this.patchPrintError(
                APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateGeneric,
              );
            }
          }

          // TODO: arcpoc 1329
        },
        onError: (err) => {
          this.printRequest.set(null);
          const errMsg = getProblemText(err);
          this.patchPrintError(errMsg);
        },
      },
      this.envInjector,
    );
  }

  onSubmit(e: SubmitEvent): void {
    e.preventDefault();

    this.patchApp({
      ...clearNotificationsPatch(),
      submitted: true,
      isSearch: true,
      rows: [],
      selectedIds: new Set<string>(),
      selectedRows: [],
    });

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    const validationErrors = this.buildErrorSummary();
    if (validationErrors.length) {
      this.patchApp({ searchErrors: validationErrors });
      return;
    }

    if (!this.hasAnyParams()) {
      this.patchApp({
        searchErrors: [
          {
            text: APPLICATIONS_LIST_ERROR_MESSAGES.invalidSearchCriteria,
            id: 'search-error',
          },
        ],
      });
      return;
    }
    this.loadApplications();
  }

  onPrintContinuousClick(): void {
    this.patchApp(clearNotificationsPatch());
    const selectedRowsListIds = this.getArrOfPrintListId(
      this.vm().selectedRows,
    );

    if (!this.vm().selectedRows.length) {
      this.patchApp({
        submitted: true,
        searchErrors: [
          {
            text: 'No applications have been selected',
          },
        ],
      });
      return;
    }

    this.printRequest.set({
      ids: selectedRowsListIds,
      mode: 'continuous',
      selectedRows: this.vm().selectedRows,
    });
  }

  onPrintPageClick(): void {
    // TODO: arcpoc 1329
    // this.patchApp(clearNotificationsPatch());
    // const selectedRowsListIds = this.getArrOfPrintListId(
    //   this.vm().selectedRows,
    // );
    // if (!selectedRowsListIds.length) {
    //   this.patchApp({
    //     submitted: true,
    //     searchErrors: [
    //       {
    //         text: 'Selected applications do not have an associated applications list',
    //       },
    //     ],
    //   });
    // }
  }

  loadApplications(): void {
    if (this.vm().isLoading) {
      return;
    }

    if (this.vm().searchErrors.length) {
      return;
    }

    const params: GetEntriesRequestParams = {
      pageNumber: this.vm().currentPage,
      pageSize: this.vm().pageSize,
      filter: this.loadQuery(),
    };

    this.patchApp({ ...startSearchPatch(), ...clearNotificationsPatch() });

    this.appListEntryApi
      .getEntries(params, undefined, undefined, { transferCache: false })
      .subscribe({
        next: (page) => {
          const rows = page?.content ?? ([] as EntryGetSummaryDto[]);
          this.patchApp(searchSuccessPatch(rows, page?.totalPages ?? 1));
        },
        error: () => {
          this.patchApp(searchErrorPatch());
        },
      });
  }

  onPageChange(page: number): void {
    this.patchApp({ currentPage: page });
    this.loadApplications(); // fetch page `page`
  }

  onSelectedIdsChange(selectedIds: Set<string>): void {
    this.patchApp({ selectedIds });
  }

  onSelectedRowsChange(rows: Row[]): void {
    const visibleIds = new Set(this.tableRows().map((row) => row.id));
    const selectedRowsFromOtherPages = this.vm().selectedRows.filter(
      (row) => !visibleIds.has(row.id),
    );

    this.patchApp({
      selectedRows: [
        ...selectedRowsFromOtherPages,
        ...(rows as ApplicationRow[]),
      ],
    });
  }

  clearSearch(): void {
    this.appState.state.set(initialApplicationsState);

    this.form.reset({
      date: null,
      applicantOrg: '',
      respondentOrg: '',
      applicantSurname: '',
      respondentSurname: '',
      location: '',
      standardApplicantCode: '',
      respondentPostcode: '',
      accountReference: '',
      court: '',
      cja: '',
      status: null,
    });

    this.patch({
      courthouseSearch: '',
      cjaSearch: '',
      filteredCourthouses: [],
      filteredCja: [],
    });
  }

  // Helpers
  private hasAnyParams(): boolean {
    const v = this.form.getRawValue();

    return (
      has(v.date) ||
      has(v.applicantOrg) ||
      has(v.respondentOrg) ||
      has(v.applicantSurname) ||
      has(v.respondentSurname) ||
      has(v.location) ||
      has(v.standardApplicantCode) ||
      has(v.respondentPostcode) ||
      has(v.accountReference) ||
      has(v.court) ||
      has(v.cja) ||
      has(v.status)
    );
  }

  private loadQuery(): EntryGetFilterDto {
    const v = this.form.getRawValue();
    const filter: EntryGetFilterDto = {};

    if (v.date?.trim()) {
      filter.date = v.date.trim();
    }

    if (v.court?.trim()) {
      filter.courtCode = v.court.trim();
    }

    if (v.location?.trim()) {
      filter.otherLocationDescription = v.location.trim();
    }

    if (v.cja?.trim()) {
      filter.cjaCode = v.cja.trim();
    }

    if (v.applicantOrg?.trim()) {
      filter.applicantOrganisation = v.applicantOrg.trim();
    }

    if (v.applicantSurname?.trim()) {
      filter.applicantSurname = v.applicantSurname.trim();
    }

    if (v.respondentOrg?.trim()) {
      filter.respondentOrganisation = v.respondentOrg.trim();
    }

    if (v.respondentSurname?.trim()) {
      filter.respondentSurname = v.respondentSurname.trim();
    }

    if (v.respondentPostcode?.trim()) {
      filter.respondentPostcode = v.respondentPostcode.trim();
    }

    if (v.standardApplicantCode?.trim()) {
      filter.standardApplicantCode = v.standardApplicantCode.trim();
    }

    if (v.accountReference?.trim()) {
      filter.accountReference = v.accountReference.trim();
    }

    if (v.status) {
      filter.status = toStatus(v.status);
    }

    return filter;
  }

  private getArrOfPrintListId(selectedRows: ApplicationRow[]): string[] {
    if (!selectedRows.length) {
      return [];
    }

    return [
      ...new Set(
        selectedRows
          .map((row) => row.applicationListId?.trim())
          .filter((id): id is string => !!id),
      ),
    ];
  }

  toggleAdvancedSearch(): void {
    this.patchApp({ isAdvancedSearch: !this.vm().isAdvancedSearch });
  }

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, this.errorMap);
  }

  private patchPrintError(message: string): void {
    this.patchApp({
      errorSummary: [{ text: message }],
    });
  }

  isControlInvalid<C extends ControlName>(controlName: C): boolean {
    const c = this.form.get(String(controlName));
    return !!(this.vm().submitted && c && c.invalid);
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().searchErrors.find((e) => e.id === id);
  }

  getControlErrorMessages<C extends ControlName>(controlName: C): string[] {
    const c = this.form.get(String(controlName));
    if (!c?.errors) {
      return [];
    }

    const msgMap = this.errorMap[controlName];
    const msgs: string[] = [];

    for (const k of Object.keys(c.errors)) {
      if (!(k in msgMap)) {
        continue;
      }
      const errorKey = k as keyof typeof msgMap;
      msgs.push(msgMap[errorKey]);
    }

    return msgs;
  }
}
