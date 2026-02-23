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
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map } from 'rxjs';

import { focusSuccessBanner } from './util/banners.util';
import {
  APPLICANT_COLUMNS,
  APPLICANT_TYPE_OPTIONS,
  CIVIL_FEE_COLUMNS,
  CODES_COLUMNS,
  FEE_STATUS_OPTIONS,
  PERSON_TITLE_OPTIONS,
  RESPONDENT_TYPE_OPTIONS,
} from './util/entry-detail.constants';
import { buildEntryUpdateDtoWithChange } from './util/entry-detail.form';
import { mapHttpErrorToSummary } from './util/errors.util';
import { getEntryId } from './util/routing.util';

import { AccordionComponent } from '@components/accordion/accordion.component';
import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import {
  ApplicantContext,
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
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '@components/person-section/person-section.component';
import { RespondentSectionComponent } from '@components/respondent-section/respondent-section.component';
import { ResultWordingSectionComponent } from '@components/result-wording-section/result-wording-section.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TableColumn } from '@components/selectable-sortable-table/selectable-sortable-table.component';
import { StandardApplicantSelectComponent } from '@components/standard-applicant-select/standard-applicant-select.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { ENTRY_ERROR_MESSAGES } from '@constants/application-list-entry/error-messages';
import {
  APPLICANT_ORG_ERROR_HREFS,
  APPLICANT_PERSON_ERROR_HREFS,
  RESPONDENT_ORG_ERROR_HREFS,
  RESPONDENT_PERSON_ERROR_HREFS,
} from '@constants/application-list-entry/respondent/error-hrefs';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import { SuccessBanner } from '@core-types/banner/banner.types';
import {
  ApplicationCodeGetDetailDto,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  FeeStatus,
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
import { CodeRow } from '@util/application-code-helpers';
import { buildRespondentErrors } from '@util/applications-list-entry-error-helpers';
import {
  addOrReplaceFeeStatus,
  applyPaymentReferenceUpdateToFeeStatuses,
  toFeeStatus,
} from '@util/civil-fee-utils';
import {
  focusErrorSummary,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getUniqueErrors } from '@util/error-items';
import { buildFormErrorSummary } from '@util/error-summary';
import { markFormGroupClean } from '@util/form-helpers';

type ChildErrorSource =
  | 'notes'
  | 'fee'
  | 'respondent'
  | 'applicant'
  | 'civilFee';

const UPDATE_ENTRY_ERROR_MESSAGES = ENTRY_ERROR_MESSAGES;

export const ERROR_HREFS = {
  standardApplicantCode: '#standard-applicant',
  ...RESPONDENT_PERSON_ERROR_HREFS,
} as const;

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
    SelectInputComponent,
    PersonSectionComponent,
    OrganisationSectionComponent,
    TextInputComponent,
    ErrorSummaryComponent,
    SuccessBannerComponent,
    StandardApplicantSelectComponent,
    NotesSectionComponent,
    RespondentSectionComponent,
    ResultWordingSectionComponent,
    CivilFeeSectionComponent,
    ApplicationCodeSearchComponent,
  ],
  templateUrl: './applications-list-entry-detail.component.html',
})
export class ApplicationsListEntryDetail implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  // APIs
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly entriesApi = inject(ApplicationListEntriesApi);
  private readonly codesApi = inject(ApplicationCodesApi);
  private readonly formSvc = inject(ApplicationListEntryFormService);
  private readonly location = inject(Location);
  private readonly applicationCodesApi = inject(ApplicationCodesApi);

  //Utilising facade for entry results to keep component clean
  readonly resultsFacade = inject(ApplicationListEntryResultsFacade);

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints

  appListId!: string;
  appCodeDetail!: ApplicationCodeGetDetailDto;

  forms!: ApplicationListEntryForms;

  formReady = false;
  form!: ApplicationsListEntryForm;
  personForm!: PersonForm;
  organisationForm!: OrganisationForm;

  formSubmitted = false;
  selectedStandardApplicantCode: string | null = null;

  private entryDetail: EntryGetDetailDto | null = null;

  // Codes table state
  codesRows: CodeRow[] = [];
  codesLoading = false;
  codesHasSearched = false;

  // Success banner
  successBanner: SuccessBanner | null = null;

  // Error summary state
  errorHint: string | null = 'There is a problem';
  errorFound = false;
  summaryErrors: ErrorItem[] = [];

  private parentErrors: ErrorItem[] = [];
  private childErrors: Record<ChildErrorSource, ErrorItem[]> = {
    notes: [],
    fee: [],
    respondent: [],
    applicant: [],
    civilFee: [],
  };

  // View constants (from helpers)
  applicantColumns: TableColumn[] = APPLICANT_COLUMNS;
  codesColumns: TableColumn[] = CODES_COLUMNS;
  civilFeeColumns: TableColumn[] = CIVIL_FEE_COLUMNS;

  feeStatusOptions = FEE_STATUS_OPTIONS;
  applicantEntryTypeOptions = APPLICANT_TYPE_OPTIONS;
  respondentEntryTypeOptions = RESPONDENT_TYPE_OPTIONS;
  personTitleOptions = PERSON_TITLE_OPTIONS;

  // Result wording data
  resultApplicantContext: ApplicantContext[] = [];

  //Civil fee
  feeMeta: CivilFeeMeta | null = null;
  civilFeeForm!: CivilFeeForm;
  private persistedHasOffsiteFee = false;

  ngOnInit(): void {
    const state = readNavState(this.location, this.platformId);
    this.createForms();

    const listId =
      this.route.snapshot.paramMap.get('listId') ??
      state?.appListId ??
      this.route.snapshot.queryParamMap.get('appListId') ??
      '';

    const entryId =
      this.route.snapshot.paramMap.get('entryId') ??
      this.route.snapshot.paramMap.get('id') ??
      this.route.snapshot.queryParamMap.get('entryId') ??
      '';

    // If route is incomplete, go back to the application list page
    if (!listId || !entryId) {
      void this.router.navigate(['../'], { relativeTo: this.route });
      return;
    }

    this.appListId = listId;

    if (state?.resultApplicantContext) {
      this.resultApplicantContext = [state.resultApplicantContext];
    }

    //Civil fee feeStatus payment ref edit handling
    const pr = state?.paymentRefReturn ?? null;
    if (pr) {
      this.clearPaymentRefReturnOnly();
    }

    // Watch applicantType changes
    this.bindApplicantTypeChanges();

    this.loadEntryAndPatchForm(listId, entryId, pr);
  }

  private createForms(): void {
    // Build forms via helpers
    this.forms = this.formSvc.createForms();
    this.form = this.forms.form;

    this.personForm = this.forms.personForm;
    this.organisationForm = this.forms.organisationForm;

    this.civilFeeForm = this.formSvc.createCivilFeeForm(this.forms);
  }

  resetSuccessBanner(): void {
    this.successBanner = null;
  }

  onAddFeeDetails(payload: AddFeeDetailsPayload): void {
    this.resetErrors();

    const current = this.form.controls.feeStatuses.value ?? [];
    const nextItem = toFeeStatus(payload);

    const { next, changed } = addOrReplaceFeeStatus(current, nextItem);
    if (!changed) {
      return;
    }

    this.form.controls.feeStatuses.setValue(next);
    this.form.controls.feeStatuses.markAsDirty();

    const bannerText: SuccessBanner = ENTRY_SUCCESS_MESSAGES.feeStatusUpdated;

    this.persistFeeStatuses(next, bannerText);
  }

  // Used to update payment reference for current fee status from /change-payment-reference
  private applyPaymentRefReturn(updatedRowId: string, newRef: string): void {
    const current = this.form.controls.feeStatuses.value ?? [];
    const { next, changed } = applyPaymentReferenceUpdateToFeeStatuses(
      current,
      updatedRowId,
      newRef.trim(),
    );

    if (!changed) {
      return;
    }

    this.form.controls.feeStatuses.setValue(next);
    this.form.controls.feeStatuses.markAsDirty();

    const bannerText: SuccessBanner = ENTRY_SUCCESS_MESSAGES.paymentRefUpdated;

    this.persistFeeStatuses(next, bannerText);
  }

  private clearPaymentRefReturnOnly(): void {
    const current = (history.state ?? {}) as Record<string, unknown>;
    const { paymentRefReturn, ...rest } = current;
    history.replaceState(rest, '');
  }

  private persistFeeStatuses(
    feeStatuses: FeeStatus[],
    bannerText: SuccessBanner,
  ): void {
    const entryId = getEntryId(this.route);
    if (!this.appListId || !entryId || !this.entryDetail) {
      return;
    }

    const entryUpdateDto = buildEntryUpdateDtoWithChange(
      this.entryDetail,
      'feeStatuses',
      feeStatuses,
    );

    const params: UpdateApplicationListEntryRequestParams = {
      listId: this.appListId,
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

          this.successBanner = bannerText;
          focusSuccessBanner(this.platformId);
        },
        error: (err) => {
          this.applyMappedError(err);
        },
      });
  }

  // ── UI handlers ─────────────────────────────────────────────────────────────
  onCodeSelected(codeAndLodgementDate: { code: string; date: string }): void {
    this.resetSuccessBanner();
    this.resetErrors();

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
              this.formSvc.resetSectionsOnApplicationCodeChange(this.forms);
            }
          },
          error: (err) => {
            this.applyMappedError(err);
          },
        });
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
    this.childErrors.respondent = buildRespondentErrors({
      respondentEntryType: this.form.controls.respondentEntryType.value,
      respondentPersonForm: this.forms.respondentPersonForm,
      respondentOrganisationForm: this.forms.respondentOrganisationForm,
      errorMessages: UPDATE_ENTRY_ERROR_MESSAGES,
      respondentPersonHrefs: RESPONDENT_PERSON_ERROR_HREFS,
      respondentOrganisationHrefs: RESPONDENT_ORG_ERROR_HREFS,
    });
  }

  private updateAllErrors(): void {
    this.updateApplicantErrors();
    this.updateRespondentErrors();

    this.parentErrors = this.buildErrorSummary();
    const allChildErrors = Object.values(this.childErrors).flat();

    this.summaryErrors = [
      ...getUniqueErrors(this.parentErrors, allChildErrors),
    ];
    this.errorFound = this.summaryErrors.length > 0;

    if (this.errorFound) {
      focusErrorSummary(this.platformId);
    }
  }

  onChildErrors(source: ChildErrorSource, errors: ErrorItem[]): void {
    this.childErrors[source] = errors ?? [];
    this.updateAllErrors();
  }

  onUpdateApplicant(): void {
    this.resetErrors();
    this.resetSuccessBanner();
    this.formSubmitted = true;

    // Run Angular validation
    this.form.markAllAsTouched();
    this.form.controls.standardApplicantCode.updateValueAndValidity({
      emitEvent: false,
    });
    this.form.updateValueAndValidity({ emitEvent: false });

    // Build error summary from control + child errors
    this.updateAllErrors();

    if (this.errorFound) {
      return;
    }

    // Ensure we have listId, entryId and a loaded server snapshot
    const entryId = getEntryId(this.route);
    if (!this.appListId || !entryId || !this.entryDetail) {
      this.errorFound = true;
      this.summaryErrors = [
        {
          text: 'Entry is not loaded. Reload the page and try again.',
        },
      ];
      focusErrorSummary(this.platformId);
      return;
    }

    const entryUpdateDto = this.buildEntryUpdateDto();

    const params: UpdateApplicationListEntryRequestParams = {
      listId: this.appListId,
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
          this.formSubmitted = false;
          this.errorFound = false;
          this.mergeEntryDetailUpdate(entryUpdateDto, res);

          this.successBanner = ENTRY_SUCCESS_MESSAGES.applicantUpdated;

          if (this.applicantType === 'person') {
            markFormGroupClean(this.personGroup);
          } else if (this.applicantType === 'org') {
            markFormGroupClean(this.organisationGroup);
          }
        },
        error: (err) => {
          this.formSubmitted = false;
          this.applyMappedError(err);
          focusErrorSummary(this.platformId);
        },
      });
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

    if (!this.appListId || !entryId || !this.entryDetail) {
      return;
    }

    const entryUpdateDto = buildEntryUpdateDtoWithChange(
      this.entryDetail,
      'hasOffsiteFee',
      nextValue,
    );

    const params: UpdateApplicationListEntryRequestParams = {
      listId: this.appListId,
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

          this.successBanner = nextValue
            ? ENTRY_SUCCESS_MESSAGES.offSiteFeeApplied
            : ENTRY_SUCCESS_MESSAGES.offSiteFeeRemoved;
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
    this.errorHint = mapped.errorHint;
    this.summaryErrors = mapped.errorSummary;
    this.errorFound = mapped.errorSummary.length > 0;
  }

  private loadCodesSectionFromEntry(entry: EntryGetDetailDto): void {
    const lodgementDate = entry.lodgementDate.slice(0, 10);
    const applicationCode = entry.applicationCode;

    this.form.patchValue({ lodgementDate, applicationCode });

    if (applicationCode && lodgementDate) {
      this.codesApi
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
            this.feeMeta = {
              feeReference: codeDto.feeReference ?? null,
              feeAmount: codeDto.feeAmount ?? null,
              offsiteFeeAmount: codeDto.offsiteFeeAmount ?? null,
            };
            this.formReady = true;
          },
          error: () => {
            this.form.patchValue({ applicationTitle: '' });
            this.formReady = true;
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
        this.formSubmitted = false;
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
    this.errorHint = 'There is a problem';
    this.summaryErrors = [];
    this.errorFound = false;

    this.parentErrors = [];
    this.childErrors = {
      notes: [],
      fee: [],
      respondent: [],
      applicant: [],
      civilFee: [],
    };
  }

  // ——— Data loading & mapping ———
  //Also loads entry result
  private loadEntryAndPatchForm(
    listId: string,
    entryId: string,
    paymentRefReturn: PaymentRefReturn | null,
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
  ): Partial<EntryGetDetailDto> {
    const { wordingFields, ...rest } = entryUpdateDto;
    const patch: Partial<EntryGetDetailDto> = { ...rest };

    if (wordingFields) {
      patch.wordingFields = wordingFields.map((field) => field.value);
    }

    return patch;
  }

  onApplyResultPending(row: PendingResultRow): void {
    const entryId = getEntryId(this.route);
    const listId = this.appListId;

    if (!listId || !entryId) {
      return;
    }

    this.resultsFacade.applyPendingResult(
      listId,
      entryId,
      row,
      () => {
        this.successBanner = ENTRY_SUCCESS_MESSAGES.resultApplied;
        focusSuccessBanner(this.platformId);
      },
      (err) => this.applyMappedError(err),
    );
  }

  onRemoveResult(resultId: string): void {
    const entryId = getEntryId(this.route);
    const listId = this.appListId;

    if (!listId || !entryId || !resultId) {
      return;
    }

    this.resultsFacade.removeResult(
      listId,
      entryId,
      resultId,
      () => {
        this.successBanner = ENTRY_SUCCESS_MESSAGES.resultRemoved;
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

    this.errorHint = errorHint;
    this.summaryErrors = errorSummary;
    this.errorFound = true;

    focusErrorSummary(this.platformId);
  }
}
