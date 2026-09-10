import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';

describe('GovukTextareaComponent', () => {
  let component: GovukTextareaComponent;
  let fixture: ComponentFixture<GovukTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GovukTextareaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GovukTextareaComponent);
    component = fixture.componentInstance;

    // Set required inputs up-front
    fixture.componentRef.setInput(
      'control',
      new FormControl<string | null>(''),
    );
    fixture.componentRef.setInput('id', 'change-reason');
    fixture.componentRef.setInput('name', 'reason');
    fixture.componentRef.setInput('ariaDescribedBy', 'change-reason');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders GOV.UK error markup and accessibility attributes when invalid', () => {
    fixture.componentRef.setInput('isInvalid', true);
    fixture.componentRef.setInput(
      'errorMessage',
      'Enter a reason for the change',
    );
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector('.govuk-form-group');
    const error = fixture.nativeElement.querySelector('.govuk-error-message');
    const textarea = fixture.nativeElement.querySelector('textarea');

    expect(group.classList).toContain('govuk-form-group--error');
    expect(error.id).toBe('change-reason-error');
    expect(error.textContent.replace(/\s+/g, ' ').trim()).toBe(
      'Error: Enter a reason for the change',
    );
    expect(textarea.classList).toContain('govuk-textarea--error');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.getAttribute('aria-describedby')).toBe(
      'change-reason change-reason-error',
    );
  });

  it('does not render an error message or error attributes when valid', () => {
    const group = fixture.nativeElement.querySelector('.govuk-form-group');
    const textarea = fixture.nativeElement.querySelector('textarea');

    expect(
      fixture.nativeElement.querySelector('.govuk-error-message'),
    ).toBeNull();
    expect(group.classList).not.toContain('govuk-form-group--error');
    expect(textarea.classList).not.toContain('govuk-textarea--error');
    expect(textarea.getAttribute('aria-invalid')).toBeNull();
    expect(textarea.getAttribute('aria-describedby')).toBe('change-reason');
  });

  it('should get the remaining character count', () => {
    fixture.componentRef.setInput(
      'control',
      new FormControl<string | null>('Rejected for late'),
    );
    fixture.detectChanges();

    const result = component.remainingCharacterCount;

    expect(result).toEqual(
      // default maxCharacterLimit is 2000
      2000 - 'Rejected for late'.length,
    );
  });

  it('should get the remaining character count with custom max character limit', () => {
    fixture.componentRef.setInput(
      'control',
      new FormControl<string | null>('Eagle'),
    );
    fixture.componentRef.setInput('maxCharacterLimit', 200);
    fixture.detectChanges();

    const result = component.remainingCharacterCount;

    expect(result).toEqual(195);
  });

  it('should get the remaining character count for an empty form control', () => {
    fixture.componentRef.setInput(
      'control',
      new FormControl<string | null>(null),
    );
    fixture.componentRef.setInput('maxCharacterLimit', 200);
    fixture.detectChanges();

    const result = component.remainingCharacterCount;

    expect(result).toEqual(200);
  });

  it.each([
    {
      value: 'abc',
      maxCharacterLimit: 5,
      expected: 'You have 2 characters remaining',
    },
    {
      value: 'abcd',
      maxCharacterLimit: 5,
      expected: 'You have 1 character remaining',
    },
    {
      value: 'abcdef',
      maxCharacterLimit: 5,
      expected:
        'You have 0 characters remaining. Please remove 1 characters before submitting.',
    },
  ])(
    'returns the correct character-limit text',
    ({ value, maxCharacterLimit, expected }) => {
      fixture.componentRef.setInput(
        'control',
        new FormControl<string | null>(value),
      );
      fixture.componentRef.setInput('maxCharacterLimit', maxCharacterLimit);
      fixture.detectChanges();

      expect(component.charLimitText).toBe(expected);
    },
  );
});
