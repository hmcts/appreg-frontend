import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  EnvironmentInjector,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription, take } from 'rxjs';

import {
  ReportsState,
  initialReportsState,
  mapActivityAuditGroupToActivityAuditRequestParams,
  mapDurationGroupToDurationReportRequestParams,
  mapFeeGroupToFeesReportFilterDto,
  mapListMaintenanceGroupToListMaintenanceReportRequestParams,
  mapSearchWarrantsGroupToSearchWarrantsReportRequestParams,
  mapWorkloadGroupToWorkloadReportRequestParams,
} from './util';

import { ActivityAuditSectionComponent } from '@components/activity-audit-section/activity-audit-section.component';
import { buildSuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { AsyncJobProgressComponent } from '@components/async-job-progress/async-job-progress.component';
import { DurationSectionComponent } from '@components/duration-section/duration-section.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { FeesSectionComponent } from '@components/fees-section/fees-section.component';
import { ListMaintenanceSectionComponent } from '@components/list-maintenance-section/list-maintenance-section.component';
import { PrivateProsecutorsIndexSectionComponent } from '@components/private-prosecutors-index-section/private-prosecutors-index-section.component';
import { ReportSelectorComponent } from '@components/report-option/report-selector.component';
import { SearchWarrantsSectionComponent } from '@components/search-warrants-section/search-warrants-section.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { WorkloadSectionComponent } from '@components/workload-section/workload-section.component';
import {
  REPORTS_FORM_ERROR_MESSAGES,
  REPORT_ERROR_HREFS,
} from '@constants/reports/report-err';
import { reportOptions } from '@constants/reports/report-selector.constant';
import {
  CreateActivityAuditReportRequestParams,
  CreateDurationReportRequestParams,
  CreateFeesReportRequestParams,
  CreateListMaintenanceReportRequestParams,
  CreateSearchWarrantsReportRequestParams,
  CreateWorkloadReportRequestParams,
  JobAcknowledgement,
  ReportsApi,
} from '@openapi';
import {
  JobPollingFacade,
  PolledJobStatus,
} from '@services/jobs/job-polling.facade';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { ReportId } from '@shared-types/reports/report.types';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { buildFormErrorSummary } from '@util/error-summary';
import { getHttpStatus, getProblemText } from '@util/http-error-to-text';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { getTrimmedStringOrNullFromGroup } from '@util/string-helpers';
import { addLocationValidatorsToForm } from '@validators/add-location-validators-to-form';
import { dateToOnOrAfterDateFromValidator } from '@validators/date-range.validator';

const REPORT_ERROR_PRIORITY_KEYS: Record<string, string[]> = {
  dateFrom: ['dateInvalid', 'required'],
  dateTo: ['dateInvalid', 'dateRange', 'required'],
};
const REPORT_DATE_LABELS: Record<'dateFrom' | 'dateTo', string> = {
  dateFrom: 'Date from',
  dateTo: 'Date to',
};

const REPORT_POLL_INTERVAL_MS = 2_000;
const REPORT_DATE_RANGE_VALIDATORS = [dateToOnOrAfterDateFromValidator()];
const REPORT_JSON_OPTIONS = {
  httpHeaderAccept: 'application/vnd.hmcts.appreg.v1+json',
  transferCache: false,
} as const;
const REPORT_CSV_OPTIONS = {
  httpHeaderAccept: 'text/csv',
  transferCache: false,
} as const;
const REPORT_DATE_RESET_VALUE = {
  dateFrom: null,
  dateTo: null,
} as const;
const REPORT_LOCATION_RESET_VALUE = {
  court: '',
  otherLocation: '',
  cja: '',
} as const;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ReportSelectorComponent,
    ActivityAuditSectionComponent,
    FeesSectionComponent,
    ListMaintenanceSectionComponent,
    SearchWarrantsSectionComponent,
    WorkloadSectionComponent,
    DurationSectionComponent,
    PrivateProsecutorsIndexSectionComponent,
    ErrorSummaryComponent,
    SuccessBannerComponent,
    AsyncJobProgressComponent,
  ],
  templateUrl: './reports.component.html',
})
export class Reports extends PlaceFieldsBase implements OnInit {
  private readonly componentDestroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly jobPollingFacade = inject(JobPollingFacade);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly refFacade = inject(ReferenceDataFacade);
  private readonly reportsApi = inject(ReportsApi);
  private readonly envInjector = inject(EnvironmentInjector);

