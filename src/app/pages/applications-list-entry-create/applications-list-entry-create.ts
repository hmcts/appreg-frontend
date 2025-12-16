/* 
Applications List Entry – Create (/applications-list/:id/create)

Functionality:
  - Creates application list entry payload
    - Validate against DTO
    - Conform valid data to existing types/DTOs
  - Run POST query with payload
*/

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { buildEntryCreateDto } from './util/entry-create-mapper';
import { toOptionalTrimmed } from './util/helpers';

import { AccordionComponent } from '@components/accordion/accordion.component';
import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import {
  ApplicationNotesForm,
  NOTES_FIELD_MESSAGES,
  NotesSectionComponent,
} from '@components/notes-section/notes-section.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '@components/person-section/person-section.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  Applicant,
  ApplicationCodeGetSummaryDto,
  ApplicationListEntriesApi,
  EntryCreateDto,
  FeeStatus,
  Respondent,
} from '@openapi';
import { ApplicantStep } from '@page-types/applications-list-entry-create';
import {
  ApplicantType,
  ApplicationsListEntryCreateForm,
  OrganisationForm,
  PersonForm,
  RespondentEntryType,
} from '@shared-types/applications-list-entry-create/application-list-entry-create-form';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { ErrorMessageMap, buildFormErrorSummary } from '@util/error-summary';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenuDirective } from '@util/moj-button-menu';

const ALPHANUMERIC_REGEX = '^[A-Za-z0-9]*$';

type BuildFormErrorSummaryFn = (
  form: FormGroup,
  messages: ErrorMessageMap,
  options?: { nested?: { path: string; prefixId?: string }[] },
) => ErrorItem[];

const bf = buildFormErrorSummary as unknown as BuildFormErrorSummaryFn;

export const ENTRY_ERROR_MESSAGES = {
  applicationCode: {
    required: 'Enter an application code',
  },
  ...NOTES_FIELD_MESSAGES,
} as const;

type ChildErrorSource = 'notes' | 'fee' | 'respondent';

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
    DateInputComponent,
    PersonSectionComponent,
    OrganisationSectionComponent,
    NotesSectionComponent,
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
  templateUrl: './applications-list-entry-create.html',
})
export class ApplicationsListEntryCreate implements OnInit {
  route = inject(ActivatedRoute);
  appEntryApi = inject(ApplicationListEntriesApi);

  id: string = '';
  step: ApplicantStep = 'select';

  createDone: boolean = false;
  submitted: boolean = false;
  errorFound: boolean = false;
  errorHint: string = '';
  unpopField: ErrorItem[] = [];

  summaryErrors: ErrorItem[] = [];

  private parentErrors: ErrorItem[] = [];
  private childErrors: Record<ChildErrorSource, ErrorItem[]> = {
    notes: [],
    fee: [],
    respondent: [],
  };

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  form: ApplicationsListEntryCreateForm = new FormGroup({
    applicantType: new FormControl<ApplicantType>('org', { nonNullable: true }),
    applicant: new FormControl<Applicant | null>(null),
    standardApplicantCode: new FormControl<string | null>(null),
    applicationCode: new FormControl<string | null>(null),
    respondent: new FormControl<Respondent | null>(null),
    numberOfRespondents: new FormControl<number | null>(null),
    wordingFields: new FormControl<string[] | null>(null),
    feeStatuses: new FormControl<FeeStatus[] | null>(null),
    hasOffsiteFee: new FormControl<boolean | null>(null),
    applicationNotes: new FormGroup({
      notes: new FormControl<string | null>(null, {
        validators: [Validators.maxLength(4000)],
      }),
      caseReference: new FormControl<string | null>(null, {
        validators: [
          Validators.maxLength(15),
          Validators.pattern(ALPHANUMERIC_REGEX),
        ],
      }),
      accountReference: new FormControl<string | null>(null, {
        validators: [
          Validators.maxLength(20),
          Validators.pattern(ALPHANUMERIC_REGEX),
        ],
      }),
    }) as ApplicationNotesForm,
    lodgementDate: new FormControl<string | null>(null),
    respondentEntryType: new FormControl<RespondentEntryType | null>(
      'organisation',
      {
        nonNullable: true,
      },
    ),
    courtName: new FormControl<string | null>(null),
    organisationName: new FormControl<string | null>(null),
    feeStatus: new FormControl<string | null>(null),
    feeStatusDate: new FormControl<string | null>(null),
    paymentRef: new FormControl<string | null>(null),
    accountReference: new FormControl<string | null>(null),
    applicationDetails: new FormControl<string | null>(null),
    resultCode: new FormControl<string | null>(null),
    mags1Title: new FormControl<string | null>(null),
    mags1FirstName: new FormControl<string | null>(null),
    mags1Surname: new FormControl<string | null>(null),
    mags2Title: new FormControl<string | null>(null),
    mags2FirstName: new FormControl<string | null>(null),
    mags2Surname: new FormControl<string | null>(null),
    mags3Title: new FormControl<string | null>(null),
    mags3FirstName: new FormControl<string | null>(null),
    mags3Surname: new FormControl<string | null>(null),
    officialTitle: new FormControl<string | null>(null),
    officialFirstName: new FormControl<string | null>(null),
    officialSurname: new FormControl<string | null>(null),
  });

