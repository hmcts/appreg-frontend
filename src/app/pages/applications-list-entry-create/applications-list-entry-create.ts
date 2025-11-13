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
import { Component, OnInit, TemplateRef } from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import {
  Applicant,
  ApplicationCodeGetSummaryDto,
  ApplicationListEntriesApi,
  EntryCreateDto,
  FeeStatus,
  Respondent,
} from '../../../generated/openapi';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { ApplicationCodeSearchComponent } from '../../shared/components/application-codes-search/application-codes-search.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '../../shared/components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '../../shared/components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '../../shared/components/person-section/person-section.component';
import { RadioButtonComponent } from '../../shared/components/radio-button/radio-button.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '../../shared/util/error-click';
import { MojButtonMenuDirective } from '../../shared/util/moj-button-menu';
import { getProblemText } from '../applications-list/util/delete-status';

type ApplicantStep = 'select' | 'person' | 'org' | 'standard';

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
    RadioButtonComponent,
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
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
  templateUrl: './applications-list-entry-create.html',
})
export class ApplicationsListEntryCreate implements OnInit {
  id: string = '';
  step: ApplicantStep = 'select';

  createDone: boolean = false;
  submitted: boolean = false;
  errorFound: boolean = false;
  errorHint: string = '';
  unpopField: ErrorItem[] = [];
  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly appEntryApi: ApplicationListEntriesApi,
  ) {}

  form = new FormGroup({
    applicantType: new FormControl<'person' | 'org' | 'standard'>('org', {
      nonNullable: true,
    }),
    applicant: new FormControl<Applicant | null>(null),
    standardApplicantCode: new FormControl<string | null>(null),
    applicationCode: new FormControl<string | null>(null),
    respondent: new FormControl<Respondent | null>(null),
    numberOfRespondents: new FormControl<number | null>(null),
    wordingFields: new FormControl<string[] | null>(null),
    feeStatuses: new FormControl<FeeStatus[] | null>(null),
    hasOffsiteFee: new FormControl<boolean | null>(null),
    caseReference: new FormControl<string | null>(null),
    accountNumber: new FormControl<string | null>(null),
    notes: new FormControl<string | null>(null),
    lodgementDate: new FormControl<string | null>(null),
    respondentEntryType: new FormControl<'person' | 'organisation'>(
      'organisation',
      { nonNullable: true },
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

  personForm = new FormGroup({
    title: new FormControl<string>(''),
    firstName: new FormControl<string>('', { nonNullable: true }),
    middleNames: new FormControl<string>('', { nonNullable: true }),
    surname: new FormControl<string>(''),
    addressLine1: new FormControl<string>('', { nonNullable: true }),
    addressLine2: new FormControl<string>(''),
    addressLine3: new FormControl<string>(''),
    addressLine4: new FormControl<string>(''),
    addressLine5: new FormControl<string>(''),
    postcode: new FormControl<string>(''),
    phoneNumber: new FormControl<string>(''),
    mobileNumber: new FormControl<string>(''),
    emailAddress: new FormControl<string>(''),
  });

  organisationForm = new FormGroup(
    {
      name: new FormControl<string>('', { nonNullable: true }),
      addressLine1: new FormControl<string>('', { nonNullable: true }),
      addressLine2: new FormControl<string>(''),
      addressLine3: new FormControl<string>(''),
      addressLine4: new FormControl<string>(''),
      addressLine5: new FormControl<string>(''),
      postcode: new FormControl<string>(''),
      phoneNumber: new FormControl<string>(''),
      mobileNumber: new FormControl<string>(''),
      emailAddress: new FormControl<string>(''),
    },
    { updateOn: 'submit' },
  );

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

    const v = this.form.value;

    // Input validation
    const appCode = this.toOptionalTrimmed(v.applicationCode);
    if (!appCode) {
      this.errorFound = true;
      this.errorHint = 'Application code is required';
      this.unpopField.push({
        text: 'Enter an application code',
        href: '#app-code-code',
        id: 'app-code-code',
      });
      return;
    }

    if (this.unpopField.length > 0) {
      this.errorFound = true;
      this.errorHint = 'There is a problem';
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

  onCodeSelected(row: ApplicationCodeGetSummaryDto): void {
    this.form.patchValue({ applicationCode: row.applicationCode });
  }

  private buildEntryCreateDto(): EntryCreateDto {
    const v = this.form.value;
    const applicationCode = this.toOptionalTrimmed(v.applicationCode)!;

    const dto: EntryCreateDto = {
      applicationCode,
      respondent: this.buildRespondent() ?? undefined,
      numberOfRespondents: v.numberOfRespondents ?? undefined,
      wordingFields: this.buildWordingFields() ?? undefined,
      feeStatuses: this.buildFeeStatuses() ?? undefined,
      hasOffsiteFee: v.hasOffsiteFee ?? undefined,
      caseReference: this.toOptionalTrimmed(v.caseReference),
      accountNumber: this.toOptionalTrimmed(v.accountNumber),
      notes: this.toOptionalTrimmed(v.notes),
      lodgementDate: this.toOptionalTrimmed(v.lodgementDate),
    };

    if (v.applicantType === 'standard') {
      dto.standardApplicantCode = this.toOptionalTrimmed(
        v.standardApplicantCode,
      );
    } else {
      dto.applicant = this.buildApplicant();
    }

    return dto;
  }

  private buildApplicant(): Applicant | undefined {
    const type = this.form.value.applicantType;

    if (type === 'person') {
      const pf = this.personForm.value;
      if (!this.hasRequiredPerson(pf)) {
        return undefined;
      }

      return {
        person: {
          name: {
            title: this.toOptionalTrimmed(pf.title),
            firstForename: pf.firstName!.trim(),
            secondForename: this.toOptionalTrimmed(pf.middleNames),
            surname: pf.surname!.trim(),
          },
          contactDetails: {
            addressLine1: pf.addressLine1!.trim(),
            addressLine2: this.toOptionalTrimmed(pf.addressLine2),
            addressLine3: this.toOptionalTrimmed(pf.addressLine3),
            addressLine4: this.toOptionalTrimmed(pf.addressLine4),
            addressLine5: this.toOptionalTrimmed(pf.addressLine5),
            postcode: this.toOptionalTrimmed(pf.postcode),
            phone: this.toOptionalTrimmed(pf.phoneNumber),
            mobile: this.toOptionalTrimmed(pf.mobileNumber),
            email: this.toOptionalTrimmed(pf.emailAddress),
          },
        },
      };
    }

    if (type === 'org') {
      const of = this.organisationForm.value;
      if (!this.hasRequiredOrg(of)) {
        return undefined;
      }

      return {
        organisation: {
          name: of.name!.trim(),
          contactDetails: {
            addressLine1: of.addressLine1!.trim(),
            addressLine2: this.toOptionalTrimmed(of.addressLine2),
            addressLine3: this.toOptionalTrimmed(of.addressLine3),
            addressLine4: this.toOptionalTrimmed(of.addressLine4),
            addressLine5: this.toOptionalTrimmed(of.addressLine5),
            postcode: this.toOptionalTrimmed(of.postcode),
            phone: this.toOptionalTrimmed(of.phoneNumber),
            email: this.toOptionalTrimmed(of.emailAddress),
          },
        },
      };
    }

    return undefined;
  }

  private buildRespondent(): Respondent | undefined {
    const t = this.form.value.respondentEntryType;
    if (!t) {
      return undefined;
    }

    if (t === 'person') {
      const pf = this.personForm.value;
      if (!this.hasRequiredPerson(pf)) {
        return undefined;
      }

      return {
        person: {
          name: {
            title: this.toOptionalTrimmed(pf.title),
            firstForename: pf.firstName!.trim(),
            secondForename: this.toOptionalTrimmed(pf.middleNames),
            surname: pf.surname!.trim(),
          },
          contactDetails: {
            addressLine1: pf.addressLine1!.trim(),
            addressLine2: this.toOptionalTrimmed(pf.addressLine2),
            addressLine3: this.toOptionalTrimmed(pf.addressLine3),
            addressLine4: this.toOptionalTrimmed(pf.addressLine4),
            addressLine5: this.toOptionalTrimmed(pf.addressLine5),
            postcode: this.toOptionalTrimmed(pf.postcode),
            phone: this.toOptionalTrimmed(pf.phoneNumber),
            mobile: this.toOptionalTrimmed(pf.mobileNumber),
            email: this.toOptionalTrimmed(pf.emailAddress),
          },
        },
      };
    }

    if (t === 'organisation') {
      const of = this.organisationForm.value;
      if (!this.hasRequiredOrg(of)) {
        return undefined;
      }

      return {
        organisation: {
          name: of.name!.trim(),
          contactDetails: {
            addressLine1: of.addressLine1!.trim(),
            addressLine2: this.toOptionalTrimmed(of.addressLine2),
            addressLine3: this.toOptionalTrimmed(of.addressLine3),
            addressLine4: this.toOptionalTrimmed(of.addressLine4),
            addressLine5: this.toOptionalTrimmed(of.addressLine5),
            postcode: this.toOptionalTrimmed(of.postcode),
            phone: this.toOptionalTrimmed(of.phoneNumber),
            email: this.toOptionalTrimmed(of.emailAddress),
          },
        },
      };
    }

    return undefined;
  }

  private buildFeeStatuses(): FeeStatus[] | undefined {
    const paymentStatus = this.toOptionalTrimmed(this.form.value.feeStatus);
    const statusDate = this.toOptionalTrimmed(this.form.value.feeStatusDate);
    const paymentRef = this.toOptionalTrimmed(this.form.value.paymentRef);

    if (!paymentStatus && !statusDate && !paymentRef) {
      return undefined;
    }

    const item = {
      paymentStatus,
      statusDate,
      paymentReference: paymentRef,
    } as FeeStatus;

    return [item];
  }

  private buildWordingFields(): string[] | undefined {
    const courtName = this.toOptionalTrimmed(this.form.value.courtName);
    const orgName = this.toOptionalTrimmed(this.form.value.organisationName);
    return this.compactStrings([courtName, orgName]);
  }

  // Helpers
  toOptionalTrimmed = (
    input: string | null | undefined,
  ): string | undefined => {
    const s = input?.trim();
    return s || undefined;
  };

  toOptional = <T>(value: T | null | undefined): T | undefined =>
    value ?? undefined;

  compactStrings = (
    values: (string | null | undefined)[],
  ): string[] | undefined => {
    const out = values.map((v) => v?.trim()).filter((v): v is string => !!v);
    return out.length ? out : undefined;
  };

  private hasRequiredPerson(pf: typeof this.personForm.value): boolean {
    return !!(
      this.toOptionalTrimmed(pf.firstName) &&
      this.toOptionalTrimmed(pf.surname) &&
      this.toOptionalTrimmed(pf.addressLine1)
    );
  }

  private hasRequiredOrg(of: typeof this.organisationForm.value): boolean {
    return !!(
      this.toOptionalTrimmed(of.name) && this.toOptionalTrimmed(of.addressLine1)
    );
  }
}