  private readonly reportState =
    createSignalState<ReportsState>(initialReportsState);
  private readonly reportStatePatch = this.reportState.patch;
  readonly vm = this.reportState.vm;

  private previousReportId: ReportId | null = null;
  private reportPollingSub: Subscription | null = null;

  private readonly createDurationReportRequest =
    signal<CreateDurationReportRequestParams | null>(null);
  private readonly createFeesReportRequest =
    signal<CreateFeesReportRequestParams | null>(null);
  private readonly createListMaintenanceReportRequest =
    signal<CreateListMaintenanceReportRequestParams | null>(null);
  private readonly createSearchWarrantsReportRequest =
    signal<CreateSearchWarrantsReportRequestParams | null>(null);
  private readonly createWorkloadReportRequest =
    signal<CreateWorkloadReportRequestParams | null>(null);
  private readonly createActivityAuditReportRequest =
    signal<CreateActivityAuditReportRequestParams | null>(null);

  onCreateErrorClick = onCreateErrorClickFn;

  private readonly errorMap = REPORTS_FORM_ERROR_MESSAGES;

  // Reactive form backing the template
  override form = new FormGroup({
    report: new FormControl<string | null>(null, {
      validators: [(c) => Validators.required(c)],
    }),

    activityAudit: new FormGroup(
      {
        dateFrom: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        dateTo: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        username: new FormControl<string | null>(''),
        activity: new FormControl<string[]>([], {
          validators: [(c) => Validators.required(c)],
        }),
      },
      {
        validators: REPORT_DATE_RANGE_VALIDATORS,
      },
    ),

    fees: new FormGroup(
      {
        dateFrom: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        dateTo: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        standardApplicantCode: new FormControl<string | null>(''),
        surnameOrOrg: new FormControl<string | null>(''),
        court: new FormControl<string | null>(''),
        otherLocation: new FormControl<string | null>(''),
        cja: new FormControl<string | null>(''),
      },
      {
        validators: REPORT_DATE_RANGE_VALIDATORS,
      },
    ),

    listMaintenance: new FormGroup(
      {
        dateFrom: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        dateTo: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        description: new FormControl<string | null>(''),
        court: new FormControl<string | null>(''),
        otherLocation: new FormControl<string | null>(''),
        cja: new FormControl<string | null>(''),
      },
      {
        validators: REPORT_DATE_RANGE_VALIDATORS,
      },
    ),

    searchWarrants: new FormGroup(
      {
        dateFrom: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        dateTo: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        court: new FormControl<string | null>(''),
        otherLocation: new FormControl<string | null>(''),
        cja: new FormControl<string | null>(''),
      },
      {
        validators: REPORT_DATE_RANGE_VALIDATORS,
      },
    ),

    workload: new FormGroup(
      {
        dateFrom: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        dateTo: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        court: new FormControl<string | null>(''),
        otherLocation: new FormControl<string | null>(''),
        cja: new FormControl<string | null>(''),
      },
      {
        validators: REPORT_DATE_RANGE_VALIDATORS,
      },
    ),

    duration: new FormGroup(
      {
        dateFrom: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        dateTo: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        court: new FormControl<string | null>(''),
        otherLocation: new FormControl<string | null>(''),
        cja: new FormControl<string | null>(''),
      },
      {
        validators: REPORT_DATE_RANGE_VALIDATORS,
      },
    ),

    privateProsecutorsIndex: new FormGroup(
      {
        dateFrom: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        dateTo: new FormControl<string | null>(null, {
          validators: [(c) => Validators.required(c)],
        }),
        applicantSurnameOrOrg: new FormControl<string | null>(''),
        applicantFirst: new FormControl<string | null>(''),
        standardApplicantName: new FormControl<string | null>(''),
        respondentFirst: new FormControl<string | null>(''),
        respondentSurname: new FormControl<string | null>(''),
        respondentOrg: new FormControl<string | null>(''),
        court: new FormControl<string | null>(''),
        otherLocation: new FormControl<string | null>(''),
        cja: new FormControl<string | null>(''),
      },
      {
        validators: REPORT_DATE_RANGE_VALIDATORS,
      },
    ),
  });

