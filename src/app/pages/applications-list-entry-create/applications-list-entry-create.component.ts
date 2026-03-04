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

import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';

import { parseCreateNavState } from './util/navigation-state';

import { AccordionComponent } from '@components/accordion/accordion.component';
import { ApplicantSectionComponent } from '@components/applicant-section/applicant-section.component';
import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import {
  APPLICANT_TYPE_OPTIONS,
  CIVIL_FEE_COLUMNS,
  FEE_STATUS_OPTIONS,
  PERSON_TITLE_OPTIONS,
} from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { readNavState } from '@components/applications-list-entry-detail/util/routing-state-util';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  CivilFeeForm,
  CivilFeeSectionComponent,
} from '@components/civil-fee-section/civil-fee-section.component';
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
import { WordingSectionComponent } from '@components/wording-section/wording-section.component';
import { ENTRY_ERROR_MESSAGES } from '@constants/application-list-entry/error-messages';
import {
  APPLICANT_ORG_ERROR_HREFS,
  APPLICANT_PERSON_ERROR_HREFS,
} from '@constants/application-list-entry/respondent/error-hrefs';
import {
  ApplicationCodeGetDetailDto,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  TemplateSubstitution,
} from '@openapi';
import {
  ApplicantStep,
  EntryCreateSnapshot,
} from '@page-types/applications-list-entry-create';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import { ApplicantType } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import {
  AddFeeDetailsPayload,
  CivilFeeMeta,
} from '@shared-types/civil-fee/civil-fee';
import {
  readPaymentRefReturnState,
  updateFeeStatusesControl,
  updatePaymentReferenceInFeeStatusesControl,
} from '@util/civil-fee-utils';
import {
  focusErrorSummary,
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getUniqueErrors } from '@util/error-items';
import { buildFormErrorSummary } from '@util/error-summary';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';

