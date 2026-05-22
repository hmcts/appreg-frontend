import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription, take } from 'rxjs';

import { ReportsState, initialReportsState } from './util';

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
  JobAcknowledgement,
  LegacyReportLocation,
  ListMaintenanceFilterDto,
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
import { createSignalState } from '@util/signal-state-helpers';
import { addLocationValidatorsToForm } from '@validators/add-location-validators-to-form';
import { dateToOnOrAfterDateFromValidator } from '@validators/date-range.validator';

const REPORT_ERROR_PRIORITY_KEYS: Record<string, string[]> = {
  dateFrom: ['dateInvalid', 'required'],
  dateTo: ['dateInvalid', 'dateRange', 'required'],
};

const REPORT_POLL_INTERVAL_MS = 2_000;

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

  private readonly reportState =
    createSignalState<ReportsState>(initialReportsState);
  private readonly reportStatePatch = this.reportState.patch;
  readonly vm = this.reportState.vm;

  private previousReportId: ReportId | null = null;
  private reportPollingSub: Subscription | null = null;

  onCreateErrorClick = onCreateErrorClickFn;

  private readonly errorMap = REPORTS_FORM_ERROR_MESSAGES;

  // Reactive form backing the template
  override form = new FormGroup({
    report: new FormControl<string | null>(null, {
      validators: [(c) => Validators.required(c)],
    }),

    activityAudit: new FormGroup({
      dateFrom: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      dateTo: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      username: new FormControl<string | null>(''),
      activity: new FormControl<string | null>(''),
    }),

    fees: new FormGroup({
      dateFrom: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      dateTo: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      applicantCode: new FormControl<string | null>(''),
      surnameOrOrg: new FormControl<string | null>(''),
      court: new FormControl<string | null>(''),
      otherLocation: new FormControl<string | null>(''),
      cja: new FormControl<string | null>(''),
    }),

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
        validators: [dateToOnOrAfterDateFromValidator()],
      },
    ),

    searchWarrants: new FormGroup({
      dateFrom: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      dateTo: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      court: new FormControl<string | null>(''),
      otherLocation: new FormControl<string | null>(''),
      cja: new FormControl<string | null>(''),
    }),

    workload: new FormGroup({
      dateFrom: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      dateTo: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      court: new FormControl<string | null>(''),
      otherLocation: new FormControl<string | null>(''),
      cja: new FormControl<string | null>(''),
    }),

    duration: new FormGroup({
      dateFrom: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      dateTo: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      court: new FormControl<string | null>(''),
      otherLocation: new FormControl<string | null>(''),
      cja: new FormControl<string | null>(''),
    }),

    privateProsecutorsIndex: new FormGroup({
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
    }),
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
    });
  }

  onDownload(): void {
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

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().errorSummary.find((e) => e.id === id);
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

    const dateFrom = this.readFormString(previousGroup, 'dateFrom');
    const dateTo = this.readFormString(previousGroup, 'dateTo');

    if (!this.readFormString(nextGroup, 'dateFrom') && dateFrom) {
      nextGroup.get('dateFrom')?.setValue(dateFrom);
    }

    if (!this.readFormString(nextGroup, 'dateTo') && dateTo) {
      nextGroup.get('dateTo')?.setValue(dateTo);
    }
  }

  private readFormString(group: FormGroup, controlName: string): string | null {
    const value: unknown = group.get(controlName)?.value;
    return typeof value === 'string' ? value : null;
  }

  private createListMaintenanceReport(): void {
    this.stopReportPolling();
    this.showReportProgress();

    this.reportsApi
      .createListMaintenanceReport(
        { listMaintenanceFilterDto: this.buildListMaintenancePayload() },
        'response',
        false,
        {
          httpHeaderAccept: 'application/vnd.hmcts.appreg.v1+json',
          transferCache: false,
        },
      )
      .pipe(take(1), takeUntilDestroyed(this.componentDestroyRef))
      .subscribe({
        next: (response) => this.handleListMaintenanceJobCreated(response),
        error: (err) => {
          this.showReportError(this.toReportRequestError(err));
        },
      });
  }

  private handleListMaintenanceJobCreated(
    response: HttpResponse<JobAcknowledgement>,
  ): void {
    const jobId = this.readJobId(response.body);

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
      .downloadReport({ jobId }, 'response', false, {
        httpHeaderAccept: 'text/csv',
        transferCache: false,
      })
      .pipe(take(1), takeUntilDestroyed(this.componentDestroyRef))
      .subscribe({
        next: (response) => {
          this.saveCsv(response, jobId);
        },
        error: (err) => {
          this.showReportError(this.toReportRequestError(err));
        },
      });
  }

  private saveCsv(response: HttpResponse<Blob>, jobId: string): void {
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
    link.download =
      this.getDownloadFilename(response) ??
      `list-maintenance-report-${jobId}.csv`;
    link.style.display = 'none';

    this.document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.showReportSuccess();
  }

  private getDownloadFilename(response: HttpResponse<Blob>): string | null {
    const disposition = response.headers.get('content-disposition');
    if (!disposition) {
      return null;
    }

    const encodedFilename = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    if (encodedFilename) {
      return decodeURIComponent(encodedFilename);
    }

    return /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? null;
  }

  private showReportProgress(): void {
    this.reportStatePatch({
      reportFeedback: { kind: 'progress' },
    });
  }

  private showReportSuccess(): void {
    this.reportStatePatch({
      reportFeedback: {
        kind: 'success',
        heading: 'Report downloaded',
        body: 'The list maintenance report has downloaded.',
      },
    });
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

  private buildListMaintenancePayload(): ListMaintenanceFilterDto {
    const raw = this.listMaintenanceGroup.getRawValue() as Record<
      string,
      string | null
    >;
    const payload: ListMaintenanceFilterDto = {
      dateFrom: raw['dateFrom'] ?? '',
      dateTo: raw['dateTo'] ?? '',
    };
    const description = this.trim(raw['description']);
    const location = this.buildLegacyReportLocation(raw);

    if (description) {
      payload.listDescription = description;
    }

    if (location) {
      payload.location = location;
    }

    return payload;
  }

  private buildLegacyReportLocation(
    raw: Record<string, string | null>,
  ): LegacyReportLocation | null {
    const court = this.trim(raw['court']);
    const otherLocation = this.trim(raw['otherLocation']);
    const cja = this.trim(raw['cja']);

    if (court) {
      return { courtLocationCode: court };
    }

    const location: LegacyReportLocation = {};

    if (otherLocation) {
      location.otherLocationDescription = otherLocation;
    }

    if (cja) {
      location.cjaCode = cja;
    }

    return Object.keys(location).length > 0 ? location : null;
  }

  private trim(value: string | null | undefined): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed || null;
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

      if (typeof dateErrorText !== 'string') {
        return error;
      }

      return { ...error, text: dateErrorText };
    });
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
