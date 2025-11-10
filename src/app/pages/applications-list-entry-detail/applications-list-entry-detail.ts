import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { OrganisationSectionComponent } from '../../shared/components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '../../shared/components/person-section/person-section.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import {
  SortableTableComponent,
  TableColumn,
} from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { MojButtonMenuDirective } from '../../shared/util/moj-button-menu';

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
  ],
  templateUrl: './applications-list-entry-detail.html',
})
export class ApplicationsListEntryDetail implements OnInit {
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
  ) {}

  ngOnInit(): void {
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
        emailAddress: [''],
      }),

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
  }

  onSubmit(): void {
    this.formSubmitted = true;
  }

  onCodesSearch(): void {}

  get personGroup(): FormGroup {
    return this.form.get('person') as FormGroup;
  }

  get organisationGroup(): FormGroup {
    return this.form.get('organisation') as FormGroup;
  }
}
