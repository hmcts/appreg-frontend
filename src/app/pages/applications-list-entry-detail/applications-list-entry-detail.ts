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

  Error and UX handling:
    - Maps HTTP errors into GOV.UK-style error summary and hint state
    - Manages success banners and scroll/focus behaviour for validation and server errors
*/

import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import {
  Applicant,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  Organisation,
  Person,
  StandardApplicantsApi,
  UpdateApplicationListEntryRequestParams,
} from '../../../generated/openapi';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '../../shared/components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '../../shared/components/notification-banner/notification-banner.component';
import { OrganisationSectionComponent } from '../../shared/components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '../../shared/components/person-section/person-section.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { TableColumn } from '../../shared/components/selectable-sortable-table/selectable-sortable-table.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { StandardApplicantSelectComponent } from '../../shared/components/standard-applicant-select/standard-applicant-select.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import {
  createEmptyOrganisation,
  createEmptyPerson,
} from '../../shared/util/applicant-helpers';
import {
  CodeRow,
  fetchCodeDetail$,
  fetchCodeRows$,
  titleFromDetail,
  wordingFromDetail,
} from '../../shared/util/application-code-helpers';
import { focusErrorSummary } from '../../shared/util/error-click';
import { markFormGroupClean, readText } from '../../shared/util/form-helpers';
import { MojButtonMenuDirective } from '../../shared/util/moj-button-menu';
import {
  ApplicantType,
  OrganisationFormRaw,
  PersonFormRaw,
} from '../../shared/util/types/applications-list-entry/types';
import { SuccessBanner } from '../../shared/util/types/shared-types';
import { ValidationResult } from '../../shared/util/validation';

import { computeSuccessBanner, focusSuccessBanner } from './util/banners.util';
import {
  APPLICANT_COLUMNS,
  APPLICANT_TYPE_OPTIONS,
  CIVIL_FEE_COLUMNS,
  CODES_COLUMNS,
  FEE_STATUS_OPTIONS,
  PERSON_TITLE_OPTIONS,
  RESPONDENT_TYPE_OPTIONS,
  RESULT_WORDING_COLUMNS,
  WORDING_REF_REGEX,
} from './util/entry-detail.constants';
import {
  buildEntryDetailForm,
  buildEntryUpdateDtoWithChange,
  buildOrganisationApplicantFromRaw,
  buildPersonApplicantFromRaw,
  organisationToFormPatch,
  personToFormPatch,
} from './util/entry-detail.form';
import { mapHttpErrorToSummary } from './util/errors.util';
import { getEntryId } from './util/routing.util';

@Component({
  selector: 'app-applications-list-entry-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    AccordionComponent,
    SelectInputComponent,
    PersonSectionComponent,
    OrganisationSectionComponent,
    MojButtonMenuDirective,
    SortableTableComponent,
    TextInputComponent,
    DateInputComponent,
    ErrorSummaryComponent,
    NotificationBannerComponent,
    SuccessBannerComponent,
    StandardApplicantSelectComponent,
  ],
  templateUrl: './applications-list-entry-detail.html',
})
export class ApplicationsListEntryDetail implements OnInit {
  @ViewChild(PersonSectionComponent)
  private readonly personSection?: PersonSectionComponent;
  @ViewChild(OrganisationSectionComponent)
  private readonly organisationSection?: OrganisationSectionComponent;

  // Error summary state
  errorHint: string | null = 'There is a problem';
  errorSummary: ErrorItem[] = [];
  hasFatalError = false;
  appListId!: string;

  form!: FormGroup;
  formSubmitted = false;
  selectedStandardApplicantCode: string | null = null;
  personFieldErrors: Record<string, string> = {};
  organisationFieldErrors: Record<string, string> = {};

  emptyPerson: Person = createEmptyPerson();
  emptyOrganisation: Organisation = createEmptyOrganisation();

  private entryDetail: EntryGetDetailDto | null = null;
  private readonly destroyRef = inject(DestroyRef);

  // Codes table state
  codesRows: CodeRow[] = [];
  codesLoading = false;
  codesHasSearched = false;

  // Success banner
  successBanner: SuccessBanner | null = null;

  // View constants (from helpers)
  applicantColumns: TableColumn[] = APPLICANT_COLUMNS;
  codesColumns: TableColumn[] = CODES_COLUMNS;
  civilFeeColumns: TableColumn[] = CIVIL_FEE_COLUMNS;
  resultWordingColumns: TableColumn[] = RESULT_WORDING_COLUMNS;

