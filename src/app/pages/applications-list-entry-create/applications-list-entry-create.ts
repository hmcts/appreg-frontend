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

  accordionItems: {
    heading: string;
    tpl: TemplateRef<unknown>;
    expanded?: boolean;
  }[] = [];

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

  organisationForm = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true }),
    addressLine1: new FormControl<string>('', { nonNullable: true }),
    addressLine2: new FormControl<string>(''),
    addressLine3: new FormControl<string>(''),
    addressLine4: new FormControl<string>(''),
    addressLine5: new FormControl<string>(''),
    postcode: new FormControl<string>(''),
    phoneNumber: new FormControl<string>(''),
    mobileNumber: new FormControl<string>(''), // <-- ADD to match template
    emailAddress: new FormControl<string>(''),
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
    this.errorFound = false;

    if (!this.form.value.applicationCode) {
      this.errorFound = true;
      this.errorHint = 'There is a problem';
      this.unpopField.push({
        text: 'Application code is required',
        href: '',
        id: '',
      });
      return;
    }

    const body = { listId: this.id, ...this.buildEntryCreateDto() };
    this.appEntryApi
      .createApplicationListEntry({ listId: this.id, entryCreateDto: body })
      .subscribe({
        next: () => {
          this.createDone = true;
        },
        error: (err: HttpErrorResponse) => {
          const msg = getProblemText(err);
          this.submitted = true;
          this.errorFound = true;
          this.errorHint = msg;
        },
      });
  }

  onCodeSelected(row: ApplicationCodeGetSummaryDto): void {
    this.form.patchValue({ applicationCode: row.applicationCode });
  }

  buildReturnLink(): { label: string; link: string } {
    return { label: 'Back to list', link: `/applications-list/${this.id}` };
  }

  private buildEntryCreateDto(): EntryCreateDto {
    const v = this.form.value;

    const dto: EntryCreateDto = {
      applicationCode: v.applicationCode!,
      numberOfRespondents: v.numberOfRespondents ?? undefined,
      wordingFields: v.wordingFields ?? undefined,
      feeStatuses: v.feeStatuses ?? undefined,
      hasOffsiteFee:
        typeof v.hasOffsiteFee === 'boolean' ? v.hasOffsiteFee : undefined,
      caseReference: v.caseReference?.trim() || undefined,
      accountNumber: v.accountNumber?.trim() || undefined,
      notes: v.notes?.trim() || undefined,
      lodgementDate: v.lodgementDate || undefined,
    };

    // applicant
    if (v.applicantType === 'standard') {
      dto.standardApplicantCode = v.standardApplicantCode?.trim() || undefined;
    } else {
      dto.applicant = v.applicant ?? undefined;
    }

    // respondent (from sub-forms)
    const respondent = this.buildRespondent();
    if (respondent) {
      dto.respondent = respondent;
    }

    return dto;
  }

  private buildRespondent(): Respondent | undefined {
    const type = this.form.controls.respondentEntryType.value;

    if (type === 'person') {
      const p = this.personForm.value;
      const hasName = p.firstName?.trim() || p.surname?.trim();
      const hasAddr = p.addressLine1?.trim();

      if (
        !hasName &&
        !hasAddr &&
        !p.emailAddress?.trim() &&
        !p.phoneNumber?.trim() &&
        !p.mobileNumber?.trim()
      ) {
        return undefined;
      }

      return {
        person: {
          name: {
            title: p.title || null,
            firstForename: p.firstName || null,
            secondForename: p.middleNames || null,
            surname: p.surname || null,
          },
          contactDetails: {
            addressLine1: p.addressLine1 || '',
            addressLine2: p.addressLine2 || undefined,
            addressLine3: p.addressLine3 || undefined,
            addressLine4: p.addressLine4 || undefined,
            addressLine5: p.addressLine5 || undefined,
            postcode: p.postcode || undefined,
            phone: p.phoneNumber || undefined,
            mobile: p.mobileNumber || undefined,
            email: p.emailAddress || undefined,
          },
        },
      } as Respondent;
    }

    const o = this.organisationForm.value;
    const hasOrg = o.name?.trim();
    const hasOrgAddr = o.addressLine1?.trim();

    if (
      !hasOrg &&
      !hasOrgAddr &&
      !o.emailAddress?.trim() &&
      !o.phoneNumber?.trim()
    ) {
      return undefined;
    }

    return {
      organisation: {
        name: o.name || '',
        contactDetails: {
          addressLine1: o.addressLine1 || '',
          addressLine2: o.addressLine2 || undefined,
          addressLine3: o.addressLine3 || undefined,
          addressLine4: o.addressLine4 || undefined,
          addressLine5: o.addressLine5 || undefined,
          postcode: o.postcode || undefined,
          phone: o.phoneNumber || undefined,
          email: o.emailAddress || undefined,
        },
      },
    } as Respondent;
  }
}
