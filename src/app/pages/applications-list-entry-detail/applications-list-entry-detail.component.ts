/**
 * TODO: arcpoc-816
 * prio 4
 * Refactor complex multi-section form; many flags/errors and side effects even though it uses takeUntilDestroyed.
 * lower prio but will be affected by migration
 */

/*
  Main component for /applications-list/:listId/entries/:entryId
  Functionality:
    On load:
      - Reads list and entry IDs from the route/query params
      - Fetches the entry details and initial application code metadata
      - Builds and hydrates the entry detail form (codes, applicant, respondent, wording, fees, notes, officials)
    Application code section:
      - Searches application codes and maps results into the sortable table
      - Updates the entry with the selected application code via full PUT and refreshes wording metadata
    Applicant section:
      - Supports Standard Applicant, Person and Organisation applicant types
      - Validates applicant fields per type and updates only the applicant-related part of the entry using a full PUT
      - Validation should be mostly handled via Angular form validation, with some custom validation logic for complex rules
    Error and UX handling:
      - Maps HTTP errors into GOV.UK-style error summary and hint state
      - Manages success banners and scroll/focus behaviour for validation and server errors
      - TODO: Eventually use generic components/services for banners & scroll/focus behavior
*/
import { CommonModule, Location } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map } from 'rxjs';

import {
  ApplicationsListEntryDetailState,
  initialApplicationsListEntryDetailState,
} from './util/applications-list-entry-detail.state';
import { focusSuccessBanner } from './util/banners.util';
import {
  APPLICANT_COLUMNS,
  CIVIL_FEE_COLUMNS,
  CODES_COLUMNS,
  FEE_STATUS_OPTIONS,
  PERSON_TITLE_OPTIONS,
  RESPONDENT_TYPE_OPTIONS,
} from './util/entry-detail.constants';
import { buildEntryUpdateDtoForFeeChange } from './util/entry-detail.form';
import { mapHttpErrorToSummary } from './util/errors.util';
import { buildResultApplicantContext } from './util/result-context.util';
import { getEntryId } from './util/routing.util';

import { AccordionComponent } from '@components/accordion/accordion.component';
import { ApplicantSectionComponent } from '@components/applicant-section/applicant-section.component';
import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import {
  ApplicantContext,
  EntryDetailNavState,
  PaymentRefReturn,
  readNavState,
} from '@components/applications-list-entry-detail/util/routing-state-util';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  CivilFeeForm,
  CivilFeeSectionComponent,
} from '@components/civil-fee-section/civil-fee-section.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import {
  ApplicationNotesForm,
  NotesSectionComponent,
} from '@components/notes-section/notes-section.component';
import { OfficialsSectionComponent } from '@components/officials-section/officials-section.component';
import { RespondentSectionComponent } from '@components/respondent-section/respondent-section.component';
import { ResultWordingSectionComponent } from '@components/result-wording-section/result-wording-section.component';
import { TableColumn } from '@components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { WordingSectionComponent } from '@components/wording-section/wording-section.component';
import { ENTRY_ERROR_MESSAGES } from '@constants/application-list-entry/error-messages';
import {
  APPLICANT_ORG_ERROR_HREFS,
  APPLICANT_PERSON_ERROR_HREFS,
  OFFICIALS_ERROR_HREFS,
  RESPONDENT_BULK_ERROR_HREFS,
  RESPONDENT_ORG_ERROR_HREFS,
  RESPONDENT_PERSON_ERROR_HREFS,
} from '@constants/application-list-entry/respondent/error-hrefs';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import { SuccessBanner } from '@core-types/banner/banner.types';
import {
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  FeeStatus,
  TemplateSubstitution,
  UpdateApplicationListEntryRequestParams,
} from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';
import {
  ApplicantType,
  ApplicationListEntryForms,
  ApplicationsListEntryForm,
  OrganisationForm,
  PersonForm,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';
import {
  AddFeeDetailsPayload,
  CivilFeeMeta,
} from '@shared-types/civil-fee/civil-fee';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultSectionSubmitPayload } from '@shared-types/result-wording-section/result-section.types';
import { CodeRow } from '@util/application-code-helpers';
import { buildRespondentErrors } from '@util/applications-list-entry-error-helpers';
import { collectChildSubmitErrors } from '@util/child-submit-validation';
import {
  updateFeeStatusesControl,
  updatePaymentReferenceInFeeStatusesControl,
} from '@util/civil-fee-utils';
import {
  focusErrorSummary,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getUniqueErrors } from '@util/error-items';