  feeStatusOptions = FEE_STATUS_OPTIONS;
  applicantEntryTypeOptions = APPLICANT_TYPE_OPTIONS;
  respondentEntryTypeOptions = RESPONDENT_TYPE_OPTIONS;
  personTitleOptions = PERSON_TITLE_OPTIONS;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly entriesApi: ApplicationListEntriesApi,
    private readonly codesApi: ApplicationCodesApi,
    private readonly fb: NonNullableFormBuilder,
    private readonly saApi: StandardApplicantsApi,
  ) {}

  ngOnInit(): void {
    // Resolve Applications List ID
    const nav = this.router.currentNavigation();
    const fromNav = nav?.extras?.state as { appListId?: string } | undefined;
    const fromHist = isPlatformBrowser(this.platformId)
      ? (history.state as { appListId?: string } | undefined)
      : undefined;

    this.appListId =
      fromNav?.appListId ??
      fromHist?.appListId ??
      this.route.snapshot.queryParamMap.get('appListId') ??
      '';

    // Build form via helper
    this.form = buildEntryDetailForm(this.fb);

    // Initial load for Codes section (lodgementDate + applicationCode/title)
    this.loadCodesSection();

    this.form
      .get('applicantEntryType')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onApplicantTypeChanged());

    this.loadEntryAndPatchForm();
  }

  // ── UI handlers ─────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.formSubmitted = true;
  }

  onCodesSearch(): void {
    this.codesHasSearched = true;
    this.codesRows = [];
    this.resetErrors();

    const code = readText(this.form, 'applicationCode').trim();
    const title = readText(this.form, 'applicationTitle').trim();

    this.codesLoading = true;
    fetchCodeRows$(
      this.codesApi,
      {
        code: code || undefined,
        title: title || undefined,
        page: 0,
        size: 10,
      },
      true,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.codesRows = rows;
          this.codesLoading = false;
        },
        error: (err) => {
          this.codesLoading = false;
          this.applyMappedError(err);
        },
      });
  }

  onAddCode(row: CodeRow): void {
    this.successBanner = null;
    this.resetErrors();

    const entryId = getEntryId(this.route);
    if (!this.appListId || !entryId) {
      return;
    }

    const code = (row?.code ?? '').trim();
    if (!code) {
      return;
    }

    if (!this.entryDetail) {
      this.hasFatalError = true;
      this.errorSummary = [
        {
          text: 'Entry is not loaded. Load the entry before adding a code.',
        },
      ];
      return;
    }

    const entryUpdateDto = buildEntryUpdateDtoWithChange(
      this.entryDetail,
      'applicationCode',
      code,
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
        next: () =>
          this.afterCodeUpdatedSuccessfully(
            entryUpdateDto.applicationCode,
            entryUpdateDto.lodgementDate,
          ),
        error: (err) => this.applyMappedError(err),
      });
  }

  // Error summary click → move focus/caret to target input
  onErrorItemClick = (err: ErrorItem): void => {
    const href = err?.href ?? '';
    const id = href.startsWith('#') ? href.slice(1) : href;
    if (!id || !isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      const el = document.getElementById(id) as
        | (HTMLInputElement & {
            setSelectionRange?: (s: number, e: number) => void;
          })
        | HTMLTextAreaElement
        | null;
      if (!el) {
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus?.();
      try {
        const val = (el as HTMLInputElement).value ?? '';
        if ('setSelectionRange' in el) {
          el.setSelectionRange(val.length, val.length);
        }
      } catch {
        /* no-op */
      }
    });
  };

  onUpdateApplicant(): void {
    this.resetErrors();
    this.successBanner = null;
    this.formSubmitted = true;

    // Client-side validation
    switch (this.applicantType) {
      case 'person': {
        const isPersonValid = this.validatePersonSection();
        if (!isPersonValid) {
          this.hasFatalError = true;
          focusErrorSummary(this.platformId);
          return;
        }
        break;
      }

      case 'organisation': {
        const isOrgValid = this.validateOrganisationSection();
        if (!isOrgValid) {
          this.hasFatalError = true;
          focusErrorSummary(this.platformId);
          return;
        }
        break;
      }

      case 'standardApplicant': {
        const code = this.selectedStandardApplicantCode?.trim();
        if (!code) {
          this.hasFatalError = true;
          this.errorSummary = [
            {
              text: 'Select a standard applicant',
              href: '#sortable-table',
            },
          ];
          focusErrorSummary(this.platformId);
          return;
        }
        break;
      }

      default: {
        this.hasFatalError = true;
        this.errorSummary = [
          { text: 'Select an applicant type', href: '#application-entry-type' },
        ];
        focusErrorSummary(this.platformId);
        return;
      }
    }

    // Ensure we have listId, entryId and a loaded server snapshot
    const entryId = getEntryId(this.route);
    if (!this.appListId || !entryId || !this.entryDetail) {
      this.hasFatalError = true;
      this.errorSummary = [
        {
          text: 'Entry is not loaded. Reload the page and try again.',
        },
      ];
      focusErrorSummary(this.platformId);
      return;
    }

    let entryUpdateDto: EntryUpdateDto;

    switch (this.applicantType) {
      case 'standardApplicant': {
        const code = this.selectedStandardApplicantCode?.trim() || undefined;
        entryUpdateDto = buildEntryUpdateDtoWithChange(
          this.entryDetail,
          'standardApplicantCode',
          code,
        );
        // Mutually exclusive with person/org
        entryUpdateDto.applicant = undefined;
        break;
      }

      case 'person': {
        const applicant = this.buildPersonApplicantFromForm();
        entryUpdateDto = buildEntryUpdateDtoWithChange(
          this.entryDetail,
          'applicant',
          applicant,
        );
        // Mutually exclusive with standard applicant
        entryUpdateDto.standardApplicantCode = undefined;
        break;
      }

      case 'organisation': {
        const applicant = this.buildOrganisationApplicantFromForm();
        entryUpdateDto = buildEntryUpdateDtoWithChange(
          this.entryDetail,
          'applicant',
          applicant,
        );
        entryUpdateDto.standardApplicantCode = undefined;
        break;
      }
    }

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
        next: () => {
          this.formSubmitted = false;
          this.hasFatalError = false;

          this.successBanner = {
            heading: 'Applicant updated',
            body: 'The applicant has been updated for this application list entry.',
          };

          if (this.applicantType === 'person') {
            markFormGroupClean(this.personGroup);
          } else if (this.applicantType === 'organisation') {
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

  // ——— Form accessors ———
  get personGroup(): FormGroup {
    return this.form.get('person') as FormGroup;
  }

  get organisationGroup(): FormGroup {
    return this.form.get('organisation') as FormGroup;
  }

  get applicantType(): ApplicantType {
    const v = this.form.get('applicantEntryType')?.value as
      | ApplicantType
      | undefined;
    return v ?? 'person';
  }

  get isUpdateDisabled(): boolean {
    // No updates if details haven't been loaded
    if (!this.entryDetail) {
      return true;
    }

    switch (this.applicantType) {
      case 'standardApplicant':
        return !this.selectedStandardApplicantCode;
      case 'person':
      case 'organisation':
        return false;
      default:
        return true;
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────
  private applyMappedError(err: unknown): void {
    const mapped = mapHttpErrorToSummary(err);
    this.hasFatalError = mapped.hasFatalError;
    this.errorHint = mapped.errorHint;
    this.errorSummary = mapped.errorSummary;
  }

  private afterCodeUpdatedSuccessfully(
    code: string,
    lodgementDate: string,
  ): void {
    // Reflect code immediately
    this.form.patchValue({ applicationCode: code });

    // Use helper to fetch code detail and keep the component clean
    fetchCodeDetail$(this.codesApi, code, lodgementDate, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.form.patchValue({ applicationTitle: titleFromDetail(detail) });

          const wording = wordingFromDetail(detail);
          this.successBanner = computeSuccessBanner(wording, WORDING_REF_REGEX);
          focusSuccessBanner(this.platformId);
        },
        error: () => {
          // Still show a generic success banner if the detail lookup fails
          this.successBanner = computeSuccessBanner('', WORDING_REF_REGEX);
          focusSuccessBanner(this.platformId);
        },
      });
  }

  private loadCodesSection(): void {
    const entryId = getEntryId(this.route);
    if (!this.appListId || !entryId) {
      return;
    }

    this.entriesApi
      .getApplicationListEntry(
        { listId: this.appListId, entryId },
        'body',
        false,
        { transferCache: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entry) => {
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
                  const title = codeDto.title;
                  this.form.patchValue({ applicationTitle: title });
                },
                error: () => {
                  this.form.patchValue({ applicationTitle: '' });
                },
              });
          }
        },
      });
  }

  private validatePersonSection(): boolean {
    // Clear any existing person errors, but keep other summary items if needed
    this.personFieldErrors = {};

    // If the person section isn’t currently rendered, treat as valid
    if (!this.personSection) {
      return true;
    }

    const result: ValidationResult = this.personSection.validate();
    this.personFieldErrors = result.fieldErrors;
    this.errorSummary = [...this.errorSummary, ...result.summaryItems];

    return result.valid;
  }

  private validateOrganisationSection(): boolean {
    this.organisationFieldErrors = {};

    if (!this.organisationSection) {
      return true;
    }

    const result: ValidationResult = this.organisationSection.validate();
    this.organisationFieldErrors = result.fieldErrors;
    this.errorSummary = [...this.errorSummary, ...result.summaryItems];

    return result.valid;
  }

  private onApplicantTypeChanged(): void {
    this.formSubmitted = false;
    this.resetErrors();

    this.selectedStandardApplicantCode = null;

    this.personGroup.reset(this.emptyPerson, { emitEvent: false });
    this.organisationGroup.reset(this.emptyOrganisation, { emitEvent: false });

    markFormGroupClean(this.personGroup);
    markFormGroupClean(this.organisationGroup);
  }

  private resetErrors(): void {
    this.personFieldErrors = {};
    this.organisationFieldErrors = {};
    this.errorSummary = [];
    this.errorHint = 'There is a problem';
    this.hasFatalError = false;
  }

  // ——— Data loading & mapping ———
  private loadEntryAndPatchForm(): void {
    const entryId =
      this.route.snapshot.paramMap.get('entryId') ||
      this.route.snapshot.paramMap.get('id') ||
      this.route.snapshot.queryParamMap.get('entryId');

    if (!this.appListId || !entryId) {
      return; // nothing to hydrate
    }

    this.entriesApi
      .getApplicationListEntry(
        { listId: this.appListId, entryId },
        'body',
        false,
        {
          context: undefined,
          transferCache: true,
        },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dto) => {
          // Snapshot of entry and update form
          this.entryDetail = dto;
          this.hydrateFromDto(dto);
        },
        error: (err) => this.handleFatalLoadError(err),
      });
  }

  private hydrateFromDto(dto: EntryGetDetailDto): void {
    this.form.patchValue(
      {
        lodgementDate: dto.lodgementDate ?? '',
        applicationCode: dto.applicationCode ?? '',
        courtName: '',
        organisationName: '',
        feeStatus: '',
        feeStatusDate: '',
        paymentRef: '',
        caseReference: dto.caseReference ?? '',
        accountReference: dto.accountNumber ?? '',
        applicationDetails: dto.notes ?? '',
        resultCode: '',
        mags1Title: '',
        mags1FirstName: '',
        mags1Surname: '',
        mags2Title: '',
        mags2FirstName: '',
        mags2Surname: '',
        mags3Title: '',
        mags3FirstName: '',
        mags3Surname: '',
        officialTitle: '',
        officialFirstName: '',
        officialSurname: '',
      },
      { emitEvent: false },
    );

    // Applicants
    const saCode = (dto.standardApplicantCode ?? '').toString().trim();
    if (saCode) {
      this.setApplicantType('standardApplicant', { emit: false });
      this.selectedStandardApplicantCode = saCode;
      this.personGroup.reset(this.emptyPerson, { emitEvent: false });
      this.organisationGroup.reset(this.emptyOrganisation, {
        emitEvent: false,
      });
      return;
    }

    const a: Applicant | undefined = dto.applicant;

    if (a?.person) {
      this.setApplicantType('person', { emit: false });
      this.selectedStandardApplicantCode = null;
      this.organisationGroup.reset(this.emptyOrganisation, {
        emitEvent: false,
      });
      this.form.patchValue(personToFormPatch(a.person));
      return;
    }

    if (a?.organisation) {
      this.setApplicantType('organisation', { emit: false });
      this.selectedStandardApplicantCode = null;
      this.personGroup.reset(this.emptyPerson, { emitEvent: false });
      this.form.patchValue(organisationToFormPatch(a.organisation));
      return;
    }

    // default to an empty organisation
    this.setApplicantType('organisation', { emit: false });
    this.selectedStandardApplicantCode = null;
    this.personGroup.reset(this.emptyPerson, { emitEvent: false });
    this.organisationGroup.reset(this.emptyOrganisation, { emitEvent: false });
  }

  private setApplicantType(
    type: ApplicantType,
    opts?: { emit?: boolean },
  ): void {
    this.form
      .get('applicantEntryType')!
      .setValue(type, { emitEvent: opts?.emit !== false });
  }

  private handleFatalLoadError(err: unknown): void {
    const { errorHint, errorSummary } = mapHttpErrorToSummary(err);

    this.errorHint = errorHint;
    this.errorSummary = errorSummary;
    this.hasFatalError = true;

    focusErrorSummary(this.platformId);
  }

  private buildPersonApplicantFromForm(): Applicant {
    const raw = this.personGroup.getRawValue() as PersonFormRaw;
    return buildPersonApplicantFromRaw(raw);
  }

  private buildOrganisationApplicantFromForm(): Applicant {
    const raw = this.organisationGroup.getRawValue() as OrganisationFormRaw;
    return buildOrganisationApplicantFromRaw(raw);
  }
}