type ChildErrorSource =
  | 'notes'
  | 'fee'
  | 'respondent'
  | 'applicant'
  | 'wording'
  | 'civilFee';

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
    PersonSectionComponent,
    OrganisationSectionComponent,
    NotesSectionComponent,
    WordingSectionComponent,
    ApplicantSectionComponent,
    CivilFeeSectionComponent,
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
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);

  id: string = '';
  step: ApplicantStep = 'select';
  appCodeDetail: ApplicationCodeGetDetailDto | null = null;

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
    wording: [],
    civilFee: [],
  };

  wordingSubmitAttempt = signal(0);

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  forms = this.formSvc.createForms();
  form = this.forms.form;
  personForm = this.forms.personForm;
  organisationForm = this.forms.organisationForm;

  applicantEntryTypeOptions = APPLICANT_TYPE_OPTIONS;
  personTitleOptions = PERSON_TITLE_OPTIONS;

  // Civil fee
  civilFeeColumns = CIVIL_FEE_COLUMNS;
  feeStatusOptions = FEE_STATUS_OPTIONS;
  feeMeta: CivilFeeMeta | null = null;
  civilFeeForm: CivilFeeForm = this.formSvc.createCivilFeeForm(this.forms);
  isFeeRequired: boolean = false;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.bindApplicantTypeChanges();
    this.restoreNavigationState();
  }

  resetParentErrorsFromCodeSearch(): void {
    this.resetFlags();
  }

  private resetFlags(): void {
    this.submitted = false;
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
      wording: [],
      civilFee: [],
    };
  }

  onSubmit(e: Event): void {
    e.preventDefault();

    this.wordingSubmitAttempt.update((n) => n + 1);
    this.resetFlags();

    this.submitted = true;

    //Run Angular validation
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    // Build error summary from control errors + child errors
    this.updateErrors({ validateOtherSections: this.submitted });

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

  onWordingFieldsDTO(dto: { wordingFields: TemplateSubstitution[] }): void {
    this.forms.form.patchValue({
      wordingFields: dto.wordingFields,
    });
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

  private updateErrors(opts: { validateOtherSections: boolean }): void {
    // Full or partial validation
    if (opts.validateOtherSections) {
      this.updateApplicantErrors();
      this.parentErrors = this.buildErrorSummary();
    }

    const allChildErrors = Object.values(this.childErrors).flat();
    this.summaryErrors = [
      ...getUniqueErrors(this.parentErrors, allChildErrors),
    ];
    this.errorFound = this.summaryErrors.length > 0;

    if (opts.validateOtherSections && this.errorFound) {
      focusErrorSummary(this.platformId);
    }
  }

  onChildErrors(source: ChildErrorSource, errors: ErrorItem[]): void {
    this.childErrors[source] = errors ?? [];
    this.updateErrors({ validateOtherSections: this.submitted });
  }

  onCodeSelected(codeAndLodgementDate: { code: string; date: string }): void {
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
            const prevCode = this.appCodeDetail?.applicationCode;
            const newCode = appCodeDetail.applicationCode;

            this.appCodeDetail = appCodeDetail;

            // if user selected a different code than what we had, reset sections
            if (prevCode !== newCode) {
              const hadSubmitAttempt = this.submitted;

              this.wordingSubmitAttempt.set(0);
              this.formSvc.resetSectionsOnApplicationCodeChange(this.forms);

              if (hadSubmitAttempt) {
                this.onChildErrors('wording', []);
              } else {
                this.childErrors.wording = [];
              }
            }

            this.isFeeRequired = appCodeDetail.isFeeDue;
            this.feeMeta = {
              feeReference: appCodeDetail.feeReference ?? null,
              feeAmount: appCodeDetail.feeAmount ?? null,
              offsiteFeeAmount: appCodeDetail.offsiteFeeAmount ?? null,
            };
          },
          error: () => {},
        });
    } else {
      this.appCodeDetail = null;
    }
  }

  onStandardApplicantCodeChanged(code: string | null): void {
    this.formSvc.setStandardApplicantCode(this.forms, code, {
      emitEvent: false,
    });
  }

  onAddFeeDetails(payload: AddFeeDetailsPayload): void {
    updateFeeStatusesControl(this.form.controls.feeStatuses, payload);
  }

  onOffsiteFeeChanged(nextValue: boolean): void {
    this.form.controls.hasOffsiteFee.setValue(nextValue, { emitEvent: false });
    this.form.controls.hasOffsiteFee.markAsDirty();
  }

  buildChangePaymentReferenceState = (): Record<string, unknown> => ({
    entryCreateSnapshot: this.buildEntryCreateSnapshot(),
  });

  private bindApplicantTypeChanges(): void {
    this.form.controls.applicantType.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((type): ApplicantType => type ?? 'person'),
      )
      .subscribe((t) => {
        this.submitted = false;
        this.clearErrors();

        // reset/rehydrate subforms + keep standardApplicantCode in sync
        this.formSvc.onApplicantTypeChanged(this.forms, t);
        this.formSvc.syncApplicantTypeState(this.forms, t);
      });
  }

  get applicantErrorItems(): ErrorItem[] {
    return this.childErrors.applicant;
  }

  private restoreNavigationState(): void {
    const rawNavState = readNavState(this.location, this.platformId);
    const navState = parseCreateNavState(rawNavState);

    this.applyEntryCreateSnapshot(navState.entryCreateSnapshot);
    this.applyPaymentRefReturn(navState.paymentRefReturn);
    this.clearNavigationStateOnly();
  }

  private applyPaymentRefReturn(state: unknown): void {
    const paymentRefReturn = readPaymentRefReturnState(state);
    if (!paymentRefReturn) {
      return;
    }

    updatePaymentReferenceInFeeStatusesControl(
      this.form.controls.feeStatuses,
      paymentRefReturn.updatedRowId,
      paymentRefReturn.newPaymentReference,
    );
  }

  private buildEntryCreateSnapshot(): EntryCreateSnapshot {
    return {
      form: this.form.getRawValue(),
      personForm: this.personForm.getRawValue(),
      organisationForm: this.organisationForm.getRawValue(),
      respondentPersonForm: this.forms.respondentPersonForm.getRawValue(),
      respondentOrganisationForm:
        this.forms.respondentOrganisationForm.getRawValue(),
      appCodeDetail: this.appCodeDetail,
      feeMeta: this.feeMeta,
      isFeeRequired: this.isFeeRequired,
    };
  }

  private applyEntryCreateSnapshot(state: unknown): void {
    // We need to store a draft of the current forms so when we nav back from payment ref page
    // we patch the cleaned forms with the draft values
    if (state === null || typeof state !== 'object') {
      return;
    }

    const draft = state as Partial<EntryCreateSnapshot>;

    if (draft.form) {
      this.form.patchValue(draft.form, { emitEvent: false });
    }
    if (draft.personForm) {
      this.personForm.patchValue(draft.personForm, { emitEvent: false });
    }
    if (draft.organisationForm) {
      this.organisationForm.patchValue(draft.organisationForm, {
        emitEvent: false,
      });
    }
    if (draft.respondentPersonForm) {
      this.forms.respondentPersonForm.patchValue(draft.respondentPersonForm, {
        emitEvent: false,
      });
    }
    if (draft.respondentOrganisationForm) {
      this.forms.respondentOrganisationForm.patchValue(
        draft.respondentOrganisationForm,
        {
          emitEvent: false,
        },
      );
    }

    this.appCodeDetail = draft.appCodeDetail ?? null;

    this.form.patchValue({
      applicationTitle: this.appCodeDetail?.title ?? null,
    });

    this.feeMeta = draft.feeMeta ?? null;
    this.isFeeRequired = draft.isFeeRequired === true;

    const type = this.form.controls.applicantType.value ?? 'person';
    this.formSvc.syncApplicantTypeState(this.forms, type);
  }

  private clearNavigationStateOnly(): void {
    const current = (history.state ?? {}) as Record<string, unknown>;
    const { paymentRefReturn, entryCreateSnapshot, row, ...rest } = current;
    history.replaceState(rest, '');
  }
}