import { buildFormErrorSummary } from '@util/error-summary';
import { markFormGroupClean } from '@util/form-helpers';
import { respondentFormsHaveAnyValue } from '@util/respondent-helpers';
import { createSignalState } from '@util/signal-state-helpers';

type ChildErrorSource =
  | 'notes'
  | 'fee'
  | 'respondent'
  | 'applicant'
  | 'civilFee'
  | 'wording'
  | 'resultWording';

const UPDATE_ENTRY_ERROR_MESSAGES = ENTRY_ERROR_MESSAGES;

export const ERROR_HREFS = {
  standardApplicantCode: '#standard-applicant',
  lodgementDate: '#lodgement-date-day',
  ...(OFFICIALS_ERROR_HREFS as Record<string, string>),
  ...(RESPONDENT_PERSON_ERROR_HREFS as Record<string, string>),
} as const satisfies Record<string, string>;

@Component({
  selector: 'app-applications-list-entry-detail',
  standalone: true,
  providers: [ApplicationListEntryResultsFacade],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    AccordionComponent,
    ErrorSummaryComponent,
    SuccessBannerComponent,
    NotesSectionComponent,
    RespondentSectionComponent,
    ResultWordingSectionComponent,
    CivilFeeSectionComponent,
    ApplicationCodeSearchComponent,
    ApplicantSectionComponent,
    WordingSectionComponent,
    OfficialsSectionComponent,
  ],
  templateUrl: './applications-list-entry-detail.component.html',
})
export class ApplicationsListEntryDetail implements OnInit {
  @ViewChild('wordingSection')
  private readonly wordingSection?: WordingSectionComponent;
  @ViewChild('civilFeeSection')
  private readonly civilFeeSection?: CivilFeeSectionComponent;

  private readonly destroyRef = inject(DestroyRef);

  // APIs
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly entriesApi = inject(ApplicationListEntriesApi);
  private readonly formSvc = inject(ApplicationListEntryFormService);
  private readonly location = inject(Location);
  private readonly applicationCodesApi = inject(ApplicationCodesApi);

  //Utilising facade for entry results to keep component clean
  readonly resultsFacade = inject(ApplicationListEntryResultsFacade);

  private readonly appListEntryDetailSignalState =
    createSignalState<ApplicationsListEntryDetailState>(
      initialApplicationsListEntryDetailState,
    );

  private readonly appListEntryDetailState =
    this.appListEntryDetailSignalState.state;
  private readonly appListEntryDetailPatch =
    this.appListEntryDetailSignalState.patch;
  readonly vm = this.appListEntryDetailSignalState.vm;

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints

  forms!: ApplicationListEntryForms;
  form!: ApplicationsListEntryForm;

  personForm!: PersonForm;
  organisationForm!: OrganisationForm;

  selectedStandardApplicantCode: string | null = null;

  entryDetail: EntryGetDetailDto | null = null;

  // Codes table state
  codesRows: CodeRow[] = [];
  codesLoading = false;
  codesHasSearched = false;

  private parentErrors: ErrorItem[] = [];
  private childErrors: Record<ChildErrorSource, ErrorItem[]> = {
    notes: [],
    fee: [],
    respondent: [],
    applicant: [],
    wording: [],
    civilFee: [],
    resultWording: [],
  };

