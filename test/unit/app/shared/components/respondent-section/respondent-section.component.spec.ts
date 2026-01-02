import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { RespondentSectionComponent } from '@components/respondent-section/respondent-section.component';
import type {
  ApplicationsListEntryForm,
  OrganisationForm,
  PersonForm,
  RespondentEntryType,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';

describe('RespondentSectionComponent', () => {
  let fixture: ComponentFixture<RespondentSectionComponent>;
  let component: RespondentSectionComponent;

  // Minimal runtime forms – only include controls that the rendered templates actually bind to
  const buildMinimalEntryForm = (type: RespondentEntryType) =>
    new FormGroup({
      respondentEntryType: new FormControl<RespondentEntryType | null>(type),
    }) as unknown as ApplicationsListEntryForm;

  const buildMinimalPersonForm = () =>
    new FormGroup({
      title: new FormControl<string | null>(null),
      firstName: new FormControl<string>(''),
      middleNames: new FormControl<string>(''),
      surname: new FormControl<string | null>(null),
      addressLine1: new FormControl<string>(''),
      addressLine2: new FormControl<string>(''),
      addressLine3: new FormControl<string>(''),
      addressLine4: new FormControl<string>(''),
      addressLine5: new FormControl<string>(''),
      postcode: new FormControl<string | null>(null),
      phoneNumber: new FormControl<string | null>(null),
      mobileNumber: new FormControl<string | null>(null),
      emailAddress: new FormControl<string | null>(null),
    }) as unknown as PersonForm;

  const buildMinimalOrganisationForm = () =>
    new FormGroup({
      name: new FormControl<string>(''),
      addressLine1: new FormControl<string>(''),
      addressLine2: new FormControl<string>(''),
      addressLine3: new FormControl<string>(''),
      addressLine4: new FormControl<string>(''),
      addressLine5: new FormControl<string>(''),
      postcode: new FormControl<string | null>(null),
      phoneNumber: new FormControl<string | null>(null),
      mobileNumber: new FormControl<string | null>(null),
      emailAddress: new FormControl<string | null>(null),
    }) as unknown as OrganisationForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RespondentSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RespondentSectionComponent);
    component = fixture.componentInstance;

    const form = buildMinimalEntryForm('person');
    const personGroup = buildMinimalPersonForm();
    const organisationGroup = buildMinimalOrganisationForm();

    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('personGroup', personGroup);
    fixture.componentRef.setInput('organisationGroup', organisationGroup);

    fixture.componentRef.setInput('respondentEntryTypeOptions', [
      { value: 'person', label: 'Person' },
      { value: 'organisation', label: 'Organisation' },
    ]);

    fixture.componentRef.setInput('personTitleOptions', [
      { value: 'mr', label: 'Mr' },
      { value: 'mrs', label: 'Mrs' },
    ]);

    fixture.componentRef.setInput('submitted', false);
    fixture.componentRef.setInput('errorItems', []);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should copy respondentEntryTypeOptions into selectOptions', () => {
    const opts = component.selectOptions();
    expect(opts).toHaveLength(2);
    // computed copy, not same reference
    expect(opts).not.toBe(component.respondentEntryTypeOptions());
  });

  it('should render person section when respondentEntryType is person', () => {
    // Person section should exist
    const person = fixture.debugElement.query(By.css('app-person-section'));
    expect(person).toBeTruthy();

    // Organisation section should not
    const org = fixture.debugElement.query(By.css('app-organisation-section'));
    expect(org).toBeFalsy();
  });

  it('should render organisation section when respondentEntryType switches to organisation', () => {
    const form = component.form();
    form.controls.respondentEntryType.setValue('organisation');
    fixture.detectChanges();

    const person = fixture.debugElement.query(By.css('app-person-section'));
    expect(person).toBeFalsy();

    const org = fixture.debugElement.query(By.css('app-organisation-section'));
    expect(org).toBeTruthy();
  });
});
