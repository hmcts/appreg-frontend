import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import {
  Applicant,
  ApplicationListEntriesApi,
  ContactDetails,
  EntryGetDetailDto,
  FullName,
  Organisation,
  Person,
} from '../../../generated/openapi';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { ErrorSummaryComponent } from '../../shared/components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '../../shared/components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '../../shared/components/person-section/person-section.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { TableColumn } from '../../shared/components/selectable-sortable-table/selectable-sortable-table.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { MojButtonMenuDirective } from '../../shared/util/moj-button-menu';

type ErrorSummaryItem = { text: string; href?: string };

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
    SortableTableComponent,
    TextInputComponent,
    DateInputComponent,
    ErrorSummaryComponent,
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

  constructor(
    private readonly fb: FormBuilder,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly entriesApi: ApplicationListEntriesApi,
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
      .subscribe({
        next: (dto) => this.hydrateFromDto(dto),
        error: (err) => this.handleFatalLoadError(err),
      });
  }

  private hydrateFromDto(dto: EntryGetDetailDto): void {
    // Prefer Standard Applicant if a code is present
    const sa = (dto.standardApplicantCode ?? '').toString().trim();
    if (sa) {
      this.setApplicantType('standardApplicant');
      // Clear any stale typed data (if navigating back from a different type)
      this.personGroup.reset({});
      this.organisationGroup.reset({});
      return;
    }

    const a: Applicant | undefined = dto.applicant;
    if (a?.person) {
      this.setApplicantType('person');
      this.patchPerson(a.person);
      return;
    }
    if (a?.organisation) {
      this.setApplicantType('organisation');
      this.patchOrganisation(a.organisation);
      return;
    }
  }

  private setApplicantType(
    type: 'person' | 'organisation' | 'standardApplicant',
  ): void {
    this.form.patchValue({ applicantEntryType: type });
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

    const makeItems = (
      ...lines: (string | undefined)[]
    ): ErrorSummaryItem[] =>
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

    // Move focus to the error summary for accessibility (no unnecessary assertions)
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