  wordingSubmitAttempt = signal(0);

  // View constants (from helpers)
  applicantColumns: TableColumn[] = APPLICANT_COLUMNS;
  codesColumns: TableColumn[] = CODES_COLUMNS;
  civilFeeColumns: TableColumn[] = CIVIL_FEE_COLUMNS;

  feeStatusOptions = FEE_STATUS_OPTIONS;
  respondentEntryTypeOptions = RESPONDENT_TYPE_OPTIONS;
  personTitleOptions = PERSON_TITLE_OPTIONS;

  // Result wording data
  resultApplicantContext: ApplicantContext[] = [];
  private navState: EntryDetailNavState | null = null;

  //Civil fee
  feeMeta: CivilFeeMeta | null = null;
  civilFeeForm!: CivilFeeForm;
  private persistedHasOffsiteFee = false;

  ngOnInit(): void {
    const state = readNavState(this.location, this.platformId);
    this.navState = state;
    this.createForms();

    const listId =
      this.route.snapshot.paramMap.get('id') ??
      state?.appListId ??
      this.route.snapshot.queryParamMap.get('appListId') ??
      '';

    const entryId =
      this.route.snapshot.paramMap.get('entryId') ??
      this.route.snapshot.queryParamMap.get('entryId') ??
      '';

    // If route is incomplete, go back to the application list page
    if (!listId || !entryId) {
      void this.router.navigate(['../'], { relativeTo: this.route });
      return;
    }

    this.appListEntryDetailPatch({ appListId: listId });

    //Civil fee feeStatus payment ref edit handling
    const pr = state?.paymentRefReturn ?? null;
    if (pr) {
      this.clearPaymentRefReturnOnly();
    }

    // Watch applicantType changes
    this.bindApplicantTypeChanges();

    this.loadEntryAndPatchForm(listId, entryId, pr, state);

    //Shows success banner if navigated from create page with ?listCreated=true
    this.handleListCreate();
  }

  private createForms(): void {
    // Build forms via helpers
    this.forms = this.formSvc.createForms();
    this.form = this.forms.form;

    this.personForm = this.forms.personForm;
    this.organisationForm = this.forms.organisationForm;

    this.civilFeeForm = this.formSvc.createCivilFeeForm(this.forms);
  }

  onWordingFieldsDTO(dto: { wordingFields: TemplateSubstitution[] }): void {
    this.forms.form.patchValue({
      wordingFields: dto.wordingFields,
    });
  }

  resetSuccessBanner(): void {
    this.appListEntryDetailPatch({ successBanner: null });
  }

  onAddFeeDetails(payload: AddFeeDetailsPayload): void {
    this.resetErrors();
    const previousFeeStatuses = [
      ...(this.form.controls.feeStatuses.value ?? []),
    ];

    const { next, changed } = updateFeeStatusesControl(
      this.form.controls.feeStatuses,
      payload,
    );
    if (!changed) {
      return;
    }

    const bannerText: SuccessBanner = ENTRY_SUCCESS_MESSAGES.feeStatusUpdated;
    this.persistFeeStatuses(previousFeeStatuses, next, bannerText);
  }

  // Used to update payment reference for current fee status from /change-payment-reference
  private applyPaymentRefReturn(updatedRowId: string, newRef: string): void {
    const previousFeeStatuses = [
      ...(this.form.controls.feeStatuses.value ?? []),
    ];

    const { next, changed } = updatePaymentReferenceInFeeStatusesControl(
      this.form.controls.feeStatuses,
      updatedRowId,
      newRef,
    );

    if (!changed) {
      return;
    }

    const bannerText: SuccessBanner = ENTRY_SUCCESS_MESSAGES.paymentRefUpdated;
    this.persistFeeStatuses(previousFeeStatuses, next, bannerText);
  }

