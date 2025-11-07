/* 
Applications List Entry – Create (/applications-list/:id/create)

Functionality:
  - Creates application list entry payload
    - Validate against DTO
    - Conform valid data to existing types/DTOs
  - Run POST query with payload
*/

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import {
  Applicant,
  ApplicationCodeGetSummaryDto,
  ApplicationListEntriesApi,
  EntryCreateDto,
  FeeStatus,
  Respondent,
} from '../../../generated/openapi';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { RadioButtonComponent } from '../../shared/components/radio-button/radio-button.component';

type ApplicantStep = 'select' | 'person' | 'org' | 'standard';

@Component({
  selector: 'app-applications-list-entry-create',
  standalone: true,
  imports: [
    BreadcrumbsComponent,
    RadioButtonComponent,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './applications-list-entry-create.html',
})
export class ApplicationsListEntryCreate implements OnInit {
  id: string = '';
  step: ApplicantStep = 'select';

  createDone: boolean = false;

  submitted: boolean = false;
  errorFound: boolean = false;

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
          console.log(err);
          this.errorFound = true;
        },
      });
  }

  onNext(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    const v = this.form.get('applicantType')!.value;
    this.step = v; // 'person' | 'org' | 'standard'
    this.errorFound = false;
  }

  onBack(): void {
    this.step = 'select';
    this.errorFound = false;
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
