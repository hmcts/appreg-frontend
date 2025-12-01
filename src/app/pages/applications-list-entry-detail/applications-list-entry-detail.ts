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
import { finalize } from 'rxjs';

import {
  Applicant,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  ContactDetails,
  EntryGetDetailDto,
  EntryUpdateDto,
  FullName,
  Official,
  Organisation,
  Person,
  StandardApplicantGetSummaryDto,
  StandardApplicantPage,
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
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PersonSectionComponent } from '../../shared/components/person-section/person-section.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import {
  SelectableSortableTableComponent,
  TableColumn,
} from '../../shared/components/selectable-sortable-table/selectable-sortable-table.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import {
  fetchCodeDetail$,
  titleFromDetail,
  wordingFromDetail,
} from '../../shared/util/codes.detail';
import { CodeRow } from '../../shared/util/codes.mappers';
import { fetchCodeRows$ } from '../../shared/util/codes.search';
import { MojButtonMenuDirective } from '../../shared/util/moj-button-menu';
import { ValidationResult } from '../../shared/util/validation';

import {
  SuccessBanner,
  computeSuccessBanner,
  focusSuccessBanner,
} from './util/banners.util';
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
import { buildEntryDetailForm } from './util/entry-detail.form';
import { mapHttpErrorToSummary } from './util/errors.util';
import { getEntryId } from './util/routing.util';

type ApplicantType = 'person' | 'organisation' | 'standardApplicant';

type StandardApplicantRow = {
  code: StandardApplicantGetSummaryDto['code'];
  name: string;
  address: string;
  useFrom: string; // formatted date
  useTo: string; // formatted date
};

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
    SelectableSortableTableComponent,
    SortableTableComponent,
    TextInputComponent,
    DateInputComponent,
    ErrorSummaryComponent,
    NotificationBannerComponent,
    SuccessBannerComponent,
    PaginationComponent,
  ],
  templateUrl: './applications-list-entry-detail.html',
})
export class ApplicationsListEntryDetail implements OnInit {
  @ViewChild(PersonSectionComponent)
  private readonly personSection?: PersonSectionComponent;
  @ViewChild(OrganisationSectionComponent)
  private readonly organisationSection?: OrganisationSectionComponent;

  // Error summary state
  errorHint: string | null = null;
  errorSummary: { text: string; href?: string }[] = [];
  hasFatalError = false;
  appListId!: string;

  form!: FormGroup;
  formSubmitted = false;
  selectedStandardApplicantCode: string | null = null;
  personFieldErrors: Record<string, string> = {};
  organisationFieldErrors: Record<string, string> = {};
  saLoading = false;
  saPageIndex = 0;
  saPageSize = 10;
  saTotal = 0;
  saTotalPages = 0;
  saItems: StandardApplicantGetSummaryDto[] = [];
  saSelectedIds: Set<string> = new Set<string>();

  private entryDetail: EntryGetDetailDto | null = null;

  private readonly EMPTY_PERSON = {
    title: '',
    firstName: '',
    middleNames: '',
    surname: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    addressLine5: '',
    postcode: '',
    phoneNumber: '',
    mobileNumber: '',
    emailAddress: '',
  };

  private readonly EMPTY_ORG = {
    name: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    addressLine5: '',
    postcode: '',
    phoneNumber: '',
    mobileNumber: '',
    emailAddress: '',
  };

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
    this.clearErrors();