  // Options for the <app-report-selector>
  reportOptions = reportOptions;

  suggestionsFacade = buildSuggestionsFacade(this);

  ngOnInit(): void {
    this.form.controls.report.valueChanges.subscribe((value) => {
      const nextReportId = value as ReportId | null;
      this.preserveDateRange(this.previousReportId, nextReportId);
      this.previousReportId = nextReportId;
      this.initSelectedForm();
      this.clearReportSelectionState(nextReportId);
    });

    this.setupEffects();
  }

  onDownload(): void {
    if (this.isReportInProgress()) {
      return;
    }

    this.form.controls.report.markAsTouched();
    this.form.controls.report.updateValueAndValidity({ emitEvent: false });
    this.reportStatePatch({
      submitted: true,
      errorSummary: [],
      reportFeedback: null,
    });

    const selectedGroup = this.selectedReportGroup();
    selectedGroup?.markAllAsTouched();
    selectedGroup?.updateValueAndValidity({ emitEvent: false });

    const validationErrors = this.buildErrorSummary();

    if (validationErrors.length) {
      this.reportStatePatch({ errorSummary: validationErrors });
      return;
    }

    if (this.form.controls.report.value === 'list-maintenance') {
      this.createListMaintenanceReport();
    }

    if (this.form.controls.report.value === 'search-warrants') {
      this.createSearchWarrantsReport();
    }

    if (this.form.controls.report.value === 'fees') {
      const request: CreateFeesReportRequestParams = {
        feesReportFilterDto: mapFeeGroupToFeesReportFilterDto(this.feesGroup),
      };

      this.startCreateFeesReport(request);
    }

    if (this.form.controls.report.value === 'workload') {
      this.createWorkloadReport();
    }

    if (this.form.controls.report.value === 'activity-audit') {
      const request: CreateActivityAuditReportRequestParams =
        mapActivityAuditGroupToActivityAuditRequestParams(
          this.activityAuditGroup,
        );

      this.startCreateActivityAuditReport(request);
    }

    if (this.form.controls.report.value === 'duration') {
      this.createDurationReport();
    }
  }

  onClearFilters(): void {
    const reportId = this.form.controls.report.value as ReportId | null;
    const selectedGroup = this.reportGroupFor(reportId);

    if (!reportId || !selectedGroup || this.isReportInProgress()) {
      return;
    }

    this.stopReportCreate();
    this.stopReportPolling();
    this.clearLocationSearchState();
    selectedGroup.enable({ emitEvent: false });
    selectedGroup.reset(this.emptyReportFormValue(reportId));
    selectedGroup.markAsPristine();
    selectedGroup.markAsUntouched();
    selectedGroup.updateValueAndValidity({ emitEvent: false });
    this.reportStatePatch({
      submitted: false,
      errorSummary: [],
      reportFeedback: null,
    });
  }

  /** Handy getter for the child binding */
  get activityAuditGroup(): FormGroup {
    return this.form.get('activityAudit') as FormGroup;
  }

  /** Handy getter for the child binding */
  get feesGroup(): FormGroup {
    return this.form.get('fees') as FormGroup;
  }

  /** Handy getter for the child binding */
  get listMaintenanceGroup(): FormGroup {
    return this.form.get('listMaintenance') as FormGroup;
  }

  /** Handy getter for the child binding */
  get searchWarrantsGroup(): FormGroup {
    return this.form.get('searchWarrants') as FormGroup;
  }

  /** Handy getter for the child binding */
  get workloadGroup(): FormGroup {
    return this.form.get('workload') as FormGroup;
  }

  /** Handy getter for the child binding */
  get durationGroup(): FormGroup {
    return this.form.get('duration') as FormGroup;
  }

  /** Handy getter for the child binding */
  get ppiGroup(): FormGroup {
    return this.form.get('privateProsecutorsIndex') as FormGroup;
  }

