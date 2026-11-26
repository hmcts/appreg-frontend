import { Location, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  afterEveryRender,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, distinctUntilChanged, map } from 'rxjs';

import { EntryDetailFeeSaveFacade } from './facades/entry-detail-fee-save.facade';
import { EntryDetailLoadFacade } from './facades/entry-detail-load.facade';
import { EntryDetailSaveFacade } from './facades/entry-detail-save.facade';
import {
  ApplicationsListEntryDetailState,
  initialApplicationsListEntryDetailState,
} from './util/applications-list-entry-detail.state';
import { focusLocalBanner, focusSuccessBanner } from './util/banners.util';
import { codeFeeMeta } from './util/entry-load-fee-meta';
import { mapHttpErrorToSummary } from './util/errors.util';
import { buildResultApplicantContext } from './util/result-context.util';
import { getEntryId } from './util/routing.util';

import { AccordionComponent } from '@components/accordion/accordion.component';
import { AlertComponent } from '@components/alert/alert.component';
import { ApplicantSectionComponent } from '@components/applicant-section/applicant-section.component';
import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import {
  ApplicantContext,
  EntryDetailNavState,
  EntryDetailSnapshot,
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
import { ApplicationWordingHelpComponent } from '@components/help-details/application-wording-help.component';
import { CivilFeeHelpComponent } from '@components/help-details/civil-fee-help.component';
import { NavigationWarningComponent } from '@components/navigation-warning/navigation-warning.component';
import {
  ApplicationNotesForm,
  NotesSectionComponent,
} from '@components/notes-section/notes-section.component';
import { OfficialsSectionComponent } from '@components/officials-section/officials-section.component';
import { RespondentSectionComponent } from '@components/respondent-section/respondent-section.component';
import { ResultWordingSectionComponent } from '@components/result-wording-section/result-wording-section.component';
import { TableColumn } from '@components/sortable-table/sortable-table.component';
import { SelectedStandardApplicantSummary } from '@components/standard-applicant-select/standard-applicant-select.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { WordingSectionComponent } from '@components/wording-section/wording-section.component';
import {
  APPLICANT_COLUMNS,
  CIVIL_FEE_COLUMNS,
  CODES_COLUMNS,
  FEE_STATUS_OPTIONS,
  PERSON_TITLE_OPTIONS,
  RESPONDENT_TYPE_OPTIONS,
} from '@constants/application-list-entry/columns-options';
import {
  APPLICANT_ENTRY_ERROR_MESSAGES,
  CIVIL_FEE_FIELD_MESSAGES,
  ChildErrorSourceALEDetail,
  ENTRY_ERROR_MESSAGES,
  RESPONDENT_ENTRY_ERROR_MESSAGES,
} from '@constants/application-list-entry/error-messages';
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
  Applicant,
  ApplicationCodesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  FeeStatus,
  PaymentStatus,
  StandardApplicantGetDetailDto,
  TemplateDetail,
  TemplateSubstitution,
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
import { getApplicationListEntryErrorSections } from '@util/application-list-entry-section-errors';
import { buildRespondentErrors } from '@util/applications-list-entry-error-helpers';
import { collectChildSubmitErrors } from '@util/child-submit-validation';
import {
  updateFeeStatusesControl,
  updatePaymentReferenceInFeeStatusesControl,
} from '@util/civil-fee-utils';
import { hasStringProp, isRecord } from '@util/data-utils';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { getUniqueErrors } from '@util/error-items';
import { buildFormErrorSummary } from '@util/error-summary';
import { markFormGroupClean } from '@util/form-helpers';
import { getProblemText } from '@util/http-error-to-text';
import { respondentFormsHaveAnyValue } from '@util/respondent-helpers';
import { createSignalState } from '@util/signal-state-helpers';
import { returnOrgName } from '@util/string-helpers';
import { captureCompositeErrors } from '@util/submitted-field-errors';
import {
  createWordingObjectValuesResolver,
  withWordingFieldValues,
} from '@util/template-substitution-utils';

type ConfirmationSection = 'applicant' | 'officials' | 'fees' | 'results';

type ChildErrorSource = ChildErrorSourceALEDetail;

const UPDATE_ENTRY_ERROR_MESSAGES = ENTRY_ERROR_MESSAGES;
const LINKED_CODE_LOAD_ERROR: ErrorItem = {
  text: 'Application code details could not be loaded. You cannot save this application until the details are available.',
};

export const ERROR_HREFS = {
  resultWording: '#result-code',
  standardApplicantCode: '#standard-applicant',
  lodgementDate: '#lodgement-date-day',
  ...(OFFICIALS_ERROR_HREFS as Record<string, string>),
  ...(RESPONDENT_PERSON_ERROR_HREFS as Record<string, string>),
} as const satisfies Record<string, string>;

/**
  Main component for /applications-list/:listId/entries/:entryId
  Functionality:
    On load:
      - Reads list and entry IDs from the route and navigation state
      - Loads the entry, saved code by ID, and saved standard applicant through the load facade
      - Hydrates the form, restores a navigation draft, and loads entry results
    Application code section:
      - Searches application codes and maps results into the sortable table
      - Updates the selected code and its metadata; full saves persist entry changes
    Applicant section:
      - Supports Standard Applicant, Person and Organisation applicant types
      - Validates applicant fields and uses the form service to build full entry updates
    Fee section:
      - Persists fee statuses and offsite fee changes through partial saves
    Error and UX handling:
      - Maps validation and server errors into the error summary and hint state
      - Manages success banners, focus, accordion state, and navigation draft warnings
*/
@Component({
  selector: 'app-applications-list-entry-detail',
  standalone: true,
  providers: [
    ApplicationListEntryResultsFacade,
    EntryDetailLoadFacade,
    EntryDetailFeeSaveFacade,
    EntryDetailSaveFacade,
  ],
  imports: [
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    NavigationWarningComponent,
    AccordionComponent,
    AlertComponent,
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
    ApplicationWordingHelpComponent,
    CivilFeeHelpComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './applications-list-entry-detail.component.html',
})
export class ApplicationsListEntryDetail implements OnInit {
  @ViewChild('wordingSection')
  private readonly wordingSection?: WordingSectionComponent;
  @ViewChild(ApplicationCodeSearchComponent)
  private readonly applicationCodeSearch?: ApplicationCodeSearchComponent;
  @ViewChild('civilFeeSection')
  private readonly civilFeeSection?: CivilFeeSectionComponent;
  @ViewChild(ResultWordingSectionComponent)
  private readonly resultWordingSection?: ResultWordingSectionComponent;
  @ViewChild('entryAccordion')
  private readonly entryAccordion?: AccordionComponent;

  private readonly destroyRef = inject(DestroyRef);
  private readonly resolveWordingObjectValues =
    createWordingObjectValuesResolver();

  // APIs
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly formSvc = inject(ApplicationListEntryFormService);
  private readonly location = inject(Location);
  private readonly applicationCodesApi = inject(ApplicationCodesApi);
  private readonly loadFacade = inject(EntryDetailLoadFacade);
  private readonly feeSaveFacade = inject(EntryDetailFeeSaveFacade);
  private readonly saveFacade = inject(EntryDetailSaveFacade);

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
  private savedContent?: ReturnType<
    ApplicationListEntryFormService['editableContent']
  >;

  readonly hasUnchangedContent = signal(true);
  @ViewChild(NavigationWarningComponent)
  private readonly navigationWarning?: NavigationWarningComponent;

  form!: ApplicationsListEntryForm;

  personForm!: PersonForm;
  organisationForm!: OrganisationForm;

  selectedStandardApplicantCode: string | null = null;
  savedStandardApplicantCode: string | null = null;
  savedStandardApplicantName: string | null = null;
  savedStandardApplicantDetailsUnavailable = false;
  private pendingStandardApplicantSummary: SelectedStandardApplicantSummary | null =
    null;
  savedStandardApplicantId: number | null | undefined = null;

  entryDetail: EntryGetDetailDto | null = null;

  // Codes table state
  codesRows: CodeRow[] = [];
  codesLoading = false;
  codesHasSearched = false;

  private parentErrors: ErrorItem[] = [];
  private suppressCivilFeeSummary = false;
  private childErrors: Record<ChildErrorSource, ErrorItem[]> = {
    codes: [],
    fee: [],
    respondent: [],
    applicant: [],
    wording: [],
    civilFee: [],
    resultWording: [],
  };

  wordingSubmitAttempt = signal(0);
  wordingAppliedBannerVisible = signal(false);
  readonly submitAttempt = signal(0);
  readonly sectionConfirmation = signal<{
    section: ConfirmationSection;
    message: SuccessBanner;
  } | null>(null);
  readonly sectionSaveStatus = signal('');
  private sectionSaveTrigger: HTMLElement | null = null;
  readonly savedApplicationCodeLoaded = signal(false);
  readonly newerApplicationCodeVersionExists = signal(false);

  resultAppliedBannerVisible = signal(false);

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
  readonly breadcrumbs = signal([
    { label: 'Applications list', link: '/applications-list' },
    {
      label: 'Applications list details',
      link: '/applications-list/',
    },
  ]);
  readonly cancelLink = signal<string[]>(['/applications-list']);

  //Civil fee
  feeMeta: CivilFeeMeta | null = null;
  civilFeeForm!: CivilFeeForm;
  private persistedHasOffsiteFee = false;

  openWordingSection = signal(false);
  openCivilFeeSection = signal(false);
  openRespondentSection = signal(false);
  openApplicantSection = signal(true);
  openApplicationCodeSection = signal(false);
  openNotesSection = signal(false);
  openResultSection = signal(false);
  openOfficialSection = signal(false);

  disableOfficialButton = signal(false);
  disableSaveCompleteAppBtn = signal(false);

  // Lifecycle and setup
  constructor() {
    // Child sections initialise their controls during rendering; compare afterwards.
    afterEveryRender(() => {
      this.hasUnchangedContent.set(this.contentIsUnchanged());
    });
  }

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
    this.setupNavigationLinks(listId, state?.fromApplicationsPage ?? false);

    //Civil fee feeStatus payment ref edit handling
    const pr = state?.paymentRefReturn ?? null;
    if (pr) {
      this.clearPaymentRefNavigationStateOnly();
    }

    // Watch applicantType changes
    this.bindApplicantTypeChanges();
    this.form.controls.respondentEntryType.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.respondentValidationSubmitted.set(false);
        this.childErrors.respondent = [];
        this.updateAllErrors({ focusSummary: false });
      });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

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

  private setupNavigationLinks(
    listId: string,
    fromApplicationsPage: boolean,
  ): void {
    if (fromApplicationsPage) {
      this.breadcrumbs.set([{ label: 'Applications', link: '/applications' }]);
      this.cancelLink.set(['/applications']);
      return;
    }

    this.breadcrumbs.set([
      { label: 'Applications list', link: '/applications-list' },
      {
        label: 'Applications list details',
        link: `/applications-list/${listId}`,
      },
    ]);
    this.cancelLink.set(['/applications-list', listId]);
  }

  private handleListCreate(): void {
    if (this.route.snapshot.queryParamMap.get('listCreated') === 'true') {
      this.appListEntryDetailPatch({
        successBanner: ENTRY_SUCCESS_MESSAGES.listCreated,
      });
      focusSuccessBanner(this.platformId);
    }
  }

  /**
   * Entry and application code loading
   */

  /**
   * Loads the entry, results, and linked application code. Restores a navigation
   * snapshot before applying a returned payment-reference change.
   */
  private loadEntryAndPatchForm(
    listId: string,
    entryId: string,
    paymentRefReturn: PaymentRefReturn | null,
    state: EntryDetailNavState | null | undefined,
  ): void {
    this.loadFacade
      .loadEntry(listId, entryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ entry }) => {
          this.entryDetail = entry;
          this.persistedHasOffsiteFee = entry.hasOffsiteFee === true;

          const hydrate = this.formSvc.hydrateFromDto(entry, this.forms, {
            emitEvent: false,
          });

          this.selectedStandardApplicantCode =
            hydrate.selectedStandardApplicantCode;
          this.savedStandardApplicantCode =
            hydrate.selectedStandardApplicantCode;
          this.savedStandardApplicantName = null;
          this.savedStandardApplicantDetailsUnavailable = false;
          this.pendingStandardApplicantSummary = null;
          this.savedStandardApplicantId =
            entry.standardApplicantId ?? undefined;
          this.loadSavedStandardApplicantName(this.savedStandardApplicantId);

          const type = this.form.controls.applicantType.value ?? 'person';
          this.formSvc.syncApplicantTypeState(this.forms, type);
          this.savedContent = this.formSvc.editableContent(this.forms);
          this.applyEntryDetailSnapshot(state?.entryDetailSnapshot);
          this.handleResultWordingContext(state);

          this.resultsFacade.loadEntryResults(listId, entryId);

          this.loadCodesSectionFromEntry(entry, () => {
            const snapshot = state?.entryDetailSnapshot;
            // Preserve a deliberately staged replacement when returning from payment editing.
            // For the saved code, use the freshly fetched exact record's metadata.
            if (
              isRecord(snapshot?.form) &&
              hasStringProp(snapshot.form, 'applicationCode') &&
              snapshot.form.applicationCode &&
              (snapshot.form.applicationCode !== entry.applicationCode ||
                (typeof snapshot.appCodeDetail?.applicationCodeId ===
                  'number' &&
                  snapshot.appCodeDetail.applicationCodeId !==
                    entry.applicationCodeId))
            ) {
              this.applyEntryDetailSnapshot(snapshot);
            }
            if (paymentRefReturn) {
              this.applyPaymentRefReturn(
                paymentRefReturn.updatedRowId,
                paymentRefReturn.newPaymentReference,
              );
            }
          });
        },
        error: (err) => this.handleFatalLoadError(err),
      });
  }

  /**
   * Loads the saved code and fee metadata before enabling the form. A failed
   * lookup shows an error that blocks saving.
   */
  private loadCodesSectionFromEntry(
    entry: EntryGetDetailDto,
    onLoaded?: () => void,
  ): void {
    const lodgementDate = entry.lodgementDate.slice(0, 10);
    const applicationCode = entry.applicationCode;

    this.form.patchValue({ lodgementDate, applicationCode });

    this.savedApplicationCodeLoaded.set(false);
    this.feeMeta = null;
    this.form.patchValue({ applicationTitle: '' });
    this.appListEntryDetailPatch({
      appCodeDetail: null,
      formReady: false,
      isFeeRequired: false,
      bulkApplicationsAllowed: false,
    });
    this.loadFacade
      .loadLinkedCode(entry)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result.kind === 'linkedCodeUnavailable') {
          this.form.patchValue({ applicationTitle: '' });
          this.handleResultWordingContext(this.navState);
          this.appListEntryDetailPatch({ formReady: true });
          this.showApplicationCodeLoadError();
          return;
        }

        const { code, feeMeta } = result;
        this.form.patchValue({ applicationTitle: code.title });
        this.handleResultWordingContext(this.navState);
        this.feeMeta = feeMeta;
        this.savedApplicationCodeLoaded.set(true);
        this.appListEntryDetailPatch({
          appCodeDetail: code,
          isFeeRequired: code.isFeeDue,
          bulkApplicationsAllowed: code.bulkRespondentAllowed,
          formReady: true,
        });
        onLoaded?.();
      });
  }

  /** Refreshes code details and dependent form state after a code selection. */
  onCodeSelected(codeAndLodgementDate: {
    code: string;
    date: string;
    applicationCodeId?: number;
  }): void {
    this.resetSuccessBanner();
    this.resetErrors();
    this.newerApplicationCodeVersionExists.set(false);

    const prevSelection = {
      code: this.form.controls.applicationCode.value,
      date: this.form.controls.lodgementDate.value,
      applicationCodeId: this.form.controls.applicationCodeId?.value,
    };

    const lodgementDate =
      codeAndLodgementDate.date || this.form.controls.lodgementDate.value || '';

    this.form.patchValue({
      applicationCode: codeAndLodgementDate.code,
      applicationCodeId: null,
      lodgementDate,
    });
    this.appListEntryDetailPatch({ appCodeDetail: null });
    this.feeMeta = null;
    // Call API to retrieve data associated with the App code
    if (this.form.value.applicationCode && this.form.value.lodgementDate) {
      const detail$ =
        typeof codeAndLodgementDate.applicationCodeId === 'number'
          ? this.applicationCodesApi.getApplicationCodeById(
              {
                id: codeAndLodgementDate.applicationCodeId,
                date: lodgementDate,
              },
              'body',
              false,
              { transferCache: true },
            )
          : this.applicationCodesApi.getApplicationCodeByCodeAndDate(
              { code: codeAndLodgementDate.code, date: lodgementDate },
              'body',
              false,
              { transferCache: true },
            );
      detail$.subscribe({
        next: (appCodeDetail) => {
          const hasSelectionChanged =
            prevSelection.code !== codeAndLodgementDate.code ||
            (typeof appCodeDetail.applicationCodeId === 'number' &&
              typeof prevSelection.applicationCodeId === 'number' &&
              prevSelection.applicationCodeId !==
                appCodeDetail.applicationCodeId);

          this.form.patchValue({
            applicationTitle: appCodeDetail.title,
            applicationCodeId: appCodeDetail.applicationCodeId ?? null,
          });
          this.feeMeta = codeFeeMeta(appCodeDetail);

          if (hasSelectionChanged) {
            this.wordingSubmitAttempt.set(0);
            this.formSvc.resetSectionsOnApplicationCodeChange(this.forms, true);
            this.respondentValidationSubmitted.set(false);
            this.childErrors.respondent = [];
            this.childErrors.civilFee = [];
            this.childErrors.wording = [];
            this.updateAllErrors({ focusSummary: false });
            this.wordingAppliedBannerVisible.set(false);
            this.entryDetail!.wording = undefined;
          }

          const wordingSubstituteExists = appCodeDetail.wording[
            'substitution-key-constraints'
          ]?.length
            ? true
            : undefined;
          const isFeeRequired = appCodeDetail.isFeeDue;
          const isRespondentRequired = appCodeDetail.requiresRespondent;

          this.handleResultWordingContext(this.navState);

          this.appListEntryDetailPatch({
            isFeeRequired,
            bulkApplicationsAllowed: appCodeDetail.bulkRespondentAllowed,
            appCodeDetail,
          });

          this.openWordingSection.set(wordingSubstituteExists ?? false);
          this.openCivilFeeSection.set(isFeeRequired);
          this.openRespondentSection.set(isRespondentRequired);
          this.entryAccordion?.scrollToFirstExpandedSection([2, 3, 4]);
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

  private handleFatalLoadError(err: unknown): void {
    const { errorHint, errorSummary } = mapHttpErrorToSummary(err);
    this.submitAttempt.update((attempt) => attempt + 1);

    this.appListEntryDetailPatch({
      errorHint,
      summaryErrors: errorSummary,
      errorFound: true,
    });
  }

  private showApplicationCodeLoadError(): void {
    this.appListEntryDetailPatch({
      errorFound: true,
      errorHint: 'There is a problem',
      summaryErrors: [LINKED_CODE_LOAD_ERROR],
    });
  }

  private blockSaveWithoutApplicationCode(): boolean {
    if (
      this.savedApplicationCodeLoaded() &&
      !this.form.controls.applicationCode.value
    ) {
      this.submitAttempt.update((attempt) => attempt + 1);
      this.appListEntryDetailPatch({ formSubmitted: true });
      this.runFullSubmitValidation();
      return true;
    }
    if (this.savedApplicationCodeLoaded() && this.vm().appCodeDetail) {
      return false;
    }
    this.showApplicationCodeLoadError();
    return true;
  }

  private loadSavedStandardApplicantName(id: number | null | undefined): void {
    if (!id) {
      this.savedStandardApplicantName = null;
      this.savedStandardApplicantDetailsUnavailable = false;
      this.pendingStandardApplicantSummary = null;
      this.savedStandardApplicantId = null;
      return;
    }

    this.savedStandardApplicantDetailsUnavailable = false;

    this.loadFacade
      .loadSavedStandardApplicant(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result.kind === 'savedStandardApplicantLoaded') {
          this.saveStandardApplicantDetailsFromResponse(result.applicant);
        } else {
          this.savedStandardApplicantName = null;
          this.savedStandardApplicantDetailsUnavailable = true;
          this.pendingStandardApplicantSummary = null;

          // Append standard applicant errors with existing errors
          const allErrors = this.appListEntryDetailState().summaryErrors;
          const summaryErrors = [
            ...allErrors,
            {
              text:
                getProblemText(result.error) ??
                'Failed to load standard applicant',
            },
          ];

          this.appListEntryDetailPatch({
            errorFound: true,
            summaryErrors,
          });
        }
      });
  }

  /**
   * Applicant and wording
   */

  onStandardApplicantCodeChanged(code: string | null): void {
    this.selectedStandardApplicantCode = code;
    // In Update, no selection means no replacement of the persisted applicant.
    const effectiveCode =
      code ??
      (this.applicantType === 'standard'
        ? (this.entryDetail?.standardApplicantCode ?? null)
        : null);
    this.formSvc.setStandardApplicantCode(this.forms, effectiveCode, {
      emitEvent: false,
    });
    if (
      effectiveCode === this.entryDetail?.standardApplicantCode &&
      !this.form.controls.standardApplicantId?.value
    ) {
      this.form.controls.standardApplicantId?.setValue(
        this.entryDetail?.standardApplicantId ?? null,
        { emitEvent: false },
      );
    }
  }

  onSelectedStandardApplicantSummaryChanged(
    summary: SelectedStandardApplicantSummary | null,
  ): void {
    this.pendingStandardApplicantSummary = summary;
    this.form.controls.standardApplicantId?.setValue(
      summary?.standardApplicantId ??
        (this.form.controls.standardApplicantCode.value ===
        this.entryDetail?.standardApplicantCode
          ? (this.entryDetail?.standardApplicantId ?? null)
          : null),
    );
  }

  private saveStandardApplicantDetailsFromResponse(
    applicant: StandardApplicantGetDetailDto & { applicant?: Applicant },
  ): void {
    this.savedStandardApplicantName =
      applicant.name?.trim() ||
      returnOrgName(applicant.applicant)?.trim() ||
      null;
    this.savedStandardApplicantDetailsUnavailable =
      this.savedStandardApplicantName === null;
    this.pendingStandardApplicantSummary ??= this.savedStandardApplicantName
      ? {
          code: applicant.code.trim(),
          standardApplicantId: this.savedStandardApplicantId ?? undefined,
          name: this.savedStandardApplicantName,
        }
      : null;
  }

  private applySavedStandardApplicantSummary(): void {
    this.savedStandardApplicantId =
      this.entryDetail?.standardApplicantId ?? null;
    if (this.applicantType !== 'standard') {
      this.savedStandardApplicantCode = null;
      this.savedStandardApplicantName = null;
      this.savedStandardApplicantDetailsUnavailable = false;
      this.pendingStandardApplicantSummary = null;
      return;
    }

    const pending = this.pendingStandardApplicantSummary;
    const currentCode = this.selectedStandardApplicantCode?.trim() || '';

    if (pending?.code.trim() === currentCode) {
      this.savedStandardApplicantCode = pending.code.trim() || null;
      this.savedStandardApplicantName = pending.name.trim() || null;
      this.savedStandardApplicantDetailsUnavailable =
        this.savedStandardApplicantName === null;
    }
  }

  private bindApplicantTypeChanges(): void {
    this.form.controls.applicantType.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((type): ApplicantType => type ?? 'person'),
      )
      .subscribe((t) => {
        this.childErrors.applicant = [];
        this.parentErrors = this.parentErrors.filter(
          ({ id }) => id !== 'standardApplicantCode',
        );
        this.updateAllErrors({ focusSummary: false });

        // keep UI state in sync
        this.selectedStandardApplicantCode =
          t === 'standard' ? this.selectedStandardApplicantCode : null;
        this.pendingStandardApplicantSummary =
          t === 'standard' ? this.pendingStandardApplicantSummary : null;

        // let the service reset the subforms + standard code
        this.formSvc.onApplicantTypeChanged(this.forms, t);
        this.formSvc.syncApplicantTypeState(this.forms, t);
        if (t === 'standard') {
          // Update restores the saved selection when returning to its section.
          this.onStandardApplicantCodeChanged(
            this.selectedStandardApplicantCode ??
              this.savedStandardApplicantCode,
          );
        }
      });
  }

  onWordingFieldsDTO(dto: { wordingFields: TemplateSubstitution[] }): void {
    this.forms.form.patchValue({
      wordingFields: dto.wordingFields,
    });
    this.wordingAppliedBannerVisible.set(true);

    focusLocalBanner(this.platformId, '#wording-local-banner');
  }

  onWordingAppliedBannerDismissed(): void {
    this.wordingAppliedBannerVisible.set(false);
  }

  getWordingObjectValues(
    template: TemplateDetail | null | undefined,
  ): TemplateDetail | undefined {
    return this.resolveWordingObjectValues(
      template,
      this.form.controls.wordingFields.value,
    );
  }

  /**
   * Result code
   */

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

  onSubmitResults(payload: ResultSectionSubmitPayload): void {
    const entryId = getEntryId(this.route);
    const listId = this.appListEntryDetailState().appListId;

    if (!entryId || !listId) {
      return;
    }

    this.resetSuccessBanner();
    this.resultsFacade.setPending(payload.pendingToCreate ?? []);

    this.resultAppliedBannerVisible.set(true);

    focusLocalBanner(this.platformId, '#results-local-banner');

    this.appListEntryDetailPatch({
      pendingResults:
        payload.pendingToCreate.length > 0 ||
        payload.existingToUpdate.length > 0,
      resultsPayload: { entryId, listId, payload },
    });
  }

  onRemoveResult(resultId: string): void {
    if (this.blockSaveWithoutApplicationCode()) {
      return;
    }

    const entryId = getEntryId(this.route);
    const listId = this.appListEntryDetailState().appListId;

    if (!entryId || !resultId) {
      return;
    }

    const showSuccess = this.prepareSectionConfirmation(
      'results',
      ENTRY_SUCCESS_MESSAGES.resultRemoved,
    );
    this.resultsFacade.removeResult(
      listId,
      entryId,
      resultId,
      () => {
        this.resultAppliedBannerVisible.set(false);
        showSuccess();
      },
      (err) => this.applyMappedError(err),
    );
  }

  onPendingChange(rows: PendingResultRow[]): void {
    this.resultsFacade.setPending(rows);

    // update stale results on change
    const state = this.appListEntryDetailState();
    if (!state.pendingResults) {
      return;
    }

    const payload = {
      ...state.resultsPayload.payload,
      pendingToCreate: rows ?? [],
    };
    const pendingResults =
      payload.pendingToCreate.length > 0 || payload.existingToUpdate.length > 0;

    if (!pendingResults) {
      this.resultAppliedBannerVisible.set(false);
    }

    this.appListEntryDetailPatch({
      pendingResults,
      resultsPayload: {
        ...state.resultsPayload,
        payload,
      },
    });
  }

  onResultAppliedBannerDismissed(): void {
    this.resultAppliedBannerVisible.set(false);
  }

  /**
   * Fees and partial saves
   */

  onAddFeeDetails(payload: AddFeeDetailsPayload): void {
    this.sectionSaveStatus.set('');
    if (this.blockSaveWithoutApplicationCode()) {
      return;
    }

    this.childErrors.civilFee = [];
    this.updateAllErrors({ focusSummary: false });
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

  onOffsiteFeeChanged(nextValue: boolean): void {
    if (this.blockSaveWithoutApplicationCode()) {
      return;
    }

    const prev = this.persistedHasOffsiteFee;

    if (prev === nextValue) {
      return;
    }

    this.persistHasOffsiteFee(nextValue, prev);
  }

  onCivilFeeSubmitAttempt(): void {
    this.submitAttempt.update((attempt) => attempt + 1);
  }

  /** Saves fee rows, restoring the previous rows if validation or saving fails. */
  private persistFeeStatuses(
    previousFeeStatuses: FeeStatus[],
    feeStatuses: FeeStatus[],
    bannerText: SuccessBanner,
    returningFromPaymentReference = false,
  ): void {
    if (this.blockSaveWithoutApplicationCode()) {
      return;
    }
    const entryId = getEntryId(this.route);
    if (!entryId || !this.entryDetail) {
      return;
    }

    if (this.runWordingValidationForPartialSave()) {
      this.feeSaveFacade.rollbackFeeStatuses(
        this.form.controls.feeStatuses,
        previousFeeStatuses,
      );
      return;
    }

    const isFeeAddition =
      bannerText === ENTRY_SUCCESS_MESSAGES.feeStatusUpdated;
    const showSuccess = this.prepareSectionConfirmation(
      'fees',
      isFeeAddition
        ? { ...bannerText, body: 'Fee details saved.' }
        : bannerText,
      returningFromPaymentReference,
    );
    const { entryUpdateDto, response } = this.feeSaveFacade.save(
      this.appListEntryDetailState().appListId,
      entryId,
      this.entryDetail,
      this.form,
      'feeStatuses',
      feeStatuses,
    );

    response.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.mergeEntryDetailUpdate(entryUpdateDto, res);

        this.form.controls.feeStatuses.markAsPristine();

        if (this.savedContent) {
          this.savedContent.form.feeStatuses = structuredClone(
            this.form.controls.feeStatuses.getRawValue(),
          );
        }

        showSuccess();
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

  /** Saves the offsite-fee selection and restores it if saving fails. */
  private persistHasOffsiteFee(nextValue: boolean, prevValue: boolean): void {
    const entryId = getEntryId(this.route);

    if (!entryId || !this.entryDetail) {
      return;
    }

    if (this.runWordingValidationForPartialSave(true)) {
      this.feeSaveFacade.rollbackOffsiteFee(
        this.form.controls.hasOffsiteFee,
        prevValue,
      );
      return;
    }

    const showSuccess = this.prepareSectionConfirmation(
      'fees',
      nextValue
        ? ENTRY_SUCCESS_MESSAGES.offSiteFeeApplied
        : ENTRY_SUCCESS_MESSAGES.offSiteFeeRemoved,
    );
    const { entryUpdateDto, response } = this.feeSaveFacade.save(
      this.appListEntryDetailState().appListId,
      entryId,
      this.entryDetail,
      this.form,
      'hasOffsiteFee',
      nextValue,
    );

    response.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.mergeEntryDetailUpdate(entryUpdateDto, res);
        this.persistedHasOffsiteFee = nextValue;
        this.feeMeta = this.feeSaveFacade.offsiteFeeMeta(
          this.feeMeta,
          this.entryDetail,
          this.appListEntryDetailState().appCodeDetail,
          nextValue,
        );
        if (this.savedContent) {
          this.savedContent.form.hasOffsiteFee = nextValue;
        }
        this.form.controls.hasOffsiteFee.markAsPristine();

        showSuccess();
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
    this.openCivilFeeSection.set(true);
    this.persistFeeStatuses(previousFeeStatuses, next, bannerText, true);
  }

  /**
   * Full entry saves
   */

  onUpdateApplicant(): void {
    if (this.blockSaveWithoutApplicationCode()) {
      return;
    }

    if (this.isEntrySaveInProgress()) {
      return;
    }

    this.submitAttempt.update((attempt) => attempt + 1);
    this.resetErrors();
    this.resetSuccessBanner();
    this.appListEntryDetailPatch({ formSubmitted: true });

    if (this.runFullSubmitValidation()) {
      return;
    }

    this.setEntrySaveButtonsDisabled(true);

    this.submitEntryUpdate(
      this.buildEntryUpdateDto(),
      ENTRY_SUCCESS_MESSAGES.applicantUpdated,
      'applicant',
    );
  }

  onUpdateApplication(): void {
    if (this.blockSaveWithoutApplicationCode()) {
      return;
    }

    if (this.isEntrySaveInProgress()) {
      return;
    }

    this.submitAttempt.update((attempt) => attempt + 1);
    this.resetErrors();
    this.resetSuccessBanner();
    this.appListEntryDetailPatch({ formSubmitted: true });

    this.wordingSubmitAttempt.update((n) => n + 1);

    if (this.runFullSubmitValidation()) {
      return;
    }

    this.setEntrySaveButtonsDisabled(true);

    // Save result if there are pending results to be saved
    if (this.appListEntryDetailState().pendingResults) {
      const listId = this.appListEntryDetailState().resultsPayload.listId;
      const entryId = this.appListEntryDetailState().resultsPayload.entryId;
      const payload = this.appListEntryDetailState().resultsPayload.payload;

      this.resultsFacade.submitResultChanges(
        listId,
        entryId,
        payload,
        () => {
          this.resultAppliedBannerVisible.set(false);
          this.appListEntryDetailPatch({ pendingResults: false });
          this.submitEntryUpdate(
            this.buildEntryUpdateDto(),
            ENTRY_SUCCESS_MESSAGES.listUpdated,
          );
        },
        (err) => {
          this.applyMappedError(err);
          this.setEntrySaveButtonsDisabled(false);
        },
      );
    } else {
      this.submitEntryUpdate(
        this.buildEntryUpdateDto(),
        ENTRY_SUCCESS_MESSAGES.listUpdated,
      );
    }
  }

  onSaveOfficials(): void {
    if (this.blockSaveWithoutApplicationCode()) {
      return;
    }

    if (this.isEntrySaveInProgress()) {
      return;
    }

    this.submitAttempt.update((attempt) => attempt + 1);
    this.resetErrors();
    this.resetSuccessBanner();
    this.appListEntryDetailPatch({ formSubmitted: true });

    if (this.runFullSubmitValidation()) {
      return;
    }

    this.setEntrySaveButtonsDisabled(true);

    this.submitEntryUpdate(
      this.buildEntryUpdateDto(),
      ENTRY_SUCCESS_MESSAGES.officialsUpdated,
      'officials',
    );
  }

  /** Saves a complete entry update and synchronizes the saved form snapshot. */
  private submitEntryUpdate(
    entryUpdateDto: EntryUpdateDto,
    successBanner: SuccessBanner,
    destination: ConfirmationSection | 'page' = 'page',
  ): void {
    const showSuccess =
      destination === 'page'
        ? () => this.appListEntryDetailPatch({ successBanner })
        : this.prepareSectionConfirmation(destination, successBanner);
    const submittedContent = this.saveFacade.prepareSubmittedContent(
      this.forms,
      this.savedContent,
    );

    if (this.blockSaveWithoutApplicationCode()) {
      return;
    }

    const entryId = getEntryId(this.route);
    this.submitAttempt.update((attempt) => attempt + 1);
    if (!entryId || !this.entryDetail) {
      this.appListEntryDetailPatch({
        errorFound: true,
        summaryErrors: [
          { text: 'Entry is not loaded. Reload the page and try again.' },
        ],
      });
      this.setEntrySaveButtonsDisabled(false);
      return;
    }

    this.saveFacade
      .save(
        this.appListEntryDetailState().appListId,
        entryId,
        entryUpdateDto,
        submittedContent,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ entry: res, submittedContent: savedContent }) => {
          this.appListEntryDetailPatch({
            formSubmitted: false,
            errorFound: false,
          });
          this.mergeEntryDetailUpdate(entryUpdateDto, res);
          this.savedContent = savedContent;
          this.applySavedStandardApplicantSummary();
          showSuccess();

          if (this.applicantType === 'person') {
            markFormGroupClean(this.personGroup);
          } else if (this.applicantType === 'org') {
            markFormGroupClean(this.organisationGroup);
          } else {
            this.form.controls.standardApplicantCode.markAsPristine();
          }
          this.setEntrySaveButtonsDisabled(false);
        },
        error: (err) => {
          this.appListEntryDetailPatch({ formSubmitted: false });
          this.applyMappedError(err);
          this.setEntrySaveButtonsDisabled(false);
        },
      });
  }

  private isEntrySaveInProgress(): boolean {
    return this.disableOfficialButton() || this.disableSaveCompleteAppBtn();
  }

  private setEntrySaveButtonsDisabled(disabled: boolean): void {
    this.disableOfficialButton.set(disabled);
    this.disableSaveCompleteAppBtn.set(disabled);
  }

  /**
   * Validation, errors and section state
   */

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, UPDATE_ENTRY_ERROR_MESSAGES, {
      nested: [{ path: 'applicationNotes', prefixId: 'applicationNotes' }],
      hrefs: ERROR_HREFS,
    });
  }

  private updateApplicantErrors(): void {
    if (this.applicantType === 'person') {
      this.personGroup.markAllAsTouched();
      this.personGroup.updateValueAndValidity({ emitEvent: false });

      this.childErrors.applicant = buildFormErrorSummary(
        this.personGroup,
        APPLICANT_ENTRY_ERROR_MESSAGES,
        { hrefs: APPLICANT_PERSON_ERROR_HREFS },
      );
      return;
    }

    if (this.applicantType === 'org') {
      this.organisationGroup.markAllAsTouched();
      this.organisationGroup.updateValueAndValidity({ emitEvent: false });

      this.childErrors.applicant = buildFormErrorSummary(
        this.organisationGroup,
        APPLICANT_ENTRY_ERROR_MESSAGES,
        { hrefs: APPLICANT_ORG_ERROR_HREFS },
      );
      return;
    }

    if (this.applicantType === 'standard') {
      return;
    }

    this.childErrors.applicant = [];
  }

  readonly respondentValidationSubmitted = signal(false);
  readonly notesSubmittedErrors = signal<readonly ErrorItem[]>([]);

  private updateRespondentErrors(): void {
    // Validate selected Bulk applications even when respondents are optional.
    const isRespondentRequired =
      this.appListEntryDetailState().appCodeDetail?.requiresRespondent ?? true;

    const respondentFormHasValues = respondentFormsHaveAnyValue({
      numberOfRespondents: this.form.controls.numberOfRespondents,
      respondentPersonForm: this.forms.respondentPersonForm,
      respondentOrganisationForm: this.forms.respondentOrganisationForm,
    });

    const shouldValidateRespondent =
      this.form.controls.respondentEntryType.value === 'bulk' ||
      isRespondentRequired ||
      respondentFormHasValues;

    this.respondentValidationSubmitted.set(shouldValidateRespondent);
    if (shouldValidateRespondent) {
      this.childErrors.respondent = buildRespondentErrors({
        respondentEntryType: this.form.controls.respondentEntryType.value,
        respondentPersonForm: this.forms.respondentPersonForm,
        respondentOrganisationForm: this.forms.respondentOrganisationForm,
        errorMessages: RESPONDENT_ENTRY_ERROR_MESSAGES,
        respondentPersonHrefs: RESPONDENT_PERSON_ERROR_HREFS,
        respondentOrganisationHrefs: RESPONDENT_ORG_ERROR_HREFS,
        respondentBulkControl: this.form.controls.numberOfRespondents,
        respondentBulkHrefs: RESPONDENT_BULK_ERROR_HREFS,
        bulkCountRequired: true,
      });
      captureCompositeErrors(
        this.forms.respondentPersonForm,
        this.childErrors.respondent,
      );

      return;
    }

    this.childErrors.respondent = [];
  }

  private updateAllErrors(
    opts: { focusSummary?: boolean; validateOtherSections?: boolean } = {},
  ): void {
    if (opts.validateOtherSections) {
      this.updateApplicantErrors();
      this.updateRespondentErrors();
      this.parentErrors = this.buildErrorSummary();
      this.notesSubmittedErrors.set(
        this.parentErrors.filter(({ id }) =>
          id?.startsWith('applicationNotes.'),
        ),
      );
    }
    const parentErrors = this.suppressCivilFeeSummary
      ? this.parentErrors.filter(
          ({ id }) => !id || !Object.hasOwn(CIVIL_FEE_FIELD_MESSAGES, id),
        )
      : this.parentErrors;
    const childErrors = this.suppressCivilFeeSummary
      ? { ...this.childErrors, civilFee: [] }
      : this.childErrors;
    const summaryErrors = this.collectSummaryErrors(
      getUniqueErrors(parentErrors, Object.values(childErrors).flat()),
    );
    const errorFound = summaryErrors.length > 0;

    this.appListEntryDetailPatch({
      summaryErrors,
      errorFound,
    });
    this.openSectionsWithErrors(childErrors, parentErrors);

    if (errorFound && opts.focusSummary !== false) {
      this.submitAttempt.update((attempt) => attempt + 1);
    }
  }

  resetParentErrorsFromCodeSearch(scope: 'code' | 'all'): void {
    this.childErrors.codes = [];
    this.parentErrors = this.parentErrors.filter(
      ({ id }) =>
        id !== 'applicationCode' && (scope !== 'all' || id !== 'lodgementDate'),
    );
    this.updateAllErrors({ focusSummary: false });
  }

  private collectSummaryErrors(
    errors = getUniqueErrors(
      this.parentErrors,
      Object.values(this.childErrors).flat(),
    ),
  ): ErrorItem[] {
    return this.vm().formReady && !this.savedApplicationCodeLoaded()
      ? [LINKED_CODE_LOAD_ERROR, ...errors]
      : errors;
  }

  onChildErrors(source: ChildErrorSource, errors: ErrorItem[]): void {
    const childErrors = errors ?? [];
    this.childErrors[source] = childErrors;

    if (source !== 'codes' || childErrors.length > 0) {
      this.submitAttempt.update((attempt) => attempt + 1);
    }

    if (source === 'codes' || source === 'resultWording') {
      const summaryErrors = this.collectSummaryErrors();

      this.appListEntryDetailPatch({
        summaryErrors,
        errorFound: summaryErrors.length > 0,
      });

      if (source === 'resultWording' && childErrors.length > 0) {
        this.resultAppliedBannerVisible.set(false);
        this.openResultSection.set(true);
      }

      return;
    }

    if (source === 'wording') {
      if (this.childErrors.wording.length > 0) {
        this.wordingAppliedBannerVisible.set(false);
      }

      this.updateAllErrors();
      return;
    }

    if (this.vm().formSubmitted) {
      this.updateAllErrors();
    }
  }

  private runFullSubmitValidation(): boolean {
    this.form.markAllAsTouched();
    this.form.controls.standardApplicantCode.updateValueAndValidity({
      emitEvent: false,
    });
    this.form.updateValueAndValidity({ emitEvent: false });

    this.applicationCodeSearch?.validateForEntrySubmit();
    const submitErrors = collectChildSubmitErrors<ChildErrorSource>([
      { source: 'wording', section: this.wordingSection },
      { source: 'civilFee', section: this.civilFeeSection },
    ]);

    if (this.resultWordingSection?.hasUnappliedChanges()) {
      this.childErrors.resultWording = [
        {
          text: 'You have unsaved result wording changes. Please apply result before saving.',
          href: ERROR_HREFS.resultWording,
        },
      ];
    } else {
      this.childErrors.resultWording = [];
    }

    this.childErrors.wording = submitErrors.wording ?? [];
    this.childErrors.civilFee = submitErrors.civilFee ?? [];

    this.updateAllErrors({ validateOtherSections: true });
    return this.appListEntryDetailState().errorFound;
  }

  private runWordingValidationForPartialSave(
    suppressCivilFeeSummary = false,
  ): boolean {
    // Wording validation emits an error event that can refresh the summary synchronously.
    const previousSuppression = this.suppressCivilFeeSummary;
    this.suppressCivilFeeSummary = suppressCivilFeeSummary;
    try {
      this.childErrors.wording =
        this.wordingSection?.validateForSubmit({
          enforceSavedWording: false,
        }) ?? [];

      this.updateAllErrors();
      return this.childErrors.wording.length > 0;
    } finally {
      this.suppressCivilFeeSummary = previousSuppression;
    }
  }

  private resetErrors(): void {
    this.notesSubmittedErrors.set([]);
    this.respondentValidationSubmitted.set(false);
    this.appListEntryDetailPatch({
      errorHint: 'There is a problem',
      summaryErrors: [],
      errorFound: false,
    });

    this.parentErrors = [];
    this.childErrors = {
      codes: [],
      fee: [],
      respondent: [],
      applicant: [],
      civilFee: [],
      wording: [],
      resultWording: [],
    };
    if (this.vm().formReady && !this.savedApplicationCodeLoaded()) {
      this.showApplicationCodeLoadError();
    }
  }

  private applyMappedError(err: unknown): void {
    const mapped = mapHttpErrorToSummary(err);
    const summaryErrors = this.collectSummaryErrors(mapped.errorSummary);
    this.appListEntryDetailPatch({
      errorHint: mapped.errorHint,
      summaryErrors,
      errorFound: summaryErrors.length > 0,
    });
  }

  /** Capture the originating section before an asynchronous save disables its button. */
  private prepareSectionConfirmation(
    section: ConfirmationSection,
    message: SuccessBanner,
    returningFromPaymentReference = false,
  ): () => void {
    const trigger = isPlatformBrowser(this.platformId)
      ? document.activeElement
      : null;
    const origin = trigger?.closest('.govuk-accordion__section-content');
    this.resetSuccessBanner();
    return () => {
      if (this.destroyRef.destroyed) {
        return;
      }
      this.appListEntryDetailPatch({ successBanner: null });
      const confirmation = { section, message };
      this.sectionSaveTrigger =
        isPlatformBrowser(this.platformId) && trigger instanceof HTMLElement
          ? trigger
          : null;
      this.sectionConfirmation.set(confirmation);
      focusLocalBanner(this.platformId, `#${section}-save-banner`, () => {
        if (
          this.destroyRef.destroyed ||
          this.sectionConfirmation() !== confirmation
        ) {
          return false;
        }
        const active = document.activeElement;
        // A return navigation starts at the document body, not inside an accordion.
        // Only move to the confirmation if the user has not started working elsewhere.
        const destinationPanel = document
          .getElementById(`${section}-save-banner`)
          ?.closest('.govuk-accordion__section-content');
        if (
          returningFromPaymentReference &&
          active === document.body &&
          destinationPanel &&
          !destinationPanel.hasAttribute('hidden')
        ) {
          return true;
        }
        if (
          origin?.isConnected &&
          !origin.hasAttribute('hidden') &&
          (origin.contains(active) || active === document.body)
        ) {
          return true;
        }
        // The user has moved on: announce completion without reopening a section.
        this.sectionSaveStatus.set(`${message.heading}. ${message.body}`);
        return false;
      });
    };
  }

  onSectionConfirmationDismissed(): void {
    const confirmation = this.sectionConfirmation();
    if (confirmation && isPlatformBrowser(this.platformId)) {
      const banner = document.getElementById(
        `${confirmation.section}-save-banner`,
      );
      if (banner?.contains(document.activeElement)) {
        const panel = banner.closest('.govuk-accordion__section-content');
        const section = confirmation.section;
        const saveButton =
          section === 'applicant' || section === 'officials'
            ? panel?.querySelector<HTMLElement>(
                section === 'applicant'
                  ? '#btn-update-applicant:not(:disabled)'
                  : 'app-officials-section button.govuk-button:not(:disabled)',
              )
            : null;
        const trigger = this.sectionSaveTrigger;
        const availableTrigger =
          trigger?.isConnected &&
          panel?.contains(trigger) &&
          trigger.matches(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)',
          )
            ? trigger
            : null;
        const heading = panel
          ?.closest('.govuk-accordion__section')
          ?.querySelector<HTMLElement>('.govuk-accordion__section-button');
        (saveButton ?? availableTrigger ?? heading)?.focus();
      }
    }
    this.sectionSaveTrigger = null;
    this.sectionConfirmation.set(null);
    this.sectionSaveStatus.set('');
  }

  resetSuccessBanner(): void {
    this.sectionSaveTrigger = null;
    this.sectionConfirmation.set(null);
    this.sectionSaveStatus.set('');
    this.appListEntryDetailPatch({ successBanner: null });
  }

  onAccordionExpandedChange(event: { index: number; expanded: boolean }): void {
    const sections = [
      this.openApplicantSection,
      this.openApplicationCodeSection,
      this.openWordingSection,
      this.openRespondentSection,
      this.openCivilFeeSection,
      this.openNotesSection,
      this.openResultSection,
      this.openOfficialSection,
    ] as const;

    sections[event.index]?.set(event.expanded);
  }

  private openSectionsWithErrors(
    childErrors: Record<ChildErrorSource, ErrorItem[]>,
    parentErrors: ErrorItem[],
  ): void {
    const submitted = this.vm().formSubmitted;

    if (!submitted) {
      return;
    }

    const sectionsWithErrors = getApplicationListEntryErrorSections(
      childErrors,
      parentErrors,
    );
    const sections = [
      this.openApplicantSection,
      this.openApplicationCodeSection,
      this.openWordingSection,
      this.openRespondentSection,
      this.openCivilFeeSection,
      this.openNotesSection,
      this.openOfficialSection,
      this.openResultSection,
    ] as const;
    const sectionNames = [
      'applicant',
      'applicationCode',
      'wording',
      'respondent',
      'civilFee',
      'notes',
      'officials',
      'resultWording',
    ] as const;

    sections.forEach((section, index) => {
      if (sectionsWithErrors[sectionNames[index]]) {
        section.set(true);
      }
    });
  }

  /**
   * Navigation and draft snapshots
   */

  canLeave(): boolean | Observable<boolean> {
    const destination = this.router
      .currentNavigation()
      ?.extractedUrl.toString()
      .split(/[?#]/, 1)[0];
    const { appListId } = this.vm();
    const entryId = getEntryId(this.route);
    // The snapshot preserves form values, but not unapplied wording or result drafts.
    if (
      destination ===
        `/applications-list/${appListId}/update-entry/${entryId}/change-payment-reference` &&
      (this.wordingSection?.hasUnchangedContent() ?? true) &&
      (this.resultWordingSection?.hasUnchangedContent() ?? true)
    ) {
      return true;
    }
    const changed = !this.contentIsUnchanged();
    return this.navigationWarning?.canLeave(changed) ?? !changed;
  }

  private contentIsUnchanged(): boolean {
    return (
      this.savedContent === undefined ||
      (this.formSvc.hasUnchangedContent(this.forms, this.savedContent) &&
        (this.wordingSection?.hasUnchangedContent() ?? true) &&
        (this.resultWordingSection?.hasUnchangedContent() ?? true))
    );
  }

  private clearPaymentRefNavigationStateOnly(): void {
    const current = (history.state ?? {}) as Record<string, unknown>;
    const { paymentRefReturn, entryDetailSnapshot, ...rest } = current;
    history.replaceState(rest, '');
  }

  buildChangePaymentReferenceState = (): Record<string, unknown> => ({
    entryDetailSnapshot: this.buildEntryDetailSnapshot(),
    aleDraftProtection: {
      active: !this.contentIsUnchanged(),
      returnUrl: this.router.url.split(/[?#]/, 1)[0],
    },
  });

  private buildEntryDetailSnapshot(): EntryDetailSnapshot {
    return {
      expandedSections: {
        applicant: this.openApplicantSection(),
        applicationCode: this.openApplicationCodeSection(),
        wording: this.openWordingSection(),
        respondent: this.openRespondentSection(),
        civilFee: this.openCivilFeeSection(),
        notes: this.openNotesSection(),
        result: this.openResultSection(),
        official: this.openOfficialSection(),
      },
      form: this.form.getRawValue(),
      standardApplicantSummary: this.pendingStandardApplicantSummary,
      personForm: this.personForm.getRawValue(),
      organisationForm: this.organisationForm.getRawValue(),
      respondentPersonForm: this.forms.respondentPersonForm.getRawValue(),
      respondentOrganisationForm:
        this.forms.respondentOrganisationForm.getRawValue(),
      appCodeDetail: this.appListEntryDetailState().appCodeDetail,
      feeMeta: this.feeMeta,
      isFeeRequired: this.appListEntryDetailState().isFeeRequired,
      bulkApplicationsAllowed:
        this.appListEntryDetailState().bulkApplicationsAllowed,
      wordingAppliedBannerVisible: this.wordingAppliedBannerVisible(),
    };
  }

  /** Restores form and section state captured before navigation. */
  private applyEntryDetailSnapshot(
    state: EntryDetailSnapshot | undefined,
  ): void {
    if (!state) {
      return;
    }
    this.pendingStandardApplicantSummary =
      state.standardApplicantSummary ?? null;

    this.openApplicantSection.set(
      state.expandedSections?.applicant ?? this.openApplicantSection(),
    );
    this.openApplicationCodeSection.set(
      state.expandedSections?.applicationCode ??
        this.openApplicationCodeSection(),
    );
    this.openWordingSection.set(
      state.expandedSections?.wording ?? this.openWordingSection(),
    );
    this.openRespondentSection.set(
      state.expandedSections?.respondent ?? this.openRespondentSection(),
    );
    this.openCivilFeeSection.set(
      state.expandedSections?.civilFee ?? this.openCivilFeeSection(),
    );
    this.openNotesSection.set(
      state.expandedSections?.notes ?? this.openNotesSection(),
    );
    this.openResultSection.set(
      state.expandedSections?.result ?? this.openResultSection(),
    );
    this.openOfficialSection.set(
      state.expandedSections?.official ?? this.openOfficialSection(),
    );

    if (state.form) {
      this.form.patchValue(state.form, { emitEvent: false });
    }
    if (state.personForm) {
      this.personForm.patchValue(state.personForm, { emitEvent: false });
    }
    if (state.organisationForm) {
      this.organisationForm.patchValue(state.organisationForm, {
        emitEvent: false,
      });
    }
    if (state.respondentPersonForm) {
      this.forms.respondentPersonForm.patchValue(state.respondentPersonForm, {
        emitEvent: false,
      });
    }
    if (state.respondentOrganisationForm) {
      this.forms.respondentOrganisationForm.patchValue(
        state.respondentOrganisationForm,
        {
          emitEvent: false,
        },
      );
    }

    this.feeMeta = state.feeMeta ?? this.feeMeta;
    this.appListEntryDetailPatch({
      appCodeDetail:
        state.appCodeDetail ?? this.appListEntryDetailState().appCodeDetail,
      isFeeRequired:
        state.isFeeRequired ?? this.appListEntryDetailState().isFeeRequired,
      bulkApplicationsAllowed:
        state.bulkApplicationsAllowed ??
        this.appListEntryDetailState().bulkApplicationsAllowed,
    });
    this.wordingAppliedBannerVisible.set(
      state.wordingAppliedBannerVisible === true,
    );

    this.selectedStandardApplicantCode =
      this.form.controls.standardApplicantCode.value;

    const type = this.form.controls.applicantType.value ?? 'person';
    this.formSvc.syncApplicantTypeState(this.forms, type);
  }

  /**
   * Form accessors and DTO helpers
   */

  get respondentErrorItems(): ErrorItem[] {
    return this.childErrors.respondent;
  }

  get applicantErrorItems(): ErrorItem[] {
    return this.childErrors.applicant;
  }

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
    if (this.isEntrySaveInProgress()) {
      return true;
    }

    if (!this.entryDetail) {
      return true;
    }

    switch (this.applicantType) {
      case 'standard':
        return !this.form.controls.standardApplicantCode.value;
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

  get hasBlockingFeeStatuses(): boolean {
    return (
      this.entryDetail?.feeStatuses?.some(
        (status) =>
          status.paymentStatus === PaymentStatus.PAID ||
          status.paymentStatus === PaymentStatus.REMITTED,
      ) ?? false
    );
  }

  get applicationCodeSaveDisabled(): boolean {
    return (
      !this.savedApplicationCodeLoaded() ||
      (!!this.form.controls.applicationCode.value && !this.vm().appCodeDetail)
    );
  }

  private buildEntryUpdateDto(): EntryUpdateDto {
    if (!this.entryDetail) {
      throw new Error('entryDetail is not loaded');
    }

    return this.formSvc.buildUpdateDto(
      this.entryDetail,
      this.forms,
      this.form.controls.standardApplicantCode.value,
    );
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

    // Clear on successful app code change
    const savedCodeChanged =
      (res?.applicationCode ?? entryUpdateDto.applicationCode) !==
      this.entryDetail.applicationCode;
    if (savedCodeChanged && res?.fees === undefined) {
      delete base.fees;
    }

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
      if (this.entryDetail?.wording) {
        patch.wording = withWordingFieldValues(
          this.entryDetail.wording,
          wordingFields,
        );
      }
    } else {
      patch.wordingFields = this.getLegacyWordingFields(this.entryDetail);
      patch.wording = this.entryDetail?.wording;
    }

    return patch;
  }
}
