import { Component, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ReportsState, initialReportsState } from './util';

import { ActivityAuditSectionComponent } from '@components/activity-audit-section/activity-audit-section.component';
import { buildSuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
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
import { WorkloadSectionComponent } from '@components/workload-section/workload-section.component';
import {
  REPORTS_FORM_ERROR_MESSAGES,
  REPORT_ERROR_HREFS,
} from '@constants/reports/report-err';
import { reportOptions } from '@constants/reports/report-selector.constant';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { ReportId } from '@shared-types/reports/report.types';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { buildFormErrorSummary } from '@util/error-summary';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState } from '@util/signal-state-helpers';
import { addLocationValidatorsToForm } from '@validators/add-location-validators-to-form';

const REPORT_ERROR_PRIORITY_KEYS: Record<string, string[]> = {
  dateFrom: ['dateInvalid', 'required'],
  dateTo: ['dateInvalid', 'required'],
};

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
  ],
  templateUrl: './reports.component.html',
})
export class Reports extends PlaceFieldsBase implements OnInit {
  private readonly refFacade = inject(ReferenceDataFacade);

  private readonly reportState =
    createSignalState<ReportsState>(initialReportsState);
  private readonly reportStatePatch = this.reportState.patch;
  readonly vm = this.reportState.vm;

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

    listMaintenance: new FormGroup({
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
    }),

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
    this.initPlaceFields(this.searchWarrantsGroup, this.refFacade);

    addLocationValidatorsToForm(this.searchWarrantsGroup, () => this.state());
  }

  onDownload(): void {
    this.form.controls.report.markAsTouched();
    this.form.controls.report.updateValueAndValidity({ emitEvent: false });
    this.reportStatePatch({ submitted: true, errorSummary: [] });

    const selectedGroup = this.selectedReportGroup();
    selectedGroup?.markAllAsTouched();
    selectedGroup?.updateValueAndValidity({ emitEvent: false });

    const validationErrors = this.buildErrorSummary();

    if (validationErrors.length) {
      this.reportStatePatch({ errorSummary: validationErrors });
      return;
    }

    // TODO: download csv
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
    switch (this.form.controls.report.value) {
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
}