  private startCreateFeesReport(request: CreateFeesReportRequestParams): void {
    this.stopReportCreate();
    this.stopReportPolling();
    this.showReportProgress();
    this.createFeesReportRequest.set(request);
  }

  private startCreateDurationReport(
    request: CreateDurationReportRequestParams,
  ): void {
    this.stopReportCreate();
    this.stopReportPolling();
    this.showReportProgress();
    this.createDurationReportRequest.set(request);
  }

  private startCreateSearchWarrantsReport(
    request: CreateSearchWarrantsReportRequestParams,
  ): void {
    this.stopReportCreate();
    this.stopReportPolling();
    this.showReportProgress();
    this.createSearchWarrantsReportRequest.set(request);
  }

  private startCreateWorkloadReport(
    request: CreateWorkloadReportRequestParams,
  ): void {
    this.stopReportCreate();
    this.stopReportPolling();
    this.showReportProgress();
    this.createWorkloadReportRequest.set(request);
  }

  private startCreateActivityAuditReport(
    request: CreateActivityAuditReportRequestParams,
  ): void {
    this.stopReportCreate();
    this.stopReportPolling();
    this.showReportProgress();
    this.createActivityAuditReportRequest.set(request);
  }

  private setupEffects(): void {
    // POST /reports/duration/jobs
    setupLoadEffect(
      {
        request: this.createDurationReportRequest,
        load: (request) =>
          this.reportsApi.createDurationReport(
            request,
            'response',
            false,
            REPORT_JSON_OPTIONS,
          ),
        onSuccess: (response) => {
          this.createDurationReportRequest.set(null);
          this.handleReportJobCreated(response);
        },
        onError: (err) => {
          this.createDurationReportRequest.set(null);
          this.showReportError(this.toReportRequestError(err));
        },
      },
      this.envInjector,
    );

    // POST /reports/fees/jobs
    setupLoadEffect(
      {
        request: this.createFeesReportRequest,
        load: (request) =>
          this.reportsApi.createFeesReport(request, 'response', false, {
            httpHeaderAccept: 'application/vnd.hmcts.appreg.v1+json',
            transferCache: false,
          }),
        onSuccess: (response) => {
          const errDescription = response.body?.error_description;

          if (errDescription) {
            this.showReportError(errDescription);
            this.createFeesReportRequest.set(null);
            return;
          }

          this.handleReportJobCreated(response);
          this.createFeesReportRequest.set(null);
        },
        onError: (err) => {
          this.handleReportCreateError(err);
          this.createFeesReportRequest.set(null);
        },
      },
      this.envInjector,
    );

    // POST /reports/search-warrants/jobs
    setupLoadEffect(
      {
        request: this.createSearchWarrantsReportRequest,
        load: (request) =>
          this.reportsApi.createSearchWarrantsReport(
            request,
            'response',
            false,
            REPORT_JSON_OPTIONS,
          ),
        onSuccess: (response) => {
          this.createSearchWarrantsReportRequest.set(null);
          this.handleReportJobCreated(response);
        },
        onError: (err) => {
          this.createSearchWarrantsReportRequest.set(null);
          this.showReportError(this.toReportRequestError(err));
        },
      },
      this.envInjector,
    );

    // POST /reports/workload/jobs
    setupLoadEffect(
      {
        request: this.createWorkloadReportRequest,
        load: (request) =>
          this.reportsApi.createWorkloadReport(
            request,
            'response',
            false,
            REPORT_JSON_OPTIONS,
          ),
        onSuccess: (response) => {
          this.createWorkloadReportRequest.set(null);
          this.handleReportJobCreated(response);
        },
        onError: (err) => {
          this.createWorkloadReportRequest.set(null);
          this.showReportError(this.toReportRequestError(err));
        },
      },
      this.envInjector,
    );

    // POST /reports/list-maintenance/jobs
    setupLoadEffect(
      {
        request: this.createListMaintenanceReportRequest,
        load: (request) =>
          this.reportsApi.createListMaintenanceReport(
            request,
            'response',
            false,
            {
              httpHeaderAccept: 'application/vnd.hmcts.appreg.v1+json',
              transferCache: false,
            },
          ),
        onSuccess: (response) => {
          this.createListMaintenanceReportRequest.set(null);
          this.handleReportJobCreated(response);
        },
        onError: (err) => {
          this.createListMaintenanceReportRequest.set(null);
          this.showReportError(this.toReportRequestError(err));
        },
      },
      this.envInjector,
    );

    // POST /reports/activity-audit/jobs
    setupLoadEffect(
      {
        request: this.createActivityAuditReportRequest,
        load: (request) =>
          this.reportsApi.createActivityAuditReport(
            request,
            'response',
            false,
            {
              httpHeaderAccept: 'application/vnd.hmcts.appreg.v1+json',
              transferCache: false,
            },
          ),
        onSuccess: (response) => {
          this.createActivityAuditReportRequest.set(null);
          this.handleReportJobCreated(response);
        },
        onError: (err) => {
          this.createActivityAuditReportRequest.set(null);
          this.showReportError(this.toReportRequestError(err));
        },
      },
      this.envInjector,
    );
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().errorSummary.find((e) => e.id === id);
  }