  private clearPaymentRefReturnOnly(): void {
    const current = (history.state ?? {}) as Record<string, unknown>;
    const { paymentRefReturn, ...rest } = current;
    history.replaceState(rest, '');
  }

  private persistFeeStatuses(
    previousFeeStatuses: FeeStatus[],
    feeStatuses: FeeStatus[],
    bannerText: SuccessBanner,
  ): void {
    const entryId = getEntryId(this.route);
    if (!entryId || !this.entryDetail) {
      return;
    }

    const entryUpdateDto = buildEntryUpdateDtoForFeeChange(
      this.entryDetail,
      this.form.getRawValue(),
      'feeStatuses',
      feeStatuses,
    );

    const params: UpdateApplicationListEntryRequestParams = {
      listId: this.appListEntryDetailState().appListId,
      entryId,
      entryUpdateDto,
    };

    this.entriesApi
      .updateApplicationListEntry(params, 'body', false, {
        transferCache: false,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.mergeEntryDetailUpdate(entryUpdateDto, res);

          this.form.controls.feeStatuses.markAsPristine();

          this.appListEntryDetailPatch({
            successBanner: bannerText,
          });
          focusSuccessBanner(this.platformId);
        },
        error: (err) => {
          this.form.controls.feeStatuses.setValue(previousFeeStatuses, {
            emitEvent: false,
          });
          this.form.controls.feeStatuses.markAsPristine();

          this.applyMappedError(err);
        },
      });
  }

  // ── UI handlers ─────────────────────────────────────────────────────────────
  onCodeSelected(codeAndLodgementDate: { code: string; date: string }): void {
    this.resetSuccessBanner();
    this.resetErrors();

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

            this.form.patchValue({ applicationTitle: appCodeDetail.title });
            this.feeMeta = {
              feeReference: appCodeDetail.feeReference ?? null,
              feeAmount: appCodeDetail.feeAmount ?? null,
              offsiteFeeAmount: appCodeDetail.offsiteFeeAmount ?? null,
            };

            if (hasSelectionChanged) {
              this.formSvc.resetSectionsOnApplicationCodeChange(this.forms);

              this.wordingSubmitAttempt.set(0);
              this.entryDetail!.wording = undefined;
            }

            this.handleResultWordingContext(this.navState);

            this.appListEntryDetailPatch({
              isFeeRequired: appCodeDetail.isFeeDue,
              bulkApplicationsAllowed: appCodeDetail.bulkRespondentAllowed,
              appCodeDetail,
            });
          },
          error: (err) => {
            this.form.patchValue({ applicationTitle: '' });
            this.feeMeta = null;
            this.handleResultWordingContext(this.navState);
            this.applyMappedError(err);
          },
        });
    } else {
      this.form.patchValue({ applicationTitle: '' });
      this.feeMeta = null;
      this.handleResultWordingContext(this.navState);
      this.appListEntryDetailPatch({ appCodeDetail: null });
    }
  }

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, UPDATE_ENTRY_ERROR_MESSAGES, {
      nested: [{ path: 'applicationNotes', prefixId: 'applicationNotes' }],
      hrefs: ERROR_HREFS,
    });
  }

  get respondentErrorItems(): ErrorItem[] {
    return this.childErrors.respondent;
  }

  get applicantErrorItems(): ErrorItem[] {
    return this.childErrors.applicant;
  }

  private updateApplicantErrors(): void {
    if (this.applicantType === 'person') {
      this.personGroup.markAllAsTouched();
      this.personGroup.updateValueAndValidity({ emitEvent: false });

      this.childErrors.applicant = buildFormErrorSummary(
        this.personGroup,
        UPDATE_ENTRY_ERROR_MESSAGES,
        { hrefs: APPLICANT_PERSON_ERROR_HREFS },
      );
      return;
    }

    if (this.applicantType === 'org') {
      this.organisationGroup.markAllAsTouched();
      this.organisationGroup.updateValueAndValidity({ emitEvent: false });

      this.childErrors.applicant = buildFormErrorSummary(
        this.organisationGroup,
        UPDATE_ENTRY_ERROR_MESSAGES,
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
      this.appListEntryDetailState().appCodeDetail?.requiresRespondent ?? true;

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
        errorMessages: UPDATE_ENTRY_ERROR_MESSAGES,
        respondentPersonHrefs: RESPONDENT_PERSON_ERROR_HREFS,
        respondentOrganisationHrefs: RESPONDENT_ORG_ERROR_HREFS,
        respondentBulkControl: this.form.controls.numberOfRespondents,
        respondentBulkHrefs: RESPONDENT_BULK_ERROR_HREFS,
        bulkCountRequired: isRespondentRequired,
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
    const errorFound = summaryErrors.length > 0;

    this.appListEntryDetailPatch({
      summaryErrors,
      errorFound,
    });

    if (errorFound) {
      focusErrorSummary(this.platformId);
    }
  }

  onChildErrors(source: ChildErrorSource, errors: ErrorItem[]): void {
    this.childErrors[source] = errors ?? [];
    this.updateAllErrors();
  }

  private submitEntryUpdate(
    entryUpdateDto: EntryUpdateDto,
    successBanner: SuccessBanner,
  ): void {
    const entryId = getEntryId(this.route);
    if (!entryId || !this.entryDetail) {
      this.appListEntryDetailPatch({
        errorFound: true,
        summaryErrors: [
          { text: 'Entry is not loaded. Reload the page and try again.' },
        ],
      });
      focusErrorSummary(this.platformId);
      return;
    }

    const params: UpdateApplicationListEntryRequestParams = {
      listId: this.appListEntryDetailState().appListId,
      entryId,
      entryUpdateDto,
    };

    this.entriesApi
      .updateApplicationListEntry(params, 'body', false, {
        context: undefined,
        transferCache: false,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.appListEntryDetailPatch({
            formSubmitted: false,
            errorFound: false,
          });
          this.mergeEntryDetailUpdate(entryUpdateDto, res);
          this.appListEntryDetailPatch({ successBanner });

          if (this.applicantType === 'person') {
            markFormGroupClean(this.personGroup);
          } else if (this.applicantType === 'org') {
            markFormGroupClean(this.organisationGroup);
          } else {
            this.form.controls.standardApplicantCode.markAsPristine();
          }
        },
        error: (err) => {
          this.appListEntryDetailPatch({ formSubmitted: false });
          this.applyMappedError(err);
          focusErrorSummary(this.platformId);
        },
      });
  }

  private runFullSubmitValidation(): boolean {
    this.form.markAllAsTouched();
    this.form.controls.standardApplicantCode.updateValueAndValidity({
      emitEvent: false,
    });
    this.form.updateValueAndValidity({ emitEvent: false });

    const submitErrors = collectChildSubmitErrors<ChildErrorSource>([
      { source: 'wording', section: this.wordingSection },
      { source: 'civilFee', section: this.civilFeeSection },
    ]);

    this.childErrors.wording = submitErrors.wording ?? [];
    this.childErrors.civilFee = submitErrors.civilFee ?? [];

    this.updateAllErrors();
    return this.appListEntryDetailState().errorFound;
  }

  onUpdateApplicant(): void {
    this.resetErrors();
    this.resetSuccessBanner();
    this.appListEntryDetailPatch({ formSubmitted: true });

    if (this.runFullSubmitValidation()) {
      return;
    }

    this.submitEntryUpdate(
      this.buildEntryUpdateDto(),
      ENTRY_SUCCESS_MESSAGES.applicantUpdated,
    );
  }

  onUpdateApplication(): void {
    this.resetErrors();
    this.resetSuccessBanner();
    this.appListEntryDetailPatch({ formSubmitted: true });

    this.wordingSubmitAttempt.update((n) => n + 1);

    if (this.runFullSubmitValidation()) {
      return;
    }

    this.submitEntryUpdate(
      this.buildEntryUpdateDto(),
      ENTRY_SUCCESS_MESSAGES.listUpdated,
    );
  }

  onSaveOfficials(): void {
    this.resetErrors();
    this.resetSuccessBanner();
    this.appListEntryDetailPatch({ formSubmitted: true });

    if (this.runFullSubmitValidation()) {
      return;
    }

    this.submitEntryUpdate(
      this.buildEntryUpdateDto(),
      ENTRY_SUCCESS_MESSAGES.officialsUpdated as SuccessBanner,
    );
  }

  private buildEntryUpdateDto(): EntryUpdateDto {
    if (!this.entryDetail) {
      throw new Error('entryDetail is not loaded');
    }

    return this.formSvc.buildUpdateDto(
      this.entryDetail,
      this.forms,
      this.selectedStandardApplicantCode,
    );
  }

  onStandardApplicantCodeChanged(code: string | null): void {
    this.selectedStandardApplicantCode = code;
    this.formSvc.setStandardApplicantCode(this.forms, code, {
      emitEvent: false,
    });
  }

  onOffsiteFeeChanged(nextValue: boolean): void {
    const prev = this.persistedHasOffsiteFee;

    if (prev === nextValue) {
      return;
    }

    this.persistHasOffsiteFee(nextValue, prev);
  }

  private persistHasOffsiteFee(nextValue: boolean, prevValue: boolean): void {
    const entryId = getEntryId(this.route);

    if (!entryId || !this.entryDetail) {
      return;
    }

    const entryUpdateDto = buildEntryUpdateDtoForFeeChange(
      this.entryDetail,
      this.form.getRawValue(),
      'hasOffsiteFee',
      nextValue,
    );

    const params: UpdateApplicationListEntryRequestParams = {
      listId: this.appListEntryDetailState().appListId,
      entryId,
      entryUpdateDto,
    };

    this.entriesApi
      .updateApplicationListEntry(params, 'body', false, {
        transferCache: false,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.mergeEntryDetailUpdate(entryUpdateDto, res);
          this.persistedHasOffsiteFee = nextValue;
          this.form.controls.hasOffsiteFee.markAsPristine();

          this.appListEntryDetailPatch({
            successBanner: nextValue
              ? ENTRY_SUCCESS_MESSAGES.offSiteFeeApplied
              : ENTRY_SUCCESS_MESSAGES.offSiteFeeRemoved,
          });
          focusSuccessBanner(this.platformId);
        },
        error: (err) => {
          // rollback UI state
          this.form.controls.hasOffsiteFee.setValue(prevValue, {
            emitEvent: false,
          });
          this.form.controls.hasOffsiteFee.markAsPristine();

          this.applyMappedError(err);
        },
      });
  }

  // ——— Form accessors ———
  get personGroup(): PersonForm {
    return this.personForm;
  }

  get organisationGroup(): OrganisationForm {
    return this.organisationForm;
  }

  get applicantType(): ApplicantType {
    return this.form.controls.applicantType.value ?? 'person';
  }

  get isUpdateDisabled(): boolean {
    if (!this.entryDetail) {
      return true;
    }

    switch (this.applicantType) {
      case 'standard':
        return !this.selectedStandardApplicantCode;
      case 'person':
      case 'org':
        return false;
      default:
        return true;
    }
  }

  get applicationNotesForm(): ApplicationNotesForm {
    return this.form.controls.applicationNotes;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────
  private applyMappedError(err: unknown): void {
    const mapped = mapHttpErrorToSummary(err);
    this.appListEntryDetailPatch({
      errorHint: mapped.errorHint,
      summaryErrors: mapped.errorSummary,
      errorFound: mapped.errorSummary.length > 0,
    });
  }

  private loadCodesSectionFromEntry(entry: EntryGetDetailDto): void {
    const lodgementDate = entry.lodgementDate.slice(0, 10);
    const applicationCode = entry.applicationCode;

    this.form.patchValue({ lodgementDate, applicationCode });

    if (applicationCode && lodgementDate) {
      this.applicationCodesApi
        .getApplicationCodeByCodeAndDate(
          { code: applicationCode, date: lodgementDate },
          'body',
          false,
          { transferCache: true },
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (codeDto) => {
            this.form.patchValue({ applicationTitle: codeDto.title });
            this.handleResultWordingContext(this.navState);
            this.feeMeta = {
              feeReference: codeDto.feeReference ?? null,
              feeAmount: codeDto.feeAmount ?? null,
              offsiteFeeAmount: codeDto.offsiteFeeAmount ?? null,
            };

            this.appListEntryDetailPatch({
              appCodeDetail: codeDto,
              isFeeRequired: codeDto.isFeeDue,
              bulkApplicationsAllowed: codeDto.bulkRespondentAllowed,
              formReady: true,
            });
          },
          error: () => {
            this.form.patchValue({ applicationTitle: '' });
            this.handleResultWordingContext(this.navState);
            this.appListEntryDetailPatch({ formReady: true });
          },
        });
    }
  }

  private bindApplicantTypeChanges(): void {
    this.form.controls.applicantType.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((type): ApplicantType => type ?? 'person'),
      )
      .subscribe((t) => {
        this.appListEntryDetailPatch({ formSubmitted: false });

        this.resetErrors();

        // keep UI state in sync
        this.selectedStandardApplicantCode =
          t === 'standard' ? this.selectedStandardApplicantCode : null;

        // let the service reset the subforms + standard code
        this.formSvc.onApplicantTypeChanged(this.forms, t);
        this.formSvc.syncApplicantTypeState(this.forms, t);
      });
  }

  private resetErrors(): void {
    this.appListEntryDetailPatch({
      errorHint: 'There is a problem',
      summaryErrors: [],
      errorFound: false,
    });

    this.parentErrors = [];
    this.childErrors = {
      notes: [],
      fee: [],
      respondent: [],
      applicant: [],
      civilFee: [],
      wording: [],
      resultWording: [],
    };
  }

  // ——— Data loading & mapping ———
  //Also loads entry result
  private loadEntryAndPatchForm(
    listId: string,
    entryId: string,
    paymentRefReturn: PaymentRefReturn | null,
    state: EntryDetailNavState | null | undefined,
  ): void {
    this.entriesApi
      .getApplicationListEntry({ listId, entryId }, 'body', false, {
        context: undefined,
        transferCache: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entry) => {
          this.entryDetail = entry;
          this.persistedHasOffsiteFee = entry.hasOffsiteFee === true;

          const hydrate = this.formSvc.hydrateFromDto(entry, this.forms, {
            emitEvent: false,
          });

          this.selectedStandardApplicantCode =
            hydrate.selectedStandardApplicantCode;

          const type = this.form.controls.applicantType.value ?? 'person';
          this.formSvc.syncApplicantTypeState(this.forms, type);
          this.handleResultWordingContext(state);

          if (paymentRefReturn) {
            this.applyPaymentRefReturn(
              paymentRefReturn.updatedRowId,
              paymentRefReturn.newPaymentReference,
            );
          }

          this.resultsFacade.loadEntryResults(listId, entryId);
          this.loadCodesSectionFromEntry(entry);
        },
        error: (err) => this.handleFatalLoadError(err),
      });
  }

  private handleListCreate(): void {
    if (this.route.snapshot.queryParamMap.get('listCreated') === 'true') {
      this.appListEntryDetailPatch({
        successBanner: ENTRY_SUCCESS_MESSAGES.listCreated,
      });
      focusSuccessBanner(this.platformId);
    }
  }

  private getLegacyWordingFields(
    entry: EntryGetDetailDto | null | undefined,
  ): string[] | undefined {
    return (entry as (EntryGetDetailDto & { wordingFields?: string[] }) | null)
      ?.wordingFields;
  }

  private mergeEntryDetailUpdate(
    entryUpdateDto: EntryUpdateDto,
    res: Partial<EntryGetDetailDto> | null | undefined,
  ): void {
    if (!this.entryDetail) {
      return;
    }

    const base = {
      ...this.entryDetail,
      ...this.toEntryDetailPatch(entryUpdateDto),
    };
    const hasResponse =
      !!res && typeof res === 'object' && Object.keys(res).length > 0;

    this.entryDetail = hasResponse ? { ...base, ...res } : base;
  }

  private toEntryDetailPatch(
    entryUpdateDto: EntryUpdateDto,
  ): Partial<EntryGetDetailDto> & { wordingFields?: string[] } {
    const { wordingFields, ...rest } = entryUpdateDto;
    const patch: Partial<EntryGetDetailDto> & { wordingFields?: string[] } = {
      ...rest,
    };

    if (wordingFields) {
      patch.wordingFields = wordingFields.map((field) => field.value);
    } else {
      patch.wordingFields = this.getLegacyWordingFields(this.entryDetail);
    }

    return patch;
  }

  onSubmitResults(payload: ResultSectionSubmitPayload): void {
    const entryId = getEntryId(this.route);
    const listId = this.appListEntryDetailState().appListId;

    if (!entryId) {
      return;
    }

    this.resultsFacade.submitResultChanges(
      listId,
      entryId,
      payload,
      () => {
        this.appListEntryDetailPatch({
          successBanner: ENTRY_SUCCESS_MESSAGES.resultApplied,
        });
        focusSuccessBanner(this.platformId);
      },
      (err) => this.applyMappedError(err),
    );
  }

  onRemoveResult(resultId: string): void {
    const entryId = getEntryId(this.route);
    const listId = this.appListEntryDetailState().appListId;

    if (!entryId || !resultId) {
      return;
    }

    this.resultsFacade.removeResult(
      listId,
      entryId,
      resultId,
      () => {
        this.appListEntryDetailPatch({
          successBanner: ENTRY_SUCCESS_MESSAGES.resultRemoved,
        });
        focusSuccessBanner(this.platformId);
      },
      (err) => this.applyMappedError(err),
    );
  }

  onPendingChange(rows: PendingResultRow[]): void {
    this.resultsFacade.setPending(rows);
  }

  private handleFatalLoadError(err: unknown): void {
    const { errorHint, errorSummary } = mapHttpErrorToSummary(err);

    this.appListEntryDetailPatch({
      errorHint,
      summaryErrors: errorSummary,
      errorFound: true,
    });

    focusErrorSummary(this.platformId);
  }

  private handleResultWordingContext(
    state: EntryDetailNavState | null | undefined,
  ): void {
    const currentTitle =
      this.form.controls.applicationTitle?.value?.trim() ||
      this.appListEntryDetailState().appCodeDetail?.title ||
      state?.resultApplicantContext?.title ||
      '';

    if (!this.entryDetail) {
      this.resultApplicantContext = state?.resultApplicantContext
        ? [
            {
              ...state.resultApplicantContext,
              title: currentTitle,
            },
          ]
        : [];
      return;
    }

    const apiContext = buildResultApplicantContext(
      this.entryDetail,
      currentTitle,
    );

    this.resultApplicantContext = [
      state?.resultApplicantContext
        ? {
            applicant:
              this.entryDetail.standardApplicantCode?.trim() &&
              state.resultApplicantContext.applicant
                ? state.resultApplicantContext.applicant
                : apiContext.applicant,
            respondent:
              apiContext.respondent || state.resultApplicantContext.respondent,
            title: currentTitle,
          }
        : apiContext,
    ];
  }
}