    const code = this.readText('applicationCode').trim();
    const title = this.readText('applicationTitle').trim();

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
    this.clearErrors();

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
      this.errorHint = 'There is a problem';
      this.errorSummary = [
        {
          text: 'Entry is not loaded. Load the entry before adding a code.',
        },
      ];
      return;
    }

    const entryUpdateDto = this.buildEntryUpdateDtoWithChange(
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

  // ——— Form accessors ———
  get personGroup(): FormGroup {
    return this.form.get('person') as FormGroup;
  }

  get organisationGroup(): FormGroup {
    return this.form.get('organisation') as FormGroup;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────
  private clearErrors(): void {
    this.hasFatalError = false;
    this.errorHint = null;
    this.errorSummary = [];
  }

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

  private readText(path: string): string {
    const v: unknown = this.form.get(path)?.value;
    return typeof v === 'string' ? v : '';
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

  get applicantType(): ApplicantType {
    const v = this.form.get('applicantEntryType')?.value as
      | ApplicantType
      | undefined;
    return v ?? 'person';
  }

  get isUpdateDisabled(): boolean {
    switch (this.applicantType) {
      case 'person':
        return !this.personGroup.valid;
      case 'organisation':
        return !this.organisationGroup.valid;
      case 'standardApplicant':
        return !this.selectedStandardApplicantCode;
      default:
        return false;
    }
  }

  get standardApplicantData(): StandardApplicantRow[] {
    const fmt = (iso?: string | null) =>
      iso ? new Date(iso).toLocaleDateString('en-GB') : '—';

    return this.saItems.map((sa) => {
      const applicant = sa.applicant;
      const person = applicant?.person;
      const organisation = applicant?.organisation;

      // Build a display name
      const personName = person?.name
        ? [
            person.name.title,
            person.name.firstForename,
            person.name.secondForename,
            person.name.thirdForename,
            person.name.surname,
          ]
            .filter(Boolean)
            .join(' ')
        : '';

      const name = organisation?.name ?? personName ?? '';

      const addressLine1 =
        person?.contactDetails?.addressLine1 ??
        organisation?.contactDetails?.addressLine1 ??
        '';

      return {
        code: sa.code ?? '',
        name,
        address: addressLine1,
        useFrom: fmt(sa.startDate),
        useTo: fmt(sa.endDate ?? null),
      };
    });
  }

  onUpdateApplicant(): void {
    this.resetErrors();
    this.formSubmitted = true;
    switch (this.applicantType) {
      case 'person': {
        const ok = this.validatePersonSection();
        if (!ok) {
          this.hasFatalError = true;
          this.errorHint = 'There is a problem';
          this.focusErrorSummary();
          return;
        }
        break;
      }
      case 'organisation': {
        const ok = this.validateOrganisationSection();
        if (!ok) {
          this.hasFatalError = true;
          this.errorHint = 'There is a problem';
          this.focusErrorSummary();
          return;
        }
        break;
      }
    }

    this.formSubmitted = false;
    this.resetErrors();
  }

  onSaPageChange(pageIndex: number): void {
    this.saPageIndex = pageIndex;
    this.loadStandardApplicants(pageIndex, this.saPageSize);
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

  private loadStandardApplicants(page = 0, size = this.saPageSize): void {
    this.saLoading = true;
    this.saApi
      .getStandardApplicants({ page, size }, 'body', false, {
        context: undefined,
        transferCache: true,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saLoading = false;
        }),
      )
      .subscribe({
        next: (pg: StandardApplicantPage) => {
          this.saItems = pg.content ?? [];
          this.saTotal = pg.totalElements ?? 0;

          const pageSize = pg.pageSize ?? size;

          let totalPages = 0;
          if (pageSize > 0 && this.saTotal >= pageSize) {
            totalPages = Math.ceil(this.saTotal / pageSize);
          }
          this.saTotalPages = totalPages;

          if (this.selectedStandardApplicantCode) {
            this.saSelectedIds = new Set([this.selectedStandardApplicantCode]);
          }
        },
        error: () => {
          this.saItems = [];
          this.saTotal = 0;
          this.saTotalPages = 0;
          this.saSelectedIds = new Set<string>();
        },
      });
  }

  private onApplicantTypeChanged(): void {
    this.formSubmitted = false;
    this.resetErrors();

    this.selectedStandardApplicantCode = null;

    this.personGroup.reset(this.EMPTY_PERSON, { emitEvent: false });
    this.organisationGroup.reset(this.EMPTY_ORG, { emitEvent: false });

    this.markGroupClean(this.personGroup);
    this.markGroupClean(this.organisationGroup);

    if (this.applicantType === 'standardApplicant') {
      this.loadStandardApplicants(0, this.saPageSize);
    }
  }

  private markGroupClean(group: FormGroup): void {
  const controls = Object.values(group.controls);

  for (const ctrl of controls) {
    ctrl.markAsPristine();
    ctrl.markAsUntouched();
    ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }
}

  private resetErrors(): void {
    this.personFieldErrors = {};
    this.organisationFieldErrors = {};
    this.errorSummary = [];
    this.errorHint = null;
    this.hasFatalError = false;
  }

  private focusErrorSummary(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>(
          '[data-component="error-summary"]',
        );
        el?.focus?.();
        el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      });
    }
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
    // Base scalar fields that are actually present on EntryGetDetailDto
    this.form.patchValue(
      {
        // Codes section
        lodgementDate: dto.lodgementDate ?? '',
        applicationCode: dto.applicationCode ?? '',
        // applicationTitle is not on EntryGetDetailDto – leave as-is
        // or clear if you prefer a known state:
        // applicationTitle: '',

        // Wording section – EntryGetDetailDto only gives you wordingFields: string[]
        // Without a defined positional mapping you should not guess.
        courtName: '',
        organisationName: '',

        // Civil fee section – EntryGetDetailDto exposes feeStatuses[] + hasOffsiteFee.
        // If you don’t have a defined rule for “current” status yet, keep these blank.
        feeStatus: '',
        feeStatusDate: '',
        paymentRef: '',

        // Notes section
        caseReference: dto.caseReference ?? '',
        accountReference: dto.accountNumber ?? '',
        applicationDetails: dto.notes ?? '',

        // Result wording section – result is a separate resource, so clear this here.
        resultCode: '',

        // Officials – not part of EntryGetDetailDto; clear UI fields for now.
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

    // —— Applicant section (Standard Applicant vs Person vs Organisation) ——

    const saCode = (dto.standardApplicantCode ?? '').toString().trim();
    if (saCode) {
      this.setApplicantType('standardApplicant', { emit: false });
      this.selectedStandardApplicantCode = saCode;
      this.personGroup.reset(this.EMPTY_PERSON, { emitEvent: false });
      this.organisationGroup.reset(this.EMPTY_ORG, { emitEvent: false });
      this.loadStandardApplicants(0, this.saPageSize);
      return;
    }

    const a: Applicant | undefined = dto.applicant;

    if (a?.person) {
      this.setApplicantType('person', { emit: false });
      this.selectedStandardApplicantCode = null;
      this.organisationGroup.reset(this.EMPTY_ORG, { emitEvent: false });
      this.patchPerson(a.person);
      return;
    }

    if (a?.organisation) {
      this.setApplicantType('organisation', { emit: false });
      this.selectedStandardApplicantCode = null;
      this.personGroup.reset(this.EMPTY_PERSON, { emitEvent: false });
      this.patchOrganisation(a.organisation);
      return;
    }

    // No applicant of any type – default to an empty organisation
    this.setApplicantType('organisation', { emit: false });
    this.selectedStandardApplicantCode = null;
    this.personGroup.reset(this.EMPTY_PERSON, { emitEvent: false });
    this.organisationGroup.reset(this.EMPTY_ORG, { emitEvent: false });
  }

  private setApplicantType(
    type: ApplicantType,
    opts?: { emit?: boolean },
  ): void {
    this.form
      .get('applicantEntryType')!
      .setValue(type, { emitEvent: opts?.emit !== false });
  }

  private patchPerson(p: Person): void {
    const name: FullName = p.name;
    const cd: ContactDetails = p.contactDetails;
    this.personGroup.patchValue({
      title: name.title ?? '',
      firstName: name.firstForename ?? '',
      middleNames: [name.secondForename, name.thirdForename]
        .filter(Boolean)
        .join(' '),
      surname: name.surname ?? '',
      addressLine1: cd.addressLine1 ?? '',
      addressLine2: cd.addressLine2 ?? '',
      addressLine3: cd.addressLine3 ?? '',
      addressLine4: cd.addressLine4 ?? '',
      addressLine5: cd.addressLine5 ?? '',
      postcode: cd.postcode ?? '',
      phoneNumber: cd.phone ?? '',
      mobileNumber: cd.mobile ?? '',
      emailAddress: cd.email ?? '',
    });
  }

  private patchOrganisation(o: Organisation): void {
    const cd: ContactDetails = o.contactDetails;
    this.organisationGroup.patchValue({
      name: o.name ?? '',
      addressLine1: cd.addressLine1 ?? '',
      addressLine2: cd.addressLine2 ?? '',
      addressLine3: cd.addressLine3 ?? '',
      addressLine4: cd.addressLine4 ?? '',
      addressLine5: cd.addressLine5 ?? '',
      postcode: cd.postcode ?? '',
      phoneNumber: cd.phone ?? '',
      mobileNumber: cd.mobile ?? '',
      emailAddress: cd.email ?? '',
    });
  }

  private handleFatalLoadError(err: unknown): void {
    const { errorHint, errorSummary } = mapHttpErrorToSummary(err);

    this.errorHint = errorHint;
    this.errorSummary = errorSummary;
    this.hasFatalError = true;

    this.focusErrorSummary();
  }

  // Function to create an update payload with all existing values + changed values
  private buildEntryUpdateDtoWithChange<K extends keyof EntryUpdateDto>(
    key: K,
    value: EntryUpdateDto[K],
  ): EntryUpdateDto {
    if (!this.entryDetail) {
      throw new Error('entryDetail is not loaded');
    }

    const detail = this.entryDetail;

    const base: EntryUpdateDto = {
      // full copy of current server state
      standardApplicantCode: detail.standardApplicantCode,
      applicationCode: detail.applicationCode,
      applicant: detail.applicant,
      respondent: detail.respondent,
      numberOfRespondents: detail.numberOfRespondents,
      wordingFields: detail.wordingFields,
      feeStatuses: detail.feeStatuses,
      hasOffsiteFee: detail.hasOffsiteFee,
      caseReference: detail.caseReference,
      accountNumber: detail.accountNumber,
      notes: detail.notes,
      lodgementDate: detail.lodgementDate,
      ...(detail as { officials?: Official[] }),
    };

    return {
      ...base,
      [key]: value,
    };
  }
}