  personForm: PersonForm = new FormGroup({
    title: new FormControl<string | null>(null),
    firstName: new FormControl<string>('', { nonNullable: true }),
    middleNames: new FormControl<string>('', { nonNullable: true }),
    surname: new FormControl<string | null>(null),
    addressLine1: new FormControl<string>('', { nonNullable: true }),
    addressLine2: new FormControl<string>('', { nonNullable: true }),
    addressLine3: new FormControl<string>('', { nonNullable: true }),
    addressLine4: new FormControl<string>('', { nonNullable: true }),
    addressLine5: new FormControl<string>('', { nonNullable: true }),
    postcode: new FormControl<string | null>(null),
    phoneNumber: new FormControl<string | null>(null),
    mobileNumber: new FormControl<string | null>(null),
    emailAddress: new FormControl<string | null>(null),
  });

  organisationForm: OrganisationForm = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true }),
    addressLine1: new FormControl<string>('', { nonNullable: true }),
    addressLine2: new FormControl<string>('', { nonNullable: true }),
    addressLine3: new FormControl<string>('', { nonNullable: true }),
    addressLine4: new FormControl<string>('', { nonNullable: true }),
    addressLine5: new FormControl<string>('', { nonNullable: true }),
    postcode: new FormControl<string | null>(null),
    phoneNumber: new FormControl<string | null>(null),
    mobileNumber: new FormControl<string | null>(null),
    emailAddress: new FormControl<string | null>(null),
  });

  applicantOptions = [
    { label: 'Person', value: 'person' },
    { label: 'Organisation', value: 'org' },
    { label: 'Standard Applicant', value: 'standard' },
  ];

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
  }

  onSubmit(e: Event): void {
    e.preventDefault();

    // reset errors
    this.submitted = true;
    this.errorFound = false;
    this.errorHint = '';
    this.unpopField = [];

    //Run Angular validation
    this.form.markAllAsTouched();

    const v = this.form.value;
    const appCode = toOptionalTrimmed(v.applicationCode);

    // Custom rule: application code required
    if (!appCode) {
      this.form.controls.applicationCode.setErrors({
        ...(this.form.controls.applicationCode.errors ?? {}),
        required: true,
      });
    }

    // Build error summary from control errors + child errors
    this.updateAllErrors();

    if (this.errorFound) {
      // Don't submit if we’ve got validation errors
      return;
    }

    const entryCreateDto = this.buildEntryCreateDto();

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

  private buildErrorSummary(): ErrorItem[] {
    return bf(this.form, ENTRY_ERROR_MESSAGES, {
      nested: [{ path: 'applicationNotes', prefixId: 'applicationNotes' }],
    });
  }

  private updateAllErrors(): void {
    this.parentErrors = this.buildErrorSummary();
    const allChildErrors = Object.values(this.childErrors).flat();

    this.summaryErrors = [...this.parentErrors, ...allChildErrors];
    this.errorFound = this.summaryErrors.length > 0;
  }

  onChildErrors(source: ChildErrorSource, errors: ErrorItem[]): void {
    this.childErrors[source] = errors ?? [];
    this.updateAllErrors();
  }

  onCodeSelected(row: ApplicationCodeGetSummaryDto): void {
    this.form.patchValue({ applicationCode: row.applicationCode });
  }

  private buildEntryCreateDto(): EntryCreateDto {
    return buildEntryCreateDto(
      this.form.getRawValue(),
      this.personForm.getRawValue(),
      this.organisationForm.getRawValue(),
    );
  }
}
