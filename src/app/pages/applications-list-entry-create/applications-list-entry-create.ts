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
import {
  Component,
  OnInit,
  TemplateRef,
  forwardRef,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
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
import {
  SortableTableComponent,
} from '../../shared/components/sortable-table/sortable-table.component';
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PersonSectionComponent), // or Organisation
      multi: true,
    },
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
      respondent: v.respondent || undefined,
      numberOfRespondents: v.numberOfRespondents || undefined,
      wordingFields: v.wordingFields || undefined,
      feeStatuses: v.feeStatuses || undefined,
      hasOffsiteFee: v.hasOffsiteFee || undefined,
      caseReference: v.caseReference || undefined,
      accountNumber: v.accountNumber || undefined,
      notes: v.notes || undefined,
      lodgementDate: v.lodgementDate || undefined,
    };

    if (v.applicantType === 'standard') {
      dto.standardApplicantCode = v.standardApplicantCode ?? undefined;
    } else {
      dto.applicant = v.applicant ?? undefined;
    }

    return dto;
  }
}
