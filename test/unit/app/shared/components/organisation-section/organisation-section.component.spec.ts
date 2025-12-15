import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { OrganisationSectionComponent } from '../../../../../../src/app/shared/components/organisation-section/organisation-section.component';

type TextInputLike = {
  submitted?: boolean;
  suppressError?: boolean;
  error?: string;
  inputType?: string;
};

describe('OrganisationSectionComponent', () => {
  let component: OrganisationSectionComponent;
  let fixture: ComponentFixture<OrganisationSectionComponent>;
  let group: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, OrganisationSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganisationSectionComponent);
    component = fixture.componentInstance;

    group = new FormGroup({
      name: new FormControl(''),
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

    expect(headings).toContain('Name');
    expect(headings).toContain('Address');
    expect(headings).toContain('Contact details');
  });

  it('renders all expected app-text-input components', () => {
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs).toHaveLength(10);
  });

  it('has a text input bound to the "name" control', () => {
    const nameInput = fixture.debugElement.query(
      By.css('app-text-input[formControlName="name"]'),
    );
    expect(nameInput).toBeTruthy();
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
      'org-name': 'Enter organisation name',
      'org-address-line-1': 'Enter address line 1',
      'org-postcode': 'Enter postcode',
      'org-phone-number': 'Enter phone number',
      'org-mobile-number': 'Enter mobile number',
      'org-email-address': 'Enter email address',
    };
    fixture.detectChanges();

    const nameDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="name"]'),
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

    const nameCmp = nameDebug.componentInstance as TextInputLike;
    const addr1Cmp = addr1Debug.componentInstance as TextInputLike;
    const postcodeCmp = postcodeDebug.componentInstance as TextInputLike;
    const phoneCmp = phoneDebug.componentInstance as TextInputLike;
    const mobileCmp = mobileDebug.componentInstance as TextInputLike;
    const emailCmp = emailDebug.componentInstance as TextInputLike;

    expect(nameCmp.submitted).toBe(true);
    expect(nameCmp.error).toBe('Enter organisation name');
    expect(nameCmp.suppressError).toBe(false);

    expect(addr1Cmp.submitted).toBe(true);
    expect(addr1Cmp.error).toBe('Enter address line 1');
    expect(addr1Cmp.suppressError).toBe(false);

    expect(postcodeCmp.submitted).toBe(true);
    expect(postcodeCmp.error).toBe('Enter postcode');
    expect(postcodeCmp.suppressError).toBe(true);

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
});
