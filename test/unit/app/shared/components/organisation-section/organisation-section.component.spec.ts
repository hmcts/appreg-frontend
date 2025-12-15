import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { OrganisationSectionComponent } from '../../../../../../src/app/shared/components/organisation-section/organisation-section.component';
import {
  addressLine1Missing,
  orgNameMissing,
} from '../../../../../../src/app/shared/constants/err-msgs';
import { validateOptionalContactFields } from '../../../../../../src/app/shared/util/validation';

type TextInputLike = {
  submitted?: boolean;
  suppressError?: boolean;
  error?: string;
  inputType?: string;
};

jest.mock('../../../../../../src/app/shared/util/validation', () => ({
  validateOptionalContactFields: jest.fn(),
}));

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

  describe('OrganisationSectionComponent validate()', () => {
    beforeEach(() => {
      (validateOptionalContactFields as jest.Mock).mockReset();
    });

    function setGroup(values: Record<string, string | undefined>): void {
      component.group = new FormGroup({
        name: new FormControl(values['name']),
        addressLine1: new FormControl(values['addressLine1']),
        postcode: new FormControl(values['postcode']),
        phone: new FormControl(values['phone']),
        mobile: new FormControl(values['mobile']),
        email: new FormControl(values['email']),
      });
    }

    it('resets state and returns valid when required fields are present', () => {
      // Resets
      component.organisationFieldErrors = { 'org-name': 'old' };
      component.errorSummary = [{ text: 'old', href: '#old' }];

      setGroup({ name: 'Org', addressLine1: 'Line 1' });

      const res = component.validate();

      expect(component.organisationFieldErrors).toEqual({});
      expect(component.errorSummary).toEqual([]);
      expect(res).toEqual({ fieldErrors: {}, summaryItems: [], valid: true });

      expect(validateOptionalContactFields).toHaveBeenCalledTimes(1);
    });

    it('adds required errors for missing name and addressLine1 (including hrefs) and sets valid false', () => {
      setGroup({ name: '', addressLine1: undefined });

      const res = component.validate();

      expect(res.valid).toBe(false);

      // field error map
      expect(res.fieldErrors).toMatchObject({
        'org-name': orgNameMissing,
        'org-address-line-1': addressLine1Missing,
      });

      // summary items in the order added by validate()
      expect(res.summaryItems).toEqual([
        { text: orgNameMissing, href: '#org-name' },
        { text: addressLine1Missing, href: '#org-address-line-1' },
      ]);
    });

    it('trims values: whitespace-only required fields are treated as missing', () => {
      setGroup({ name: '   ', addressLine1: '\n\t ' });

      const res = component.validate();

      expect(res.valid).toBe(false);
      expect(res.summaryItems.map((x) => x.href)).toEqual([
        '#org-name',
        '#org-address-line-1',
      ]);
    });

    it('calls validateOptionalContactFields with a get() that trims and an errors accessor for controls', () => {
      setGroup({
        name: ' Org ',
        addressLine1: ' Addr ',
        phone: ' 07123 ',
      });

      component.group.get('phone')?.setErrors({ phoneInvalid: true });

      component.validate();

      const mock = validateOptionalContactFields as jest.Mock;
      const [getFn, errorsFn, ids, addFn] = mock.mock.calls[0] as [
        (k: string) => string,
        (name: string) => unknown,
        Record<string, string>,
        (id: string, text: string, href: string) => void,
      ];

      // trims, undefined -> ''
      expect(getFn('name')).toBe('Org');
      expect(getFn('addressLine1')).toBe('Addr');
      expect(getFn('missingKey')).toBe('');

      // returns errors or null
      expect(errorsFn('phone')).toEqual({ phoneInvalid: true });
      expect(errorsFn('postcode')).toBeNull();

      // ids object includes the expected element ids
      expect(ids).toMatchObject({
        name: 'org-name',
        address1: 'org-address-line-1',
        postcode: 'org-postcode',
        phone: 'org-phone-number',
        mobile: 'org-mobile-number',
        email: 'org-email-address',
      });

      // addFn should push into organisationFieldErrors and errorSummary when invoked
      addFn('org-phone-number', 'Bad phone', '#org-phone-number');

      expect(component.organisationFieldErrors).toMatchObject({
        'org-phone-number': 'Bad phone',
      });
      expect(component.errorSummary).toContainEqual({
        text: 'Bad phone',
        href: '#org-phone-number',
      });
    });
  });
});
