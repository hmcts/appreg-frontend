import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SelectInputComponent } from '@components/select-input/select-input.component';

describe('SelectInputComponent', () => {
  let fixture: ComponentFixture<SelectInputComponent>;
  let component: SelectInputComponent;

  const baseOptions = [
    { value: 'choose', label: 'Choose an option' },
    { value: 'A', label: 'Option A' },
    { value: 'B', label: 'Option B' },
  ];

  function getGroup() {
    return fixture.debugElement.query(By.css('.govuk-form-group'));
  }
  function getSelect(): HTMLSelectElement {
    return fixture.debugElement.query(By.css('select.govuk-select'))
      .nativeElement as HTMLSelectElement;
  }
  function getError() {
    return fixture.debugElement.query(By.css('.govuk-error-message'));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectInputComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('idPrefix', 'my-select');
    fixture.componentRef.setInput('options', [
      { value: 'choose', label: 'Choose an option' },
      { value: 'A', label: 'Option A' },
      { value: 'B', label: 'Option B' },
    ]);
    component.value = 'choose';
    fixture.componentRef.setInput('submitted', false);
    component.disabled = false;
    fixture.detectChanges();
  });

  it('renders label and hint when provided', () => {
    fixture.componentRef.setInput('label', 'Court');
    fixture.componentRef.setInput('hint', 'Select a court');
    fixture.detectChanges();

    const labelEl = fixture.debugElement.query(By.css('label.govuk-label'));
    const hintEl = fixture.debugElement.query(By.css('#my-select-hint'));
    expect(labelEl.nativeElement.textContent.trim()).toBe('Court');
    expect(hintEl.nativeElement.textContent.trim()).toBe('Select a court');
  });

  it('shows required error with label text when submitted and value missing', () => {
    fixture.componentRef.setInput('label', 'Court');
    component.value = '';
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();

    const err = getError();
    expect(err).toBeTruthy();
    expect(err.nativeElement.textContent.replace(/\s+/g, ' ').trim()).toContain(
      'Court is required',
    );

    const group = getGroup();
    expect(group.nativeElement.classList).toContain('govuk-form-group--error');
    expect(getSelect().classList).toContain('govuk-select--error');
  });

  it('shows required error with fallback label when label is absent', () => {
    fixture.componentRef.setInput('label', '');
    component.value = '';
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();

    const err = getError();
    expect(err).toBeTruthy();
    expect(err.nativeElement.textContent.replace(/\s+/g, ' ').trim()).toContain(
      'This field is required',
    );
  });

  it('treats empty sentinel as invalid when submitted', () => {
    fixture.componentRef.setInput('idPrefix', 'my-select');
    fixture.componentRef.setInput('options', [
      { value: '', label: 'Choose…' },
      { value: 'A', label: 'A' },
    ]);
    component.value = '';
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();
    expect(getError()).toBeTruthy();
  });

  it('hides error and error classes when value valid', () => {
    fixture.componentRef.setInput('submitted', true);
    component.value = 'A';
    fixture.detectChanges();

    expect(getError()).toBeFalsy();
    expect(getGroup().nativeElement.classList).not.toContain(
      'govuk-form-group--error',
    );
    expect(getSelect().classList).not.toContain('govuk-select--error');
  });

  it('computes aria-describedby correctly: hint only', () => {
    fixture.componentRef.setInput('hint', 'Pick one');
    fixture.componentRef.setInput('submitted', false);
    component.value = 'A'; // valid
    fixture.detectChanges();

    const describedBy = getSelect().getAttribute('aria-describedby');
    expect(describedBy).toBe('my-select-hint');
  });

  it('computes aria-describedby correctly: hint + error', () => {
    fixture.componentRef.setInput('idPrefix', 'my-select');
    fixture.componentRef.setInput('hint', 'Pick one');
    fixture.componentRef.setInput('options', [
      { value: '', label: 'Choose…' },
      { value: 'A', label: 'A' },
    ]);
    component.value = ''; // keep invalid
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();

    expect(getSelect().getAttribute('aria-describedby')).toBe(
      'my-select-hint my-select-error',
    );
  });

  it('computes aria-describedby correctly: error only (no hint)', () => {
    fixture.componentRef.setInput('hint', '');
    fixture.componentRef.setInput('submitted', true);
    component.value = ''; // invalid
    fixture.detectChanges();

    const describedBy = getSelect().getAttribute('aria-describedby');
    expect(describedBy).toBe('my-select-error');
  });

  it('forwards disabled and id/name attributes', () => {
    component.disabled = true;
    fixture.detectChanges();

    const sel = getSelect();
    expect(sel.disabled).toBe(true);
    expect(sel.getAttribute('id')).toBe('my-select');
    expect(sel.getAttribute('name')).toBe('my-select');
  });

  it('renders options and selected value', () => {
    fixture.detectChanges();
    const sel = getSelect();
    const opts = Array.from(sel.querySelectorAll('option'));
    expect(opts).toHaveLength(baseOptions.length);
    expect(opts.map((o) => o.textContent?.trim())).toEqual(
      baseOptions.map((o) => o.label),
    );

    component.value = 'B';
    fixture.detectChanges();
    expect(sel.value).toBe('B');
  });

  it('invokes change and blur handlers', () => {
    const sel = getSelect();

    type Handlers = {
      handleChange: (e: Event) => void;
      handleBlur: (e: Event) => void;
    };
    const changeSpy = jest.spyOn(
      component as unknown as Handlers,
      'handleChange',
    );
    const blurSpy = jest.spyOn(component as unknown as Handlers, 'handleBlur');

    sel.value = 'A';
    sel.dispatchEvent(new Event('change'));
    sel.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(blurSpy).toHaveBeenCalledTimes(1);
  });
});
