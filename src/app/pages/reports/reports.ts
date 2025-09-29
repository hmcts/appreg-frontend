import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ActivityAuditSectionComponent } from '../../shared/components/activity-audit-section/activity-audit-section.component';
import { DurationSectionComponent } from '../../shared/components/duration-section/duration-section.component';
import { FeesSectionComponent } from '../../shared/components/fees-section/fees-section.component';
import { ListMaintenanceSectionComponent } from '../../shared/components/list-maintenance-section/list-maintenance-section.component';
import {
  PrivateProsecutorsIndexSectionComponent
} from '../../shared/components/private-prosecutors-index-section/private-prosecutors-index-section.component';
import { ReportOption, ReportSelectorComponent } from '../../shared/components/report-option/report-selector.component';
import { SearchWarrantsSectionComponent } from '../../shared/components/search-warrants-section/search-warrants-section.component';
import { WorkloadSectionComponent } from '../../shared/components/workload-section/workload-section.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReportSelectorComponent,
    ActivityAuditSectionComponent,
    FeesSectionComponent,
    ListMaintenanceSectionComponent,
    SearchWarrantsSectionComponent,
    WorkloadSectionComponent,
    DurationSectionComponent,
    PrivateProsecutorsIndexSectionComponent,
  ],
  templateUrl: './reports.html',
})
export class Reports {
  // Reactive form backing the template
  form = new FormGroup({
    report: new FormControl<string | null>(null),

    activityAudit: new FormGroup({
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
      username: new FormControl<string | null>(''),
      activity: new FormControl<string | null>(''),
    }),

    fees: new FormGroup({
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
      applicantCode: new FormControl<string | null>(''),
      surnameOrOrg: new FormControl<string | null>(''),
      court: new FormControl<string | null>(''),
      otherLocation: new FormControl<string | null>(''),
      cja: new FormControl<string | null>(''),
    }),

    listMaintenance: new FormGroup({
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
      description: new FormControl<string | null>(''),
      court: new FormControl<string | null>(''),
      otherLocation: new FormControl<string | null>(''),
      cja: new FormControl<string | null>(''),
    }),

    searchWarrants: new FormGroup({
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
      court: new FormControl<string | null>(''),
      otherLocation: new FormControl<string | null>(''),
      cja: new FormControl<string | null>(''),
    }),

    workload: new FormGroup({
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
      court: new FormControl<string | null>(''),
      otherLocation: new FormControl<string | null>(''),
      cja: new FormControl<string | null>(''),
    }),

    duration: new FormGroup({
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
      court: new FormControl<string | null>(''),
      otherLocation: new FormControl<string | null>(''),
      cja: new FormControl<string | null>(''),
    }),

    privateProsecutorsIndex: new FormGroup({
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
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
  reportOptions: ReportOption[] = [
    {
      id: 'activity-audit',
      label: 'Activity audit',
      hint: 'Provides a report of all user activity for a given period and optionally filtered by username and court',
    },
    {
      id: 'fees',
      label: 'Fees',
      hint: 'Report of dealt-with applications with fee details for a date range and optional filters',
    },
    {
      id: 'list-maintenance',
      label: 'List maintenance',
      hint: "Provides a report of all 'open' lists that are older than a specified date",
    },
    {
      id: 'search-warrants',
      label: 'Search warrants',
      hint: 'Provides an index of all search warrants by date and location filters',
    },
    {
      id: 'workload',
      label: 'Workload',
      hint: 'Closed lists by date and location within a specified period',
    },
    {
      id: 'duration',
      label: 'Duration',
      hint: 'Closed lists with recorded duration for a date range and location filters',
    },
    {
      id: 'private-prosecutors-index',
      label: 'Private prosecutors index',
      hint: 'Index of applications for MX99010 (private prosecutors)',
    },
  ] as const;

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
}
