import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { RadioButtonComponent } from '@components/radio-button/radio-button.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RadioButtonComponent],
  template: `
    <form [formGroup]="form">
      <app-radio-group
        formControlName="hasEntries"
        legend="Which lists to show"
        [options]="options"
      />
    </form>
  `,
})
class RadioFormHostComponent {
  form = new FormGroup({ hasEntries: new FormControl<boolean | null>(null) });
  options = [
    { label: 'Show empty lists only', value: false },
    { label: 'Show populated lists only', value: true },
    { label: 'Show both populated and empty lists', value: null },
  ];
}

function isCva(x: unknown): x is { writeValue: (v: string | null) => void } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'writeValue' in x &&
    typeof x.writeValue === 'function'
  );
}

describe('RadioButtonComponent', () => {
  let fixture: ComponentFixture<RadioButtonComponent>;
  let component: RadioButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadioButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RadioButtonComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('idPrefix', 'choice');
    fixture.componentRef.setInput('legend', 'Pick one');
    fixture.componentRef.setInput('options', [
      { value: 'A', label: 'Alpha' },
      { value: 'B', label: 'Bravo', hint: 'Second option hint' },
      { value: 'C', label: 'Charlie', disabled: true },
    ]);
  });

  function el<K extends HTMLElement = HTMLElement>(selector: string): K | null {
    return fixture.debugElement.nativeElement.querySelector(
      selector,
    ) as K | null;
  }
  function els<K extends Element = Element>(selector: string): NodeListOf<K> {
    return fixture.debugElement.nativeElement.querySelectorAll(
      selector,
    ) as NodeListOf<K>;
  }
  function radios(): NodeListOf<HTMLInputElement> {
    return els<HTMLInputElement>('input.govuk-radios__input[type="radio"]');
  }
  function fieldset(): HTMLFieldSetElement {
    return el<HTMLFieldSetElement>('fieldset') as HTMLFieldSetElement;
  }

  it('renders legend, radios, and labels in order', () => {
    fixture.detectChanges();

    expect(component.legend()).toBe('Pick one');

    const legendH1 = el<HTMLHeadingElement>('legend');
    expect(legendH1?.textContent?.trim()).toBe('Pick one');

    const labelNodes = els<HTMLLabelElement>('label.govuk-radios__label');
    const labels = Array.from(labelNodes).map((n) => n.textContent?.trim());
    expect(labels).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('applies id/for using idPrefix and index; falls back name to idPrefix', () => {
    fixture.componentRef.setInput('name', undefined);
    fixture.detectChanges();

    const r = radios();
    const lbls = els<HTMLLabelElement>('label.govuk-radios__label');

    expect(r[0].id).toBe('choice-1');
    expect(r[1].id).toBe('choice-2');
    expect(r[2].id).toBe('choice-3');

    expect(lbls[0].getAttribute('for')).toBe('choice-1');
    expect(lbls[1].getAttribute('for')).toBe('choice-2');
    expect(lbls[2].getAttribute('for')).toBe('choice-3');

    expect(Array.from(r).every((input) => input.name === 'choice')).toBe(true);
  });

  it('uses provided name when set', () => {
    fixture.componentRef.setInput('name', 'customName');
    fixture.detectChanges();

    const r = radios();
    expect(Array.from(r).every((input) => input.name === 'customName')).toBe(
      true,
    );
  });

  it('shows hint and wires aria-describedby to hint id when hint is present', () => {
    fixture.componentRef.setInput('hint', 'Choose wisely');
    fixture.detectChanges();

    const hintEl = el<HTMLElement>('#choice-hint');
    expect(hintEl?.textContent?.trim()).toBe('Choose wisely');

    const fs = fieldset();
    const describedBy = fs.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ').includes('choice-hint')).toBe(true);
  });

  it('shows error and wires aria-describedby to error id when showError=true', () => {
    fixture.componentRef.setInput('showError', true);
    fixture.componentRef.setInput('errorText', 'You must pick one');
    fixture.detectChanges();

    const errEl = el<HTMLElement>('#choice-error');
    expect(errEl?.textContent).toContain('You must pick one');

    const fs = fieldset();
    const describedBy = fs.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ').includes('choice-error')).toBe(true);
  });

  it('combines hint and error in aria-describedby when both are present', () => {
    fixture.componentRef.setInput('hint', 'Choose wisely');
    fixture.componentRef.setInput('showError', true);
    fixture.componentRef.setInput('errorText', 'You must pick one');
    fixture.detectChanges();

    const fs = fieldset();
    const tokens = (fs.getAttribute('aria-describedby') ?? '').split(' ');
    expect(tokens).toEqual(
      expect.arrayContaining(['choice-hint', 'choice-error']),
    );
  });

  it('disables all options when component is disabled', () => {
    component.disabled = true;
    fixture.detectChanges();

    const r = radios();
    expect(Array.from(r).every((input) => input.disabled)).toBe(true);
  });

  it('respects per-option disabled flags', () => {
    component.disabled = false;
    fixture.detectChanges();

    const r = radios();
    expect(r[0].disabled).toBe(false);
    expect(r[1].disabled).toBe(false);
    expect(r[2].disabled).toBe(true);
  });

  it('marks the radio as checked when value matches (via writeValue when available)', () => {
    if (isCva(component)) {
      component.writeValue('B');
    } else {
      (component as unknown as { value: string | null }).value = 'B';
    }
    fixture.detectChanges();

    const r = radios();
    expect(r[1].checked).toBe(true);
    expect(r[0].checked).toBe(false);
    expect(r[2].checked).toBe(false);
  });

  it('updates the selection when a radio is changed (calls onSelect and reflects checked state)', () => {
    fixture.detectChanges();

    const r = radios();
    const second = r[1];

    const onSelectSpy = jest.spyOn(component, 'onSelect');
    second.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(onSelectSpy).toHaveBeenCalledWith('B');

    const r2 = radios();
    expect(r2[1].checked).toBe(true);
  });

  it('renders per-option hint when present', () => {
    fixture.detectChanges();

    const hintNodes = els<HTMLElement>('.govuk-radios__hint');
    const hints = Array.from(hintNodes).map((n) => n.textContent?.trim());
    expect(hints).toContain('Second option hint');
  });

  it('sets the govuk-radios data-module attribute', () => {
    fixture.detectChanges();
    const container = el<HTMLElement>(
      '.govuk-radios[data-module="govuk-radios"]',
    );
    expect(container).toBeTruthy();
  });

  it('applies the inline modifier only when buttonsInline is true', () => {
    fixture.componentRef.setInput('buttonsInline', false);
    fixture.detectChanges();

    const container = el<HTMLElement>('.govuk-radios');
    expect(container?.classList.contains('govuk-radios--inline')).toBe(false);

    fixture.componentRef.setInput('buttonsInline', true);
    fixture.detectChanges();

    expect(container?.classList.contains('govuk-radios--inline')).toBe(true);
  });

  it('applies the supplied grid-column class to the form group', () => {
    fixture.componentRef.setInput(
      'containerWidthClass',
      'govuk-grid-column-one-quarter',
    );
    fixture.detectChanges();

    expect(
      el<HTMLElement>('.govuk-form-group')?.classList.contains(
        'govuk-grid-column-one-quarter',
      ),
    ).toBe(true);
  });
});

describe('RadioButtonComponent with a reactive form', () => {
  it('checks the default option again when the form is reset', async () => {
    await TestBed.configureTestingModule({
      imports: [RadioFormHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(RadioFormHostComponent);
    fixture.detectChanges();

    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(radios[2].checked).toBe(true);

    radios[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.hasEntries.value).toBe(true);
    expect(radios[1].checked).toBe(true);

    fixture.componentInstance.form.reset({ hasEntries: null });
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.hasEntries.value).toBeNull();
    expect(radios[2].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });
});
