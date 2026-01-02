import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import type { ErrorItem } from '@components/error-summary/error-summary.component';
import { PersonSectionComponent } from '@components/person-section/person-section.component';

type TextInputLike = {
  submitted?: boolean;
  suppressError?: boolean;
  error?: string | null;
  inputType?: string;
  idPrefix?: string;
};

type SelectInputLike = {
  options?: { value: string; label: string }[];
  idPrefix?: string;
};

describe('PersonSectionComponent', () => {
  let fixture: ComponentFixture<PersonSectionComponent>;
  let component: PersonSectionComponent;
  let group: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, PersonSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonSectionComponent);
    component = fixture.componentInstance;

    group = new FormGroup({
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
    });

    fixture.componentRef.setInput('group', group);
    fixture.componentRef.setInput('scopeId', 'respondent');
    fixture.componentRef.setInput('titleOptions', [
      { value: 'mr', label: 'Mr' },
      { value: 'mrs', label: 'Mrs' },
      { value: 'dr', label: 'Dr' },
    ]);

    // optional inputs
    fixture.componentRef.setInput('submitted', false);
    fixture.componentRef.setInput('errors', []);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the section headings', () => {
    const headings = fixture.debugElement
      .queryAll(By.css('h3.govuk-heading-m'))
      .map((h) => (h.nativeElement as HTMLElement).textContent?.trim());

    expect(headings).toContain('Names');
    expect(headings).toContain('Address');
    expect(headings).toContain('Contact details');
  });

  it('renders one app-select-input for title and passes titleOptions', () => {
    const selectDebug = fixture.debugElement.query(
      By.css('app-select-input[formControlName="title"]'),
    );
    expect(selectDebug).toBeTruthy();

    const selectCmp = selectDebug.componentInstance as SelectInputLike;
    expect(selectCmp.options).toEqual([
      { value: 'mr', label: 'Mr' },
      { value: 'mrs', label: 'Mrs' },
      { value: 'dr', label: 'Dr' },
    ]);
  });

  it('renders all expected app-text-input components', () => {
    // firstName, middleNames, surname,
    // addressLine1-5 (5),
    // postcode,
    // phoneNumber, mobileNumber, emailAddress  => 12
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs).toHaveLength(12);
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

  it('applies scopeId to idPrefix for inputs (so ids are unique)', () => {
    const firstNameDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="firstName"]'),
    );
    const firstNameCmp = firstNameDebug.componentInstance as TextInputLike;

    // template uses [idPrefix]="scopeId() + '-person-first-name'"
    expect(firstNameCmp.idPrefix).toBe('respondent-person-first-name');

    const selectDebug = fixture.debugElement.query(
      By.css('app-select-input[formControlName="title"]'),
    );
    const selectCmp = selectDebug.componentInstance as SelectInputLike;

    // template uses [idPrefix]="scopeId() + '-person-title'"
    expect(selectCmp.idPrefix).toBe('respondent-person-title');
  });

  it('passes submitted state down to relevant text inputs', () => {
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();

    const firstNameDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="firstName"]'),
    );
    const firstNameCmp = firstNameDebug.componentInstance as TextInputLike;

    expect(firstNameCmp.submitted).toBe(true);
  });

  it('maps ErrorItem.href to per-input error strings (inline errors)', () => {
    const errors: ErrorItem[] = [
      {
        text: 'Enter address line 1',
        href: '#respondent-person-address-line-1',
      },
      {
        text: 'Enter a first name',
        href: '#respondent-person-first-name',
      },
    ];

    fixture.componentRef.setInput('errors', errors);
    fixture.detectChanges();

    const addr1Debug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="addressLine1"]'),
    );
    const addr1Cmp = addr1Debug.componentInstance as TextInputLike;

    const firstNameDebug = fixture.debugElement.query(
      By.css('app-text-input[formControlName="firstName"]'),
    );
    const firstNameCmp = firstNameDebug.componentInstance as TextInputLike;

    expect(addr1Cmp.error).toBe('Enter address line 1');
    expect(firstNameCmp.error).toBe('Enter a first name');
  });

  it('returns null for errorFor when there is no matching ErrorItem', () => {
    fixture.componentRef.setInput('errors', []);
    fixture.detectChanges();

    expect(component.errorFor('respondent-person-first-name')).toBeNull();
  });
});
