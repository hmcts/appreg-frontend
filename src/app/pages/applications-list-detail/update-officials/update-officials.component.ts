import { Location, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  UpdateOfficialsApplication,
  UpdateOfficialsNavState,
} from './update-officials.types';

import { APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { buildOfficialsFromFormValue } from '@components/applications-list-entry-detail/util/entry-detail.form';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { OfficialsSectionComponent } from '@components/officials-section/officials-section.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { OFFICIAL_FIELD_MESSAGES } from '@constants/application-list-entry/error-messages';
import { OFFICIALS_ERROR_HREFS } from '@constants/application-list-entry/respondent/error-hrefs';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import {
  focusErrorSummary,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { buildFormErrorSummary } from '@util/error-summary';

@Component({
  selector: 'app-update-officials',
  imports: [
    BreadcrumbsComponent,
    ErrorSummaryComponent,
    OfficialsSectionComponent,
    SortableTableComponent,
  ],
  templateUrl: './update-officials.component.html',
})
export class UpdateOfficialsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly formService = inject(ApplicationListEntryFormService);

  readonly form = this.formService.createForms().form;
  readonly columns = APPLICATION_ENTRIES_RESULT_WORDING_COLUMNS;
  readonly errorSummary = signal<ErrorItem[]>([]);

  readonly onCreateErrorClick = onCreateErrorClickFn;

  listId = this.route.snapshot.paramMap.get('id') ?? '';
  rows: UpdateOfficialsApplication[] = [];

  constructor() {
    this.form.controls.applicationCode.disable({ emitEvent: false });
    this.form.controls.lodgementDate.disable({ emitEvent: false });
  }

  ngOnInit(): void {
    const navState = isPlatformBrowser(this.platformId)
      ? (this.location.getState() as UpdateOfficialsNavState)
      : undefined;

    this.rows = navState?.updateOfficialsApplications ?? [];

    if (navState?.officialFormValue) {
      this.form.patchValue(navState.officialFormValue, { emitEvent: false });
    }

    if (!this.listId || !this.rows.length) {
      this.goBack();
    }
  }

  onSaveOfficials(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    const errors = this.buildOfficialsErrorSummary();
    if (errors.length) {
      this.errorSummary.set(errors);
      focusErrorSummary(this.platformId);
      return;
    }

    const officials =
      buildOfficialsFromFormValue(this.form.getRawValue()).officials ?? [];

    if (!officials.length) {
      this.errorSummary.set([
        {
          id: 'mags1FirstName',
          href: OFFICIALS_ERROR_HREFS.mags1FirstName,
          text: 'Enter at least one official',
        },
      ]);
      focusErrorSummary(this.platformId);
      return;
    }

    if (!this.listId || !this.rows.length) {
      this.goBack();
      return;
    }

    void this.router.navigate(['confirm'], {
      relativeTo: this.route,
      state: {
        updateOfficialsApplications: this.rows,
        officialFormValue: this.form.getRawValue(),
        officials,
      } satisfies UpdateOfficialsNavState,
    });
  }

  goBack(): void {
    if (this.listId) {
      void this.router.navigate(['/applications-list', this.listId]);
      return;
    }

    void this.router.navigate(['/applications-list']);
  }

  private buildOfficialsErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, OFFICIAL_FIELD_MESSAGES, {
      hrefs: OFFICIALS_ERROR_HREFS,
    });
  }
}
