import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { PersonSectionComponent } from '../../../../../../src/app/shared/components/person-section/person-section.component';

type TextInputLike = {
  submitted?: boolean;
  suppressError?: boolean;
  error?: string;
  inputType?: string;
};

type SelectInputLike = {
  options?: { value: string; label: string }[];
};

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
    expect(selectInputs).toHaveLength(1);
  });

  it('renders all expected app-text-input components', () => {
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs).toHaveLength(12);
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

  it('passes submitted, suppressError and error inputs down to relevant text inputs', () => {
    component.submitted = true;
    component.errors = {
      'person-first-name': 'Enter first name',
      'person-surname': 'Enter surname',
      'person-address-line-1': 'Enter address line 1',
      'person-postcode': 'Enter postcode',
      'person-phone-number': 'Enter phone number',
      'person-mobile-number': 'Enter mobile number',
      'person-email-address': 'Enter email address',
    };

    fixture.detectChanges();

    const firstNameDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="firstName"]'),
    );
    const surnameDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="surname"]'),
    );
    const addr1Debug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="addressLine1"]'),
    );
    const postcodeDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="postcode"]'),
    );
    const phoneDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="phoneNumber"]'),
    );
    const mobileDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="mobileNumber"]'),
    );
    const emailDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="emailAddress"]'),
    );

    const firstNameCmp = firstNameDebug.componentInstance as TextInputLike;
    const surnameCmp = surnameDebug.componentInstance as TextInputLike;
    const addr1Cmp = addr1Debug.componentInstance as TextInputLike;
    const postcodeCmp = postcodeDebug.componentInstance as TextInputLike;
    const phoneCmp = phoneDebug.componentInstance as TextInputLike;
    const mobileCmp = mobileDebug.componentInstance as TextInputLike;
    const emailCmp = emailDebug.componentInstance as TextInputLike;

    expect(firstNameCmp.submitted).toBe(true);
    expect(firstNameCmp.error).toBe('Enter first name');
    expect(firstNameCmp.suppressError).toBe(false);

    expect(surnameCmp.submitted).toBe(true);
    expect(surnameCmp.error).toBe('Enter surname');
    expect(surnameCmp.suppressError).toBe(false);

    // Address section: addressLine1 suppressError = false, postcode = true
    expect(addr1Cmp.submitted).toBe(true);
    expect(addr1Cmp.error).toBe('Enter address line 1');
    expect(addr1Cmp.suppressError).toBe(false);

    expect(postcodeCmp.submitted).toBe(true);
    expect(postcodeCmp.error).toBe('Enter postcode');
    expect(postcodeCmp.suppressError).toBe(true);

    // Contact section: all suppressError = true
    expect(phoneCmp.submitted).toBe(true);
    expect(phoneCmp.error).toBe('Enter phone number');
    expect(phoneCmp.suppressError).toBe(true);

    expect(mobileCmp.submitted).toBe(true);
    expect(mobileCmp.error).toBe('Enter mobile number');
    expect(mobileCmp.suppressError).toBe(true);

    expect(emailCmp.submitted).toBe(true);
    expect(emailCmp.error).toBe('Enter email address');
    expect(emailCmp.suppressError).toBe(true);
  });

  it('configures inputType correctly for phone, mobile and email inputs', () => {
    const phoneDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="phoneNumber"]'),
    );
    const mobileDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="mobileNumber"]'),
    );
    const emailDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="emailAddress"]'),
    );

    const phoneCmp = phoneDebug.componentInstance as TextInputLike;
    const mobileCmp = mobileDebug.componentInstance as TextInputLike;
    const emailCmp = emailDebug.componentInstance as TextInputLike;

    expect(phoneCmp.inputType).toBe('tel');
    expect(mobileCmp.inputType).toBe('tel');
    expect(emailCmp.inputType).toBe('email');
  });

  it('passes titleOptions to the title select input', () => {
    const selectDebug = fixture.debugElement.query(
      By.css('app-select-input[formControlName="title"]'),
    );
    const selectCmp = selectDebug.componentInstance as SelectInputLike;

    expect(selectCmp.options).toEqual(component.titleOptions);
  });
});
