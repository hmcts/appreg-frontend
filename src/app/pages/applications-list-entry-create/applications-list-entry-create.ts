/* 
Applications List Entry – Create (/applications-list/:id/create)

Functionality:
  - Creates application list entry payload
    - Validate against DTO
    - Conform valid data to existing types/DTOs
  - Run POST query with payload
*/

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { AddressInputComponent } from '../../shared/components/address-input/address-input.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { EmailInputComponent } from '../../shared/components/email-input/email-input.component';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
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
    AddressInputComponent,
    PhoneInputComponent,
    EmailInputComponent
  ],
  templateUrl: './applications-list-entry-create.html',
})
export class ApplicationsListEntryCreate implements OnInit {
  id: string = '';
  step: ApplicantStep = 'select';

  submitted: boolean = false;
  errorFound: boolean = false;

  constructor(private readonly route: ActivatedRoute) {}

  form = new FormGroup({
    applicant: new FormControl<string | null>('org', {
      nonNullable: false,
    }), // Organisation is set as default (same as old app)
    phone: new FormControl<string | null>(null),
    email: new FormControl<string | null>(null)
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
    this.errorFound = true;

    // TODO: run post request
    // console.log('submit happened');
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
  }

  onBack(): void {
    this.step = 'select';
  }

  buildReturnLink(): { label: string; link: string } {
    return { label: 'Back to list', link: `/applications-list/${this.id}` };
  }
}
