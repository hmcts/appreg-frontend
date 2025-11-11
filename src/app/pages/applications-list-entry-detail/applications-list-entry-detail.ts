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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import {
  Applicant,
  ApplicationListEntriesApi,
  ContactDetails,
  EntryGetDetailDto,
  FullName,
  Organisation,
  Person,
  StandardApplicantGetSummaryDto,
  StandardApplicantsApi,
} from '../../../generated/openapi';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '../../shared/components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '../../shared/components/organisation-section/organisation-section.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PersonSectionComponent } from '../../shared/components/person-section/person-section.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import {
  SelectableSortableTableComponent,
  TableColumn,
} from '../../shared/components/selectable-sortable-table/selectable-sortable-table.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { MojButtonMenuDirective } from '../../shared/util/moj-button-menu';

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
  ],
  templateUrl: './applications-list-entry-detail.html',
})
export class ApplicationsListEntryDetail implements OnInit {
  // Error summary state
  errorHint: string | null = null;
  errorSummary: { text: string; href?: string }[] = [];
  hasFatalError = false;
  appListId!: string;
  formSubmitted = false;
  form!: FormGroup;
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

  applicantColumns: TableColumn[] = [
    { header: 'Code', field: 'code', numeric: true },
    { header: 'Name', field: 'name' },
    { header: 'Address line 1', field: 'address' },
    { header: 'Use from', field: 'useFrom' },
    { header: 'Use to', field: 'useTo' },
  ];

  codesColumns: TableColumn[] = [
    { header: 'Code', field: 'code', numeric: true },
    { header: 'Title', field: 'title' },
    { header: 'Bulk', field: 'bulk' },
    { header: 'Fee req', field: 'fee' },
    { header: 'Actions', field: 'actions' },
  ];

  feeStatusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'outstanding', label: 'Outstanding' },
    { value: 'pending', label: 'Pending' },
  ];

  civilFeeColumns = [
    { header: 'Fee Status', field: 'status' },
    { header: 'Status Date', field: 'date' },
    { header: 'Payment Ref', field: 'paymentRef' },
  ];

  resultWordingColumns = [
    { header: 'Applicant(s)', field: 'applicants' },
    { header: 'Respondent(s)', field: 'respondents' },
    { header: 'Application title(s)', field: 'titles' },
  ];

  applicantEntryTypeOptions = [
    { value: 'person', label: 'Person' },
    { value: 'organisation', label: 'Organisation' },
    { value: 'standardApplicant', label: 'Standard Applicant' },
  ];

  respondentEntryTypeOptions = [
    { value: 'person', label: 'Person' },
    { value: 'organisation', label: 'Organisation' },
  ];

  personTitleOptions = [
    { value: 'mr', label: 'Mr' },
    { value: 'mrs', label: 'Mrs' },
    { value: 'miss', label: 'Miss' },
    { value: 'dr', label: 'Dr' },
    { value: 'other', label: 'Other' },
  ];

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

  constructor(
    private readonly fb: FormBuilder,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly entriesApi: ApplicationListEntriesApi,
    private readonly saApi: StandardApplicantsApi,
  ) {}

  ngOnInit(): void {
    // Resolve list id from nav state / history / query param
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

    // Build the full form shape used by the templates
    this.form = this.fb.group({
      applicantEntryType: ['person'],
      respondentEntryType: ['person'],

      person: this.fb.group({
        title: [''],
        firstName: [''],
        middleNames: [''],
        surname: [''],
        addressLine1: [''],
        addressLine2: [''],
        addressLine3: [''],
        addressLine4: [''],
        addressLine5: [''],
        postcode: [''],
        phoneNumber: [''],
        mobileNumber: [''],
        emailAddress: [''],
      }),

      organisation: this.fb.group({
        name: [''],
        addressLine1: [''],
        addressLine2: [''],
        addressLine3: [''],
        addressLine4: [''],
        addressLine5: [''],
        postcode: [''],
        phoneNumber: [''],
        mobileNumber: [''], // include to match template
        emailAddress: [''],
      }),

      // (other unrelated fields left as-is)
      lodgementDate: [''],
      applicationCode: [''],
      applicationTitle: [''],
      courtName: [''],
      organisationName: [''],
      feeStatus: [''],
      feeStatusDate: [''],
      paymentRef: [''],
      caseReference: [''],
      accountReference: [''],
      applicationDetails: [''],
      resultCode: [''],

      mags1Title: [''],
      mags1FirstName: [''],
      mags1Surname: [''],
      mags2Title: [''],
      mags2FirstName: [''],
      mags2Surname: [''],
      mags3Title: [''],
      mags3FirstName: [''],
      mags3Surname: [''],
      officialTitle: [''],
      officialFirstName: [''],
      officialSurname: [''],
    });

    this.form
      .get('applicantEntryType')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onApplicantTypeChanged());

    this.loadEntryAndPatchForm();
  }

  // ——— UI handlers ———
  onSubmit(): void {
    this.formSubmitted = true;
  }

  onCodesSearch(): void {}

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
    switch (this.applicantType) {
      case 'person':
        return !this.personGroup.valid;
      case 'organisation':
        return !this.organisationGroup.valid;
      case 'standardApplicant':
        return !this.selectedStandardApplicantCode;
    }
  }

  get standardApplicantData() {
    const fmt = (iso?: string | null) =>
      iso ? new Date(iso).toLocaleDateString('en-GB') : '—';
    return this.saItems.map((sa) => ({
      code: sa.code ?? '',
      name: sa.name ?? '',
      address: sa.addressLine1 ?? '',
      useFrom: fmt(sa.startDate),
      useTo: fmt(sa.endDate ?? null),
    }));
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

  onErrorItemClick(err: ErrorItem): void {
    if (!err?.href) {
      return;
    }
    const id = err.href.startsWith('#') ? err.href.slice(1) : err.href;

    if (typeof window === 'undefined') {
      return;
    }
    setTimeout(() => {
      const el = document.getElementById(id) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      if (!el) {
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus?.();
      if ('setSelectionRange' in el && typeof el.value === 'string') {
        const end = el.value.length;
        try {
          el.setSelectionRange(end, end);
        } catch {
          /* empty */
        }
      }
    });
  }

  onSaPageChange(p: number): void {
    this.loadStandardApplicants(p, this.saPageSize);
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

  private validateOrganisationSection(): boolean {
    this.organisationFieldErrors = {};
    this.errorSummary = [];

    const o = this.organisationGroup.value as Record<string, unknown>;
    const get = (k: string) => (typeof o[k] === 'string' ? o[k].trim() : '');

    const ids = {
      name: 'org-name',
      address1: 'org-address-line-1',
      postcode: 'org-postcode',
      phone: 'org-phone-number',
      mobile: 'org-mobile-number',
      email: 'org-email-address',
    };

    const add = (id: string, text: string, href: string) => {
      this.organisationFieldErrors[id] = text;
      this.errorSummary.push({ text, href });
    };

    // Required
    if (!get('name')) {
      add(ids.name, 'Enter an organisation name', '#org-name');
    }
    if (!get('addressLine1')) {
      add(ids.address1, 'Enter address line 1', '#org-address-line-1');
    }

    // Optional-but-validated
    const postcode = get('postcode');
    if (postcode && !this.isValidUkPostcode(postcode)) {
      add(
        ids.postcode,
        'Enter a real postcode, like SW1A 1AA',
        '#org-postcode',
      );
    }

    const phone = get('phoneNumber');
    if (phone && !this.isValidPhone(phone)) {
      add(
        ids.phone,
        'Enter a phone number in the correct format',
        '#org-phone-number',
      );
    }

    const mobile = get('mobileNumber');
    if (mobile && !this.isValidPhone(mobile)) {
      add(
        ids.mobile,
        'Enter a mobile number in the correct format',
        '#org-mobile-number',
      );
    }

    const email = get('emailAddress');
    if (email && !this.isValidEmail(email)) {
      add(
        ids.email,
        'Enter an email address in the correct format',
        '#org-email-address',
      );
    }

    return this.errorSummary.length === 0;
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
        next: (pg) => {
          this.saItems = pg.content ?? [];
          this.saTotal = pg.totalElements ?? 0;
          const sizeOfPage = pg.pageSize ?? this.saPageSize;
          this.saTotalPages =
            sizeOfPage > 0
              ? this.saTotal < sizeOfPage
                ? 0
                : Math.ceil(this.saTotal / sizeOfPage)
              : 0;
          console.log('saTotalPages', this.saTotalPages);
          if (this.selectedStandardApplicantCode) {
            this.saSelectedIds = new Set([this.selectedStandardApplicantCode]);
          }
        },
        error: () => {
          this.saItems = [];
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
    Object.values(group.controls).forEach((ctrl) => {
      ctrl.markAsPristine();
      ctrl.markAsUntouched();
      ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  private resetErrors(): void {
    this.personFieldErrors = {};
    this.organisationFieldErrors = {};
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
