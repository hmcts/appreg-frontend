/**
 * TODO: arcpoc-816
 * prio 4
 * refactor create flow with multiple flags and manual subscribe
 */

/*
Applications List Entry – Create (/applications-list/:id/create)

Functionality:
  - Creates application list entry payload
    - Validate against DTO
    - Conform valid data to existing types/DTOs
  - Run POST query with payload
*/

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { toOptionalTrimmed } from './util/helpers';

import { AccordionComponent } from '@components/accordion/accordion.component';
import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { NotesSectionComponent } from '@components/notes-section/notes-section.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '@components/person-section/person-section.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { WordingParserComponent } from '@components/wording-parser/wording-parser.component';
import { ENTRY_ERROR_MESSAGES } from '@constants/application-list-entry/error-messages';
import {
  ApplicationCodeGetSummaryDto,
  ApplicationListEntriesApi,
} from '@openapi';
import { ApplicantStep } from '@page-types/applications-list-entry-create';
import { ApplicationListEntryFormService } from '@services/application-list-entry-form.service';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { buildFormErrorSummary } from '@util/error-summary';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';

type ChildErrorSource = 'notes' | 'fee' | 'respondent' | 'applicant';

@Component({
  selector: 'app-applications-list-entry-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    AccordionComponent,
    SelectInputComponent,
    BreadcrumbsComponent,
    ReactiveFormsModule,
    RouterModule,
    SuccessBannerComponent,
    ErrorSummaryComponent,
    SortableTableComponent,
    AccordionComponent,
    MojButtonMenuDirective,
    ApplicationCodeSearchComponent,
    TextInputComponent,
    DateInputComponent,
    PersonSectionComponent,
    OrganisationSectionComponent,
    NotesSectionComponent,
    WordingParserComponent,
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
  templateUrl: './applications-list-entry-create.component.html',
})
export class ApplicationsListEntryCreate implements OnInit {
  route = inject(ActivatedRoute);
  appEntryApi = inject(ApplicationListEntriesApi);
  formSvc = inject(ApplicationListEntryFormService);

  id: string = '';
  step: ApplicantStep = 'select';

  createDone: boolean = false;
  submitted: boolean = false;
  errorFound: boolean = false;
  errorHint: string = '';

  summaryErrors: ErrorItem[] = [];

  private parentErrors: ErrorItem[] = [];
  private childErrors: Record<ChildErrorSource, ErrorItem[]> = {
    notes: [],
    fee: [],
    respondent: [],
    applicant: [],
  };

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  forms = this.formSvc.createForms();
  form = this.forms.form;
  personForm = this.forms.personForm;
  organisationForm = this.forms.organisationForm;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
  }

  private resetFlags(): void {
    this.submitted = true;
    this.errorFound = false;
    this.errorHint = '';
    this.createDone = false;

    this.clearErrors();
  }

  private clearErrors(): void {
    this.summaryErrors = [];
    this.parentErrors = [];
    this.childErrors = {
      notes: [],
      fee: [],
      respondent: [],
      applicant: [],
    };
  }

  onSubmit(e: Event): void {
    e.preventDefault();

    this.resetFlags();

    //Run Angular validation
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    const v = this.form.value;
    const appCode = toOptionalTrimmed(v.applicationCode);

    //TODO: This could probably be handled via Angular form validation
    // Custom rule: application code required
    if (!appCode) {
      const control = this.form.controls.applicationCode;
      const newErrors = { ...control.errors, required: true };
      control.setErrors(newErrors);
    }

    // Build error summary from control errors + child errors
    this.updateAllErrors();

    if (this.errorFound) {
      // Don't submit if we’ve got validation errors
      return;
    }

    const entryCreateDto = this.formSvc.buildCreateDto(
      this.forms,
      this.form.value.standardApplicantCode,
    );

    this.appEntryApi
      .createApplicationListEntry({ listId: this.id, entryCreateDto })
      .subscribe({
        next: () => {
          this.createDone = true;
        },
        error: (err: HttpErrorResponse) => {
          this.errorFound = true;
          this.errorHint = getProblemText(err);
        },
      });
    this.submitted = false;
  }

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, ENTRY_ERROR_MESSAGES, {
      nested: [{ path: 'applicationNotes', prefixId: 'applicationNotes' }],
    });
  }

  private updateAllErrors(): void {
    this.parentErrors = this.buildErrorSummary();
    const allChildErrors = Object.values(this.childErrors).flat();

    this.summaryErrors = [...this.parentErrors, ...allChildErrors];
    this.errorFound = this.summaryErrors.length > 0;
  }

  onChildErrors(source: ChildErrorSource, errors: ErrorItem[]): void {
    this.childErrors[source] = errors ?? [];
    this.updateAllErrors();
  }

  onCodeSelected(row: ApplicationCodeGetSummaryDto): void {
    this.form.patchValue({ applicationCode: row.applicationCode });
  }
}
