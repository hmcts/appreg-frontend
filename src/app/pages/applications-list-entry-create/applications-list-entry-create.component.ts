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
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';

import {
  ApplicationsListEntryCreateState,
  ChildErrorSource,
  initialApplicationsListEntryCreateState,
  toOptionalTrimmed,
} from './util';

import { AccordionComponent } from '@components/accordion/accordion.component';
import { ApplicantSectionComponent } from '@components/applicant-section/applicant-section.component';
import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import {
  APPLICANT_TYPE_OPTIONS,
  PERSON_TITLE_OPTIONS,
  RESPONDENT_TYPE_OPTIONS,
} from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { NotesSectionComponent } from '@components/notes-section/notes-section.component';
import { RespondentSectionComponent } from '@components/respondent-section/respondent-section.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { ENTRY_ERROR_MESSAGES } from '@constants/application-list-entry/error-messages';
import {
  APPLICANT_ORG_ERROR_HREFS,
  APPLICANT_PERSON_ERROR_HREFS,
  RESPONDENT_BULK_ERROR_HREFS,
  RESPONDENT_ORG_ERROR_HREFS,
  RESPONDENT_PERSON_ERROR_HREFS,
} from '@constants/application-list-entry/respondent/error-hrefs';
import { ApplicationCodesApi, ApplicationListEntriesApi } from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import { ApplicantType } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import { buildRespondentErrors } from '@util/applications-list-entry-error-helpers';
import {
  focusErrorSummary,
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getUniqueErrors } from '@util/error-items';
import { buildFormErrorSummary } from '@util/error-summary';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { respondentFormsHaveAnyValue } from '@util/respondent-helpers';
import { createSignalState } from '@util/signal-state-helpers';

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
    NotesSectionComponent,
    ApplicantSectionComponent,
    RespondentSectionComponent,
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
  templateUrl: './applications-list-entry-create.component.html',
})
export class ApplicationsListEntryCreate implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  route = inject(ActivatedRoute);
  appEntryApi = inject(ApplicationListEntriesApi);
  applicationCodesApi = inject(ApplicationCodesApi);
  formSvc = inject(ApplicationListEntryFormService);
  private readonly platformId = inject(PLATFORM_ID);

  // Initialise signal state
  private readonly appListEntryCreateSignalState =
    createSignalState<ApplicationsListEntryCreateState>(
      initialApplicationsListEntryCreateState,
    );
  private readonly appListEntryCreateState =
    this.appListEntryCreateSignalState.state;
  private readonly appListEntryCreatePatch =
    this.appListEntryCreateSignalState.patch;
  readonly vm = this.appListEntryCreateSignalState.vm;

  private parentErrors: ErrorItem[] = [];
  private childErrors: Record<ChildErrorSource, ErrorItem[]> = {
    notes: [],
    fee: [],
    respondent: [],
    applicant: [],
  };

  respondentEntryTypeOptions = RESPONDENT_TYPE_OPTIONS;
  personTitleOptions = PERSON_TITLE_OPTIONS;
  applicantEntryTypeOptions = APPLICANT_TYPE_OPTIONS;

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  forms = this.formSvc.createForms();
  form = this.forms.form;
  personForm = this.forms.personForm;
  organisationForm = this.forms.organisationForm;

  ngOnInit(): void {
    this.appListEntryCreateState().id = this.route.snapshot.paramMap.get('id')!;
    this.bindApplicantTypeChanges();
  }

  private resetFlags(): void {
    this.appListEntryCreatePatch({
      submitted: false,
      errorFound: false,
      errorHint: '',
      createDone: false,
    });

    this.clearErrors();
  }

  private clearErrors(): void {
    this.appListEntryCreatePatch({
      summaryErrors: [],
    });

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

    if (this.appListEntryCreateState().errorFound) {
      // Don't submit if we’ve got validation errors
      return;
    }

    const entryCreateDto = this.formSvc.buildCreateDto(
      this.forms,
      this.form.value.standardApplicantCode,
    );

    this.appListEntryCreatePatch({ submitted: true });
    this.appEntryApi
      .createApplicationListEntry({
        listId: this.appListEntryCreateState().id,
        entryCreateDto,
      })
      .subscribe({
        next: () => {
          this.appListEntryCreatePatch({ createDone: true });
        },
        error: (err: HttpErrorResponse) => {
          const errorHintMsg = getProblemText(err);

          this.appListEntryCreatePatch({
            errorFound: true,
            errorHint: errorHintMsg,
          });
        },
      });
    this.appListEntryCreatePatch({ submitted: false });
  }

  get respondentErrorItems(): ErrorItem[] {
    return this.childErrors.respondent;
  }

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, ENTRY_ERROR_MESSAGES, {
      nested: [{ path: 'applicationNotes', prefixId: 'applicationNotes' }],
    });
  }

  private updateApplicantErrors(): void {
    if (this.form.controls.applicantType.value === 'person') {
      this.personForm.markAllAsTouched();
      this.personForm.updateValueAndValidity({ emitEvent: false });

      this.childErrors.applicant = buildFormErrorSummary(
        this.personForm,
        ENTRY_ERROR_MESSAGES,
        { hrefs: APPLICANT_PERSON_ERROR_HREFS },
      );
      return;
    }

    if (this.form.controls.applicantType.value === 'org') {
      this.organisationForm.markAllAsTouched();
      this.organisationForm.updateValueAndValidity({ emitEvent: false });

      this.childErrors.applicant = buildFormErrorSummary(
        this.organisationForm,
        ENTRY_ERROR_MESSAGES,
        { hrefs: APPLICANT_ORG_ERROR_HREFS },
      );
      return;
    }

    this.childErrors.applicant = [];
  }

  private updateRespondentErrors(): void {
    // Run validation if respondent is required
    // and when respondent forms are fully/partially populated
    const isRespondentRequired =
      this.appListEntryCreateState().appCodeDetail?.requiresRespondent ?? true;

    const respondentFormHasValues = respondentFormsHaveAnyValue({
      numberOfRespondents: this.form.controls.numberOfRespondents,
      respondentPersonForm: this.forms.respondentPersonForm,
      respondentOrganisationForm: this.forms.respondentOrganisationForm,
    });

    const shouldValidateRespondent =
      isRespondentRequired || respondentFormHasValues;

    if (shouldValidateRespondent) {
      this.childErrors.respondent = buildRespondentErrors({
        respondentEntryType: this.form.controls.respondentEntryType.value,
        respondentPersonForm: this.forms.respondentPersonForm,
        respondentOrganisationForm: this.forms.respondentOrganisationForm,
        errorMessages: ENTRY_ERROR_MESSAGES,
        respondentPersonHrefs: RESPONDENT_PERSON_ERROR_HREFS,
        respondentOrganisationHrefs: RESPONDENT_ORG_ERROR_HREFS,
        respondentBulkControl: this.form.controls.numberOfRespondents,
        respondentBulkHrefs: RESPONDENT_BULK_ERROR_HREFS,
      });
      return;
    }

    this.childErrors.respondent = [];
  }

  private updateAllErrors(): void {
    this.updateApplicantErrors();
    this.updateRespondentErrors();

    this.parentErrors = this.buildErrorSummary();
    const allChildErrors = Object.values(this.childErrors).flat();
    const summaryErrors = [
      ...getUniqueErrors(this.parentErrors, allChildErrors),
    ];

    this.appListEntryCreatePatch({
      summaryErrors,
      errorFound: summaryErrors.length > 0,
    });

    if (this.appListEntryCreateState().errorFound) {
      focusErrorSummary(this.platformId);
    }
  }

  onChildErrors(source: ChildErrorSource, errors: ErrorItem[]): void {
    this.childErrors[source] = errors ?? [];
    this.updateAllErrors();
  }

  onCodeSelected(codeAndLodgementDate: { code: string; date: string }): void {
    this.appListEntryCreatePatch({ bulkApplicationsAllowed: false });

    const prevSelection = {
      code: this.form.controls.applicationCode.value,
      date: this.form.controls.lodgementDate.value,
    };

    this.form.patchValue({
      applicationCode: codeAndLodgementDate.code,
      lodgementDate: codeAndLodgementDate.date,
    });
    // Call API to retrieve data associated with the App code
    if (this.form.value.applicationCode && this.form.value.lodgementDate) {
      this.applicationCodesApi
        .getApplicationCodeByCodeAndDate(
          {
            code: codeAndLodgementDate.code,
            date: codeAndLodgementDate.date,
          },
          'body',
          false,
          { transferCache: true },
        )
        .subscribe({
          next: (appCodeDetail) => {
            const hasSelectionChanged =
              prevSelection.code !== codeAndLodgementDate.code;

            // if user selected a different code/date than current form, reset dependent sections
            if (hasSelectionChanged) {
              this.formSvc.resetSectionsOnApplicationCodeChange(this.forms);
            }

            this.appListEntryCreatePatch({
              bulkApplicationsAllowed:
                appCodeDetail.bulkRespondentAllowed ?? false,
              appCodeDetail,
            });
          },
          error: () => {},
        });
    }
  }

  onStandardApplicantCodeChanged(code: string | null): void {
    this.formSvc.setStandardApplicantCode(this.forms, code, {
      emitEvent: false,
    });
  }

  private bindApplicantTypeChanges(): void {
    this.form.controls.applicantType.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((type): ApplicantType => type ?? 'person'),
      )
      .subscribe((t) => {
        this.appListEntryCreatePatch({ submitted: false });
        this.clearErrors();

        // reset/rehydrate subforms + keep standardApplicantCode in sync
        this.formSvc.onApplicantTypeChanged(this.forms, t);
        this.formSvc.syncApplicantTypeState(this.forms, t);
      });
  }

  get applicantErrorItems(): ErrorItem[] {
    return this.childErrors.applicant;
  }
}
