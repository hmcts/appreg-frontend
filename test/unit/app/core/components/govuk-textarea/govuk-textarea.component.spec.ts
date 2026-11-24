import { Component } from '@angular/core';
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
      'change-reason change-reason-hint change-reason-error',
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
    expect(textarea.getAttribute('aria-describedby')).toBe(
      'change-reason change-reason-hint',
    );
  });

  it('announces the remaining count after typing while focused and stops on blur', () => {
    jest.useFakeTimers();
    try {
      const element = fixture.nativeElement as HTMLElement;
      const textarea = element.querySelector('textarea') as HTMLTextAreaElement;
      const liveRegion = element.querySelector('[aria-live]') as HTMLElement;
      const description = element.querySelector(
        '#change-reason-hint',
      ) as HTMLElement;

      expect(liveRegion.getAttribute('aria-live')).toBe('off');
      expect(description.textContent).toContain(
        'You can enter up to 2000 characters',
      );
      expect(
        element.querySelector('.govuk-hint')?.getAttribute('aria-hidden'),
      ).toBe('true');
      textarea.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');

      textarea.value = 'First';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      jest.advanceTimersByTime(500);
      textarea.value = 'First second';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      jest.advanceTimersByTime(999);
      fixture.detectChanges();
      expect(liveRegion.textContent?.trim()).toBe('');
      jest.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(liveRegion.textContent).toContain(
        'You have 1988 characters remaining',
      );
      expect(description.textContent).toContain(
        'You can enter up to 2000 characters',
      );

      textarea.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(liveRegion.getAttribute('aria-live')).toBe('off');
      expect(liveRegion.textContent?.trim()).toBe('');
    } finally {
      jest.useRealTimers();
    }
  });

  it('announces the current remaining count when a prefilled textarea receives focus', () => {
    jest.useFakeTimers();
    try {
      fixture.componentRef.setInput(
        'control',
        new FormControl<string | null>('Existing notes'),
      );
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const textarea = element.querySelector('textarea') as HTMLTextAreaElement;
      const liveRegion = element.querySelector('[aria-live]') as HTMLElement;

      expect(textarea.value).toBe('Existing notes');
      textarea.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.textContent?.trim()).toBe('');

      jest.advanceTimersByTime(999);
      fixture.detectChanges();
      expect(liveRegion.textContent?.trim()).toBe('');

      jest.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(liveRegion.textContent).toContain(
        'You have 1986 characters remaining',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not render a count or live region when character counting is disabled', () => {
    fixture.componentRef.setInput('characterCountEnabled', false);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#change-reason-hint')).toBeNull();
    expect(element.querySelector('[aria-live]')).toBeNull();
    expect(
      element.querySelector('textarea')?.getAttribute('aria-describedby'),
    ).toBe('change-reason');
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

  it('updates the rendered character count when the user enters text', () => {
    fixture.componentRef.setInput(
      'control',
      new FormControl<string | null>('', { updateOn: 'submit' }),
    );
    fixture.componentRef.setInput('maxCharacterLimit', 200);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const textarea = element.querySelector<HTMLTextAreaElement>('textarea');
    if (!textarea) {
      throw new Error('Expected the textarea to be rendered');
    }

    textarea.value = 'List description';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.govuk-hint')?.textContent,
    ).toContain('You have 184 characters remaining');
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

@Component({
  imports: [GovukTextareaComponent],
  template: `<app-govuk-textarea
    id="description"
    name="description"
    ariaDescribedBy="description-hint"
    label="List description"
    [control]="control"
  />`,
})
class TextareaHost {
  control = new FormControl<string | null>('');
}

describe('GovukTextareaComponent in a template', () => {
  it('assigns the ID only to the native control targeted by the label', async () => {
    await TestBed.configureTestingModule({
      imports: [TextareaHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TextareaHost);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('[id="description"]')).toHaveLength(1);
    expect(element.querySelector('label')?.control).toBe(
      element.querySelector('textarea'),
    );
  });
});
