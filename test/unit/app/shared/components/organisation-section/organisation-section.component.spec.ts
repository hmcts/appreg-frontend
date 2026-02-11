import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import type { ErrorItem } from '@components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';

type TextInputLike = {
  submitted?: () => boolean;
  suppressError?: () => boolean;
  error?: () => string | null;
  inputType?: () => string;
  idPrefix?: () => string;
};

describe('OrganisationSectionComponent (signals)', () => {
  let fixture: ComponentFixture<OrganisationSectionComponent>;
  let group: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, OrganisationSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganisationSectionComponent);

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

    // REQUIRED signal inputs
    fixture.componentRef.setInput('group', group);
    fixture.componentRef.setInput('scopeId', 'respondent');

    // OPTIONAL signal inputs
    fixture.componentRef.setInput('submitted', false);
    fixture.componentRef.setInput('errors', []);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
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

  it('passes submitted + error text down to relevant text inputs (via ErrorItem[] + errorFor)', () => {
    fixture.componentRef.setInput('submitted', true);

    const errors: ErrorItem[] = [
      {
        href: '#respondent-org-name',
        id: 'name',
        text: 'Enter organisation name',
      },
      {
        href: '#respondent-org-address-line-1',
        id: 'addressLine1',
        text: 'Enter address line 1',
      },
      {
        href: '#respondent-org-postcode',
        id: 'postcode',
        text: 'Enter postcode',
      },
      {
        href: '#respondent-org-phone-number',
        id: 'phoneNumber',
        text: 'Enter phone number',
      },
      {
        href: '#respondent-org-mobile-number',
        id: 'mobileNumber',
        text: 'Enter mobile number',
      },
      {
        href: '#respondent-org-email-address',
        id: 'emailAddress',
        text: 'Enter email address',
      },
    ];

    fixture.componentRef.setInput('errors', errors);
    fixture.detectChanges();

    const nameCmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="name"]'),
    ).componentInstance as TextInputLike;

    const addr1Cmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="addressLine1"]'),
    ).componentInstance as TextInputLike;

    const postcodeCmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="postcode"]'),
    ).componentInstance as TextInputLike;

    const phoneCmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="phoneNumber"]'),
    ).componentInstance as TextInputLike;

    const mobileCmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="mobileNumber"]'),
    ).componentInstance as TextInputLike;

    const emailCmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="emailAddress"]'),
    ).componentInstance as TextInputLike;

    // Name/address required fields: suppressError = false
    expect(nameCmp.submitted?.()).toBe(true);
    expect(nameCmp.error?.()).toBe('Enter organisation name');
    expect(nameCmp.suppressError?.()).toBe(false);

    expect(addr1Cmp.submitted?.()).toBe(true);
    expect(addr1Cmp.error?.()).toBe('Enter address line 1');
    expect(addr1Cmp.suppressError?.()).toBe(false);

    // postcode: suppressError = true
    expect(postcodeCmp.submitted?.()).toBe(true);
    expect(postcodeCmp.error?.()).toBe('Enter postcode');
    expect(postcodeCmp.suppressError?.()).toBe(true);

    // contact fields: suppressError = true
    expect(phoneCmp.submitted?.()).toBe(true);
    expect(phoneCmp.error?.()).toBe('Enter phone number');
    expect(phoneCmp.suppressError?.()).toBe(true);

    expect(mobileCmp.submitted?.()).toBe(true);
    expect(mobileCmp.error?.()).toBe('Enter mobile number');
    expect(mobileCmp.suppressError?.()).toBe(true);

    expect(emailCmp.submitted?.()).toBe(true);
    expect(emailCmp.error?.()).toBe('Enter email address');
    expect(emailCmp.suppressError?.()).toBe(true);
  });

  it('configures inputType correctly for phone, mobile and email inputs', () => {
    const phoneCmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="phoneNumber"]'),
    ).componentInstance as TextInputLike;

    const mobileCmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="mobileNumber"]'),
    ).componentInstance as TextInputLike;

    const emailCmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="emailAddress"]'),
    ).componentInstance as TextInputLike;

    expect(phoneCmp.inputType?.()).toBe('tel');
    expect(mobileCmp.inputType?.()).toBe('tel');
    expect(emailCmp.inputType?.()).toBe('email');
  });

  it('builds idPrefix values using scopeId', () => {
    const nameCmp = fixture.debugElement.query(
      By.css('app-text-input[formControlName="name"]'),
    ).componentInstance as TextInputLike;

    // assumes template uses: [idPrefix]="scopeId() + '-org-name'"
    expect(nameCmp.idPrefix?.()).toBe('respondent-org-name');
  });
});
