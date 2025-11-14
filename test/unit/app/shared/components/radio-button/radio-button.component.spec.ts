import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RadioButtonComponent } from '../../../../../../src/app/shared/components/radio-button/radio-button.component';

function isCva(x: unknown): x is { writeValue: (v: string | null) => void } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'writeValue' in x &&
    typeof (x as { writeValue: unknown }).writeValue === 'function'
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

    component.idPrefix = 'choice';
    component.legend = 'Pick one';
    component.options = [
      { value: 'A', label: 'Alpha' },
      { value: 'B', label: 'Bravo', hint: 'Second option hint' },
      { value: 'C', label: 'Charlie', disabled: true },
    ];
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

    const legendH1 = el<HTMLHeadingElement>('legend h1');
    expect(legendH1?.textContent?.trim()).toBe('Pick one');

    const labelNodes = els<HTMLLabelElement>('label.govuk-radios__label');
    const labels = Array.from(labelNodes).map((n) => n.textContent?.trim());
    expect(labels).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('applies id/for using idPrefix and index; falls back name to idPrefix', () => {
    component.name = undefined;
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
    component.name = 'customName';
    fixture.detectChanges();

    const r = radios();
    expect(Array.from(r).every((input) => input.name === 'customName')).toBe(
      true,
    );
  });

  it('shows hint and wires aria-describedby to hint id when hint is present', () => {
    component.hint = 'Choose wisely';
    fixture.detectChanges();

    const hintEl = el<HTMLElement>('#choice-hint');
    expect(hintEl?.textContent?.trim()).toBe('Choose wisely');

    const fs = fieldset();
    const describedBy = fs.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ').includes('choice-hint')).toBe(true);
  });

  it('shows error and wires aria-describedby to error id when showError=true', () => {
    component.showError = true;
    component.errorText = 'You must pick one';
    fixture.detectChanges();

    const errEl = el<HTMLElement>('#choice-error');
    expect(errEl?.textContent).toContain('You must pick one');

    const fs = fieldset();
    const describedBy = fs.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ').includes('choice-error')).toBe(true);
  });

  it('combines hint and error in aria-describedby when both are present', () => {
    component.hint = 'Choose wisely';
    component.showError = true;
    component.errorText = 'You must pick one';
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
});
