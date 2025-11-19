import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { PersonSectionComponent } from '../../../../../../src/app/shared/components/person-section/person-section.component';

describe('PersonSectionComponent', () => {
  let component: PersonSectionComponent;
  let fixture: ComponentFixture<PersonSectionComponent>;
  let group: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, PersonSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonSectionComponent);
    component = fixture.componentInstance;

    group = new FormGroup({
      title: new FormControl(''),
      firstName: new FormControl(''),
      middleNames: new FormControl(''),
      surname: new FormControl(''),
      addressLine1: new FormControl(''),
      addressLine2: new FormControl(''),
      addressLine3: new FormControl(''),
      addressLine4: new FormControl(''),
      addressLine5: new FormControl(''),
      postcode: new FormControl(''),
      phoneNumber: new FormControl(''),
      mobileNumber: new FormControl(''),
      emailAddress: new FormControl(''),
    });

    component.group = group;
    component.titleOptions = [
      { value: 'mr', label: 'Mr' },
      { value: 'mrs', label: 'Mrs' },
      { value: 'dr', label: 'Dr' },
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the provided FormGroup via the "group" input', () => {
    expect(component.group).toBe(group);
  });

  it('renders the section headings', () => {
    const el: HTMLElement = fixture.nativeElement;
    const headings = Array.from(el.querySelectorAll('h3.govuk-heading-m')).map(
      (h) => h.textContent?.trim(),
    );

    expect(headings).toContain('Names');
    expect(headings).toContain('Address');
    expect(headings).toContain('Contact details');
  });

  it('renders one app-select-input for title', () => {
    const selectInputs = fixture.debugElement.queryAll(
      By.css('app-select-input'),
    );
    expect(selectInputs.length).toBe(1);
  });

  it('renders all expected app-text-input components', () => {
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs.length).toBe(12);
  });

  it('has a text input bound to the "firstName" control', () => {
    const firstNameInput = fixture.debugElement.query(
      By.css('app-text-input[formControlName="firstName"]'),
    );
    expect(firstNameInput).toBeTruthy();
  });

  it('has a text input bound to the "postcode" control', () => {
    const postcodeInput = fixture.debugElement.query(
      By.css('app-text-input[formControlName="postcode"]'),
    );
    expect(postcodeInput).toBeTruthy();
  });

  it('has a text input bound to the "emailAddress" control', () => {
    const emailInput = fixture.debugElement.query(
      By.css('app-text-input[formControlName="emailAddress"]'),
    );
    expect(emailInput).toBeTruthy();
  });
});
