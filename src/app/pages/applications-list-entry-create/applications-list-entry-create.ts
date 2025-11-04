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

import { ApplicationListEntriesApi } from '../../../generated/openapi';
import { AddressInputComponent } from '../../shared/components/address-input/address-input.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { EmailInputComponent } from '../../shared/components/email-input/email-input.component';
import {
  NameInputComponent,
  NameValue,
} from '../../shared/components/name-input/name-input.component';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { RadioButtonComponent } from '../../shared/components/radio-button/radio-button.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

import { appListEntryCreateParams } from './util/create_params';


type ApplicantStep = 'select' | 'person' | 'org' | 'standard';

@Component({
  selector: 'app-applications-list-entry-create',
  standalone: true,
  imports: [
    BreadcrumbsComponent,
    RadioButtonComponent,
    ReactiveFormsModule,
    RouterModule,
    AddressInputComponent,
    PhoneInputComponent,
    EmailInputComponent,
    TextInputComponent,
    SelectInputComponent,
    NameInputComponent,
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
    applicant: new FormControl<string | null>('org', {
      nonNullable: false,
    }), // Organisation is set as default (same as old app)
    phone: new FormControl<string | null>(null),
    email: new FormControl<string | null>(null),
    orgname: new FormControl<string | null>(null),
    title: new FormControl<string | null>(null),
    name: new FormControl<NameValue | null>(null),
  });

  titleOptions = [
    { label: 'Mr', value: 'mr' },
    { label: 'Mrs', value: 'mrs' },
    { label: 'Miss', value: 'miss' },
    { label: 'Ms', value: 'ms' },
    { label: 'Dr', value: 'dr' },
  ];

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
    // this.errorFound = true;

    if (this.errorFound) {
      return;
    }
  
    // console.log('submit happened');

    const body = { listId: this.id , ...appListEntryCreateParams() };

    this.appEntryApi
    .createApplicationListEntry({ listId: this.id , entryCreateDto: body })
    .subscribe({
      next: () => {
        console.log('happy');
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
    const v = this.form.get('applicant')!.value as Exclude<
      ApplicantStep,
      'select'
    >;
    this.step = v; // 'person' | 'org' | 'standard'
    this.errorFound = false;
  }

  onBack(): void {
    this.step = 'select';
    this.errorFound = false;
  }

  buildReturnLink(): { label: string; link: string } {
    return { label: 'Back to list', link: `/applications-list/${this.id}` };
  }
}
