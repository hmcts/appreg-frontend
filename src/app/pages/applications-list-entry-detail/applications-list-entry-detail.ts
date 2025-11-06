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
import { SortableTableComponent, TableColumn } from '../../shared/components/sortable-table/sortable-table.component';
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

  entryTypeOptions = [
    { value: 'Person', label: 'Person' },
    { value: 'Organisation', label: 'Organisation' },
    { value: 'Standard Applicant', label: 'Standard Applicant' },
  ];

  personTitleOptions = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Dr', label: 'Dr' },
    { value: 'Other', label: 'Other' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // existing appListId resolution (unchanged)
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

    // NEW: build the form
    this.form = this.fb.group({
      entryType: ['Organisation'],
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
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;
  }

  onCodesSearch(): void {

  }

  get personGroup(): FormGroup {
    return this.form.get('person') as FormGroup;
  }

  get organisationGroup(): FormGroup {
    return this.form.get('organisation') as FormGroup;
  }
}
