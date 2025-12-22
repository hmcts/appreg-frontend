import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map } from 'rxjs';

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
import { buildEntryUpdateDtoWithChange } from './util/entry-detail.form';
import { mapHttpErrorToSummary } from './util/errors.util';
import { getEntryId } from './util/routing.util';

import { AccordionComponent } from '@components/accordion/accordion.component';
import { ENTRY_ERROR_MESSAGES } from '@components/applications-list-entry-create/applications-list-entry-create';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import {
  ApplicationNotesForm,
  NotesSectionComponent,
} from '@components/notes-section/notes-section.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '@components/person-section/person-section.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TableColumn } from '@components/selectable-sortable-table/selectable-sortable-table.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { StandardApplicantSelectComponent } from '@components/standard-applicant-select/standard-applicant-select.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { SuccessBanner } from '@core-types/banner/banner.types';
import {
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  UpdateApplicationListEntryRequestParams,
} from '@openapi';
import {
  ApplicationListEntryFormService,
  ApplicationListEntryForms,
} from '@services/application-list-entry-form.service';
import {
  ApplicantType,
  ApplicationsListEntryForm,
  OrganisationForm,
  PersonForm,
} from '@shared-types/applications-list-entry-create/application-list-entry-create-form';
import {
  CodeRow,
  fetchCodeDetail$,
  fetchCodeRows$,
  titleFromDetail,
  wordingFromDetail,
} from '@util/application-code-helpers';
import {
  focusErrorSummary,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { buildFormErrorSummary } from '@util/error-summary';
import { markFormGroupClean, readText } from '@util/form-helpers';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { ValidationResult } from '@util/validation';

type ChildErrorSource = 'notes' | 'fee' | 'respondent';

//Form validation messages should be set here
const UPDATE_ENTRY_ERROR_MESSAGES = {
  standardApplicantCode: {
    required: 'Select a standard applicant',
  },
  ...ENTRY_ERROR_MESSAGES,
};

export const ERROR_HREFS = {
  standardApplicantCode: '#standard-applicant',
} as const;

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
    NotesSectionComponent,
  ],
  templateUrl: './applications-list-entry-detail.html',
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

  // TODO: Avoid ViewChild-driven imperative validation.
  // Prefer Angular validators on the underlying FormGroups (personForm / organisationForm),
  // and surface errors via the existing buildFormErrorSummary / childErrors pattern.
  // This will make the sections reusable and remove component-to-component coupling.
  @ViewChild(PersonSectionComponent)
  private readonly personSection?: PersonSectionComponent;
  @ViewChild(OrganisationSectionComponent)
  private readonly organisationSection?: OrganisationSectionComponent;

  appListId!: string;

  private forms!: ApplicationListEntryForms;

  form!: ApplicationsListEntryForm;
  personForm!: PersonForm;
  organisationForm!: OrganisationForm;

  formSubmitted = false;
  selectedStandardApplicantCode: string | null = null;
  personFieldErrors: Record<string, string> = {};
  organisationFieldErrors: Record<string, string> = {};

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
  };

  // View constants (from helpers)
  applicantColumns: TableColumn[] = APPLICANT_COLUMNS;
  codesColumns: TableColumn[] = CODES_COLUMNS;
  civilFeeColumns: TableColumn[] = CIVIL_FEE_COLUMNS;
  resultWordingColumns: TableColumn[] = RESULT_WORDING_COLUMNS;

  feeStatusOptions = FEE_STATUS_OPTIONS;
  applicantEntryTypeOptions = APPLICANT_TYPE_OPTIONS;
  respondentEntryTypeOptions = RESPONDENT_TYPE_OPTIONS;
  personTitleOptions = PERSON_TITLE_OPTIONS;

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints

  ngOnInit(): void {
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

    // Build forms via helpers
    this.forms = this.formSvc.createForms();
    this.form = this.forms.form;
    this.personForm = this.forms.personForm;
    this.organisationForm = this.forms.organisationForm;

    // Watch applicantType changes
    this.bindApplicantTypeChanges();

    this.loadEntryAndPatchForm();
  }

  // ── UI handlers ─────────────────────────────────────────────────────────────

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
      this.errorFound = true;
      this.summaryErrors = [
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

  private buildErrorSummary(): ErrorItem[] {
    return buildFormErrorSummary(this.form, UPDATE_ENTRY_ERROR_MESSAGES, {
      nested: [{ path: 'applicationNotes', prefixId: 'applicationNotes' }],
      hrefs: ERROR_HREFS,
    });
  }

  private updateAllErrors(): void {
    this.parentErrors = this.buildErrorSummary();
    const allChildErrors = Object.values(this.childErrors).flat();

    this.summaryErrors = [...this.parentErrors, ...allChildErrors];
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
    this.successBanner = null;
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

    // Client-side validation per type
    // TODO:
    //This could be refactored, we should use Angular form validation if possible
    switch (this.applicantType) {
      case 'person': {
        const isPersonValid = this.validatePersonSection();
        if (!isPersonValid) {
          this.errorFound = true;
          focusErrorSummary(this.platformId);
          return;
        }
        break;
      }

      case 'org': {
        const isOrgValid = this.validateOrganisationSection();
        if (!isOrgValid) {
          this.errorFound = true;
          focusErrorSummary(this.platformId);
          return;
        }
        break;
      }

      //TODO:
      //Standard application code validation now handled in Angular form custom validator
      // (standardApplicantCodeConditionalRequired)
      //The above validation blocks should also follow this pattern
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
        next: () => {
          this.formSubmitted = false;
          this.errorFound = false;

          // Keep snapshot in sync
          if (this.entryDetail) {
            this.entryDetail = {
              ...this.entryDetail,
              ...entryUpdateDto,
            };
          }

          this.successBanner = {
            heading: 'Applicant updated',
            body: 'The applicant has been updated for this application list entry.',
          };

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

  private afterCodeUpdatedSuccessfully(
    code: string,
    lodgementDate: string,
  ): void {
    this.form.patchValue({ applicationCode: code });

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
          this.successBanner = computeSuccessBanner('', WORDING_REF_REGEX);
          focusSuccessBanner(this.platformId);
        },
      });
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
          next: (codeDto) =>
            this.form.patchValue({ applicationTitle: codeDto.title }),
          error: () => this.form.patchValue({ applicationTitle: '' }),
        });
    }
  }

  private validatePersonSection(): boolean {
    this.personFieldErrors = {};

    if (!this.personSection) {
      return true;
    }

    const result: ValidationResult = this.personSection.validate();
    this.personFieldErrors = result.fieldErrors;
    this.summaryErrors = [...this.summaryErrors, ...result.summaryItems];

    return result.valid;
  }

  private validateOrganisationSection(): boolean {
    this.organisationFieldErrors = {};

    if (!this.organisationSection) {
      return true;
    }

    const result: ValidationResult = this.organisationSection.validate();
    this.organisationFieldErrors = result.fieldErrors;
    this.summaryErrors = [...this.summaryErrors, ...result.summaryItems];

    return result.valid;
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
    this.personFieldErrors = {};
    this.organisationFieldErrors = {};

    this.errorHint = 'There is a problem';
    this.summaryErrors = [];
    this.errorFound = false;

    this.parentErrors = [];
    this.childErrors = {
      notes: [],
      fee: [],
      respondent: [],
    };
  }

  // ——— Data loading & mapping ———
  private loadEntryAndPatchForm(): void {
    const entryId =
      this.route.snapshot.paramMap.get('entryId') ||
      this.route.snapshot.paramMap.get('id') ||
      this.route.snapshot.queryParamMap.get('entryId');

    if (!this.appListId || !entryId) {
      return;
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
          this.entryDetail = dto;
          const result = this.formSvc.hydrateFromDto(dto, this.forms, {
            emitEvent: false,
          });

          this.selectedStandardApplicantCode =
            result.selectedStandardApplicantCode;

          const type = this.form.controls.applicantType.value ?? 'person';
          this.formSvc.syncApplicantTypeState(this.forms, type);

          this.loadCodesSectionFromEntry(dto);
        },
        error: (err) => this.handleFatalLoadError(err),
      });
  }

  private handleFatalLoadError(err: unknown): void {
    const { errorHint, errorSummary } = mapHttpErrorToSummary(err);

    this.errorHint = errorHint;
    this.summaryErrors = errorSummary;
    this.errorFound = true;

    focusErrorSummary(this.platformId);
  }
}