  isReportInProgress(): boolean {
    return this.vm().reportFeedback?.kind === 'progress';
  }

  private preserveDateRange(
    previousReportId: ReportId | null,
    nextReportId: ReportId | null,
  ): void {
    if (!previousReportId || !nextReportId) {
      return;
    }

    const previousGroup = this.reportGroupFor(previousReportId);
    const nextGroup = this.reportGroupFor(nextReportId);

    if (!previousGroup || !nextGroup) {
      return;
    }

    const dateFrom = getTrimmedStringOrNullFromGroup(previousGroup, 'dateFrom');
    const dateTo = getTrimmedStringOrNullFromGroup(previousGroup, 'dateTo');

    if (!getTrimmedStringOrNullFromGroup(nextGroup, 'dateFrom') && dateFrom) {
      nextGroup.get('dateFrom')?.setValue(dateFrom);
    }

    if (!getTrimmedStringOrNullFromGroup(nextGroup, 'dateTo') && dateTo) {
      nextGroup.get('dateTo')?.setValue(dateTo);
    }
  }

  private clearReportSelectionState(reportId: ReportId | null): void {
    this.stopReportCreate();
    this.stopReportPolling();
    this.reportStatePatch({
      submitted: false,
      errorSummary: [],
      reportFeedback: null,
    });
    this.reportGroupFor(reportId)?.markAsPristine();
    this.reportGroupFor(reportId)?.markAsUntouched();
  }

  private emptyReportFormValue(reportId: ReportId): Record<string, unknown> {
    switch (reportId) {
      case 'activity-audit':
        return {
          ...REPORT_DATE_RESET_VALUE,
          username: '',
          activity: [],
        };
      case 'fees':
        return {
          ...REPORT_DATE_RESET_VALUE,
          standardApplicantCode: '',
          surnameOrOrg: '',
          ...REPORT_LOCATION_RESET_VALUE,
        };
      case 'list-maintenance':
        return {
          ...REPORT_DATE_RESET_VALUE,
          description: '',
          ...REPORT_LOCATION_RESET_VALUE,
        };
      case 'search-warrants':
      case 'workload':
      case 'duration':
        return {
          ...REPORT_DATE_RESET_VALUE,
          ...REPORT_LOCATION_RESET_VALUE,
        };
      case 'private-prosecutors-index':
        return {
          ...REPORT_DATE_RESET_VALUE,
          applicantSurnameOrOrg: '',
          applicantFirst: '',
          standardApplicantName: '',
          respondentFirst: '',
          respondentSurname: '',
          respondentOrg: '',
          ...REPORT_LOCATION_RESET_VALUE,
        };
    }
  }

  private clearLocationSearchState(): void {
    this.patch({
      courthouseSearch: '',
      cjaSearch: '',
      filteredCourthouses: [],
      filteredCja: [],
    });
  }

  private createListMaintenanceReport(): void {
    this.stopReportCreate();
    this.stopReportPolling();
    this.showReportProgress();
    this.createListMaintenanceReportRequest.set(
      mapListMaintenanceGroupToListMaintenanceReportRequestParams(
        this.listMaintenanceGroup,
      ),
    );
  }

