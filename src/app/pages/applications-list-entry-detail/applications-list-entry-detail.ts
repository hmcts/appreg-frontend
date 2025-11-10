import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  Inject,
  OnInit,
  PLATFORM_ID,
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
  ApplicationCodePage,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  ContactDetails,
  EntryGetDetailDto,
  EntryUpdateDto,
  FullName,
  Organisation,
  Person,
  StandardApplicantGetSummaryDto,
  StandardApplicantsApi,
  UpdateApplicationListEntryRequestParams,
  Applicant,
  ContactDetails,
  EntryGetDetailDto,
  FullName,
  Organisation,
  Person,
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

type ErrorSummaryItem = { text: string; href?: string };

type ApplicantType = 'person' | 'organisation' | 'standardApplicant';

interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[] | string>;
}

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
    PaginationComponent,
    NotificationBannerComponent,
    SuccessBannerComponent,
  ],
  templateUrl: './applications-list-entry-detail.html',
})
export class ApplicationsListEntryDetail implements OnInit {
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

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly entriesApi: ApplicationListEntriesApi,
    private readonly saApi: StandardApplicantsApi,
    private readonly codesApi: ApplicationCodesApi,
    private readonly fb: NonNullableFormBuilder,
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
  }

  // ——— UI handlers ———
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

    const entryId = this.getEntryId();
    if (!this.appListId || !entryId) {
      return;
    }

    const code = (row?.code ?? '').trim();
    if (!code) {
      return;
    }

    const raw = this.form.getRawValue() as { lodgementDate?: unknown };
    const lodgementDate =
      typeof raw.lodgementDate === 'string'
        ? raw.lodgementDate.slice(0, 10)
        : String(raw.lodgementDate).slice(0, 10);

    if (!lodgementDate) {
      this.hasFatalError = true;
      this.errorHint = 'There is a problem';
      this.errorSummary = [
        {
          text: 'Lodgement date is missing. Load the entry before adding a code.',
        },
      ];
      return;
    }

    const entryUpdateDto: EntryUpdateDto = {
      lodgementDate,
      applicationCode: code,
    };

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
        next: () => this.afterCodeUpdatedSuccessfully(code, lodgementDate),
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
    }
  }

  onSaSelected(ev: { code: string } | string): void {
    const code = typeof ev === 'string' ? ev : ev?.code;
    this.selectedStandardApplicantCode = code ?? null;
  }

  onUpdateApplicant(): void {
    this.resetErrors();
    this.formSubmitted = true;

    if (this.applicantType === 'person') {
      const ok = this.validatePersonSection();
      if (!ok) {
        this.hasFatalError = true;
        this.errorHint = 'There is a problem';
        this.focusErrorSummary();
        return;
      }
    }

    this.formSubmitted = false;
    this.resetErrors();
  }

  private validatePersonSection(): boolean {
    this.personFieldErrors = {};
    this.errorSummary = [];

    const p = this.personGroup.value as Record<string, unknown>;
    const get = (k: string) => {
      const v = p[k];
      return typeof v === 'string' ? v.trim() : '';
    };

    // Establish stable IDs that match idPrefix in your person template
    const ids = {
      firstName: 'person-first-name',
      surname: 'person-surname',
      address1: 'person-address-line-1',
      postcode: 'person-postcode',
      phone: 'person-phone-number',
      mobile: 'person-mobile-number',
      email: 'person-email-address',
    };

    const add = (id: string, text: string, href: string) => {
      this.personFieldErrors[id] = text;
      this.errorSummary.push({ text, href });
    };

    // Required
    if (!get('firstName')) {
      add(ids.firstName, 'Enter a first name', '#person-first-name');
    }
    if (!get('surname')) {
      add(ids.surname, 'Enter a surname', '#person-surname');
    }
    if (!get('addressLine1')) {
      add(ids.address1, 'Enter address line 1', '#person-address-line-1');
    }

    // Optional-but-validated
    const postcode = get('postcode');
    if (postcode && !this.isValidUkPostcode(postcode)) {
      add(
        ids.postcode,
        'Enter a real postcode, like SW1A 1AA',
        '#person-postcode',
      );
    }

    const phone = get('phoneNumber');
    if (phone && !this.isValidPhone(phone)) {
      add(
        ids.phone,
        'Enter a phone number in the correct format',
        '#person-phone-number',
      );
    }

    const mobile = get('mobileNumber');
    if (mobile && !this.isValidPhone(mobile)) {
      add(
        ids.mobile,
        'Enter a mobile number in the correct format',
        '#person-mobile-number',
      );
    }

    const email = get('emailAddress');
    if (email && !this.isValidEmail(email)) {
      add(
        ids.email,
        'Enter an email address in the correct format',
        '#person-email-address',
      );
    }

    return this.errorSummary.length === 0;
  }

  private resetErrors(): void {
    this.personFieldErrors = {};
    this.errorSummary = [];
    this.errorHint = null;
    this.hasFatalError = false;
  }

  private isValidUkPostcode(s: string): boolean {
    const re = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i; // GOV.UK-friendly, lenient
    return re.test(s.trim());
  }

  private isValidPhone(s: string): boolean {
    const digits = s.replace(/[^\d]/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  private isValidEmail(s: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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
        next: (dto) => this.hydrateFromDto(dto),
        error: (err) => this.handleFatalLoadError(err),
      });
  }

  private hydrateFromDto(dto: EntryGetDetailDto): void {
    const sa = (dto.standardApplicantCode ?? '').toString().trim();
    if (sa) {
      this.setApplicantType('standardApplicant', { emit: false });
      this.selectedStandardApplicantCode = sa;
      this.personGroup.reset(this.EMPTY_PERSON, { emitEvent: false });
      this.organisationGroup.reset(this.EMPTY_ORG, { emitEvent: false });
      this.loadStandardApplicants(0, this.saPageSize);
      return;
    }

    const a: Applicant | undefined = dto.applicant;
    if (a?.person) {
      this.setApplicantType('person', { emit: false });
      this.patchPerson(a.person);
      return;
    }
    if (a?.organisation) {
      this.setApplicantType('organisation', { emit: false });
      this.patchOrganisation(a.organisation);
      return;
    }
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
    // Narrow the outer error
    let status = 0;
    let statusText: string | undefined;
    let problem: ProblemDetails | undefined;

    if (typeof err === 'object' && err !== null) {
      const maybeStatus = (err as { status?: unknown }).status;
      if (typeof maybeStatus === 'number') {
        status = maybeStatus;
      }

      const maybeStatusText = (err as { statusText?: unknown }).statusText;
      if (typeof maybeStatusText === 'string') {
        statusText = maybeStatusText;
      }

      const maybeError = (err as { error?: unknown }).error;
      if (typeof maybeError === 'object' && maybeError !== null) {
        const rec = maybeError as Record<string, unknown>;
        const title =
          typeof rec['title'] === 'string' ? rec['title'] : undefined;
        const detail =
          typeof rec['detail'] === 'string' ? rec['detail'] : undefined;

        let errors: ProblemDetails['errors'];
        if (typeof rec['errors'] === 'object' && rec['errors'] !== null) {
          const raw = rec['errors'] as Record<string, unknown>;
          // Coerce values to string[] | string without using `any`
          errors = Object.fromEntries(
            Object.entries(raw).map(([k, v]) => [
              k,
              Array.isArray(v) ? v.map((x) => String(x)) : String(v),
            ]),
          );
        }
        problem = { title, detail, errors };
      }
    }

    const makeItems = (...lines: (string | undefined)[]): ErrorSummaryItem[] =>
      lines
        .filter((t): t is string => !!t && t.trim().length > 0)
        .map((text) => ({ text }));

    switch (status) {
      case 400: {
        // Bad request
        this.errorHint = problem?.title || 'Bad request';
        // If you want to surface field errors, you can flatten problem.errors here.
        this.errorSummary =
          problem?.errors && Object.keys(problem.errors).length > 0
            ? Object.entries(problem.errors).flatMap(([msgs]) =>
                (Array.isArray(msgs) ? msgs : [msgs]).map((m) => ({
                  text: String(m),
                })),
              )
            : makeItems(
                problem?.detail || 'We could not process your request.',
              );
        break;
      }
      case 401: {
        // Unauthenticated
        this.errorHint = problem?.title || 'You need to sign in';
        this.errorSummary = makeItems(
          problem?.detail ||
            'Your session may have expired. Sign in and try again.',
        );
        break;
      }
      case 403: {
        // Forbidden
        this.errorHint =
          problem?.title || 'You do not have permission to view this entry';
        this.errorSummary = makeItems(
          problem?.detail || 'Ask an administrator to grant you access.',
        );
        break;
      }
      case 404: {
        // Not found
        this.errorHint = problem?.title || 'Entry not found';
        this.errorSummary = makeItems(
          problem?.detail ||
            'We could not find this Application List Entry. It may have been removed or you may not have access.',
        );
        break;
      }
      default: {
        // Treat network errors (0) and 5xx as server errors
        if (status === 0 || status >= 500) {
          this.errorHint = problem?.title || 'A server error occurred';
          this.errorSummary = makeItems(
            problem?.detail ||
              'Something went wrong on our side. Try again in a few moments.',
          );
        } else {
          // Unexpected status – generic fallback
          this.errorHint = problem?.title || 'There is a problem';
          this.errorSummary = makeItems(
            problem?.detail ||
              statusText ||
              'An unexpected error occurred. Try again.',
          );
        }
        break;
      }
    }

    this.hasFatalError = true;

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
}