  private createDurationReport(): void {
    this.startCreateDurationReport(
      mapDurationGroupToDurationReportRequestParams(this.durationGroup),
    );
  }

  private createSearchWarrantsReport(): void {
    this.startCreateSearchWarrantsReport(
      mapSearchWarrantsGroupToSearchWarrantsReportRequestParams(
        this.searchWarrantsGroup,
      ),
    );
  }

  private createWorkloadReport(): void {
    this.startCreateWorkloadReport(
      mapWorkloadGroupToWorkloadReportRequestParams(this.workloadGroup),
    );
  }

  private handleReportJobCreated(
    response: HttpResponse<JobAcknowledgement>,
  ): void {
    const jobId = this.readJobId(response.body);
    const errDescription = response.body?.error_description;

    // Guard if the response is 202 but contains a report error
    if (errDescription) {
      this.showReportError(errDescription);
      return;
    }

    if (response.status !== 202 || !jobId) {
      this.showReportError('The report could not be started. Try again.');
      return;
    }

    this.startReportPolling(jobId);
  }

  private startReportPolling(jobId: string): void {
    this.stopReportPolling();

    this.reportPollingSub = this.jobPollingFacade
      .watchJob(jobId, REPORT_POLL_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.componentDestroyRef))
      .subscribe({
        next: (job) => this.handleReportJobStatus(job),
        error: (err) => {
          this.showReportError(this.toReportRequestError(err));
        },
      });
  }

  private stopReportPolling(): void {
    this.reportPollingSub?.unsubscribe();
    this.reportPollingSub = null;
  }

  private stopReportCreate(): void {
    this.createDurationReportRequest.set(null);
    this.createFeesReportRequest.set(null);
    this.createListMaintenanceReportRequest.set(null);
    this.createSearchWarrantsReportRequest.set(null);
    this.createWorkloadReportRequest.set(null);
    this.createActivityAuditReportRequest.set(null);
  }

  private handleReportJobStatus(job: PolledJobStatus): void {
    if (!job.isTerminal) {
      return;
    }

    this.stopReportPolling();

    if (job.state === 'succeeded') {
      this.downloadReport(job.id);
      return;
    }

    this.showReportError(
      job.message ?? 'The report could not be generated. Try again.',
    );
  }

  private downloadReport(jobId: string): void {
    this.reportsApi
      .downloadReport({ jobId }, 'response', false, REPORT_CSV_OPTIONS)
      .pipe(take(1), takeUntilDestroyed(this.componentDestroyRef))
      .subscribe({
        next: (response) => {
          this.saveCsv(response);
        },
        error: (err) => {
          this.showReportError(this.toReportRequestError(err));
        },
      });
  }

  private saveCsv(response: HttpResponse<Blob>): void {
    if (!response.body) {
      this.showReportError('The report was generated but no CSV was returned.');
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const url = URL.createObjectURL(response.body);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = this.getReportFilename();
    link.style.display = 'none';

    this.document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.showReportSuccess();
  }

  private getReportFilename(): string {
    const reportId = this.getSelectedReportOption()?.id;
    const reportName = reportId ? `${reportId}-report` : 'report';

    return `${reportName}-${this.getDateStamp()}.csv`;
  }

  private getDateStamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private showReportProgress(): void {
    this.reportStatePatch({
      reportFeedback: { kind: 'progress' },
    });
  }

  private showReportSuccess(): void {
    const reportLabel = this.getReportLabel();

    this.reportStatePatch({
      reportFeedback: {
        kind: 'success',
        heading: 'Report downloaded',
        body: reportLabel
          ? `The ${reportLabel} report has downloaded.`
          : 'The report has downloaded.',
      },
    });
  }

  private getReportLabel(): string | null {
    return this.getSelectedReportOption()?.label.toLowerCase() ?? null;
  }

  private getSelectedReportOption(): (typeof reportOptions)[number] | null {
    const reportId = this.form.controls.report.value;
    return reportOptions.find((option) => option.id === reportId) ?? null;
  }

  private showReportError(text: string): void {
    this.stopReportPolling();
    this.reportStatePatch({
      reportFeedback: {
        kind: 'error',
        title: 'Report generation failed',
        items: [{ text }],
      },
    });
  }

  private toReportRequestError(err: unknown): string {
    const status = getHttpStatus(err);

    if (status === 401) {
      return 'You need to sign in to download this report.';
    }

    if (status === 403) {
      return 'You do not have permission to download this report.';
    }

    if (status === 0 || status >= 500) {
      return 'There was a problem generating the report. Try again later.';
    }

    return getProblemText(err);
  }

  private readJobId(body: JobAcknowledgement | null): string | null {
    if (!body) {
      return null;
    }

    const record = body as unknown as Record<string, unknown>;
    const id = record['id'] ?? record['jobId'];

    return typeof id === 'string' && id.trim() ? id : null;
  }

  private buildErrorSummary(): ErrorItem[] {
    const reportId = this.form.controls.report.value as ReportId | null;
    const selectedGroup = this.selectedReportGroup();

    if (!reportId || !selectedGroup) {
      return buildFormErrorSummary(this.form, this.errorMap, {
        hrefs: { report: '#report-activity-audit' },
      });
    }

    const errors = buildFormErrorSummary(selectedGroup, this.errorMap, {
      hrefs: REPORT_ERROR_HREFS[reportId],
      priorityKeys: REPORT_ERROR_PRIORITY_KEYS,
    });

    return this.withDateInputErrorText(errors, selectedGroup);
  }

  private handleReportCreateError(err: unknown): void {
    this.showReportError(this.toReportRequestError(err));
  }

  private withDateInputErrorText(
    errors: ErrorItem[],
    group: FormGroup,
  ): ErrorItem[] {
    return errors.map((error) => {
      if (error.id !== 'dateFrom' && error.id !== 'dateTo') {
        return error;
      }

      const dateErrorText = group.get(error.id)?.errors?.[
        'dateErrorText'
      ] as string;

      const text =
        typeof dateErrorText === 'string' ? dateErrorText : error.text;

      return { ...error, text: this.toDateSummaryText(error.id, text) };
    });
  }

  private toDateSummaryText(id: 'dateFrom' | 'dateTo', text: string): string {
    const label = REPORT_DATE_LABELS[id];
    const lowerLabel = label.toLowerCase();
    const trimmedText = text.trim();

    if (trimmedText === 'Enter day, month and year') {
      return `Enter ${lowerLabel}`;
    }

    if (trimmedText === 'Enter a valid date') {
      return `${label} must be a valid date`;
    }

    if (trimmedText.startsWith('Enter ')) {
      return `${label} must include ${this.addDatePartArticles(
        trimmedText.slice('Enter '.length),
      )}`;
    }

    if (trimmedText.startsWith('Date must')) {
      return `${label}${trimmedText.slice('Date'.length)}`;
    }

    return text;
  }

  private addDatePartArticles(text: string): string {
    return text
      .replace(/\bday\b/g, 'a day')
      .replace(/\bmonth\b/g, 'a month')
      .replace(/\byear\b/g, 'a year');
  }

  private selectedReportGroup(): FormGroup | null {
    return this.reportGroupFor(
      this.form.controls.report.value as ReportId | null,
    );
  }

  private reportGroupFor(reportId: ReportId | null): FormGroup | null {
    switch (reportId) {
      case 'activity-audit':
        return this.activityAuditGroup;
      case 'fees':
        return this.feesGroup;
      case 'list-maintenance':
        return this.listMaintenanceGroup;
      case 'search-warrants':
        return this.searchWarrantsGroup;
      case 'workload':
        return this.workloadGroup;
      case 'duration':
        return this.durationGroup;
      case 'private-prosecutors-index':
        return this.ppiGroup;
      default:
        return null;
    }
  }

  private initSelectedForm(): void {
    // attach validators and init place fields for the selected section
    const group = this.selectedReportGroup();

    if (!group || this.form.controls.report.value === 'activity-audit') {
      // Activity audit is the only form without location fields
      return;
    }

    this.initPlaceFields(group, this.refFacade);
    addLocationValidatorsToForm(group, () => this.state());
  }
}
