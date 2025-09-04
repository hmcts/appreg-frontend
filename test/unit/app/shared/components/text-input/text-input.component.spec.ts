import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextInputComponent } from '../../../../../../src/app/shared/components/text-input/text-input.component';

describe('TextInputComponent', () => {
  let fixture: ComponentFixture<TextInputComponent>;
  let component: TextInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextInputComponent], // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(TextInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates with sensible defaults', () => {
    expect(component).toBeTruthy();
    expect(component.label).toBe('');
    expect(component.hint).toBe('');
    expect(component.idPrefix).toBe('text-input');
    expect(component.widthClass).toBe('govuk-input--width-10');
    expect(component.value).toBeNull();
    expect(component.disabled).toBe(false);
  });

  it('writeValue sets value without emitting change', () => {
    const onChange = jest.fn<void, [string | null]>();
    const onTouched = jest.fn<void, []>();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    component.writeValue('hello');
    expect(component.value).toBe('hello');
    expect(onChange).not.toHaveBeenCalled();
    expect(onTouched).not.toHaveBeenCalled();

    component.writeValue(null);
    expect(component.value).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('setDisabledState toggles disabled flag', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

  it('onInput updates value and calls onChange with the new string', () => {
    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    const evt = { target: { value: 'abc' } } as unknown as Event;
    component.onInput(evt);

    expect(component.value).toBe('abc');
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('registerOnTouched stores callback (invoked manually)', () => {
    const onTouched = jest.fn<void, []>();
    component.registerOnTouched(onTouched);

    // Component doesn’t call onTouched internally; invoke to verify wiring.
    (component as unknown as { onTouched: () => void }).onTouched();
    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('accepts input bindings (label/hint/idPrefix/widthClass) before init', () => {
    const localFixture = TestBed.createComponent(TextInputComponent);
    const cmp = localFixture.componentInstance;
    cmp.label = 'Name';
    cmp.hint = 'Enter your full name';
    cmp.idPrefix = 'full-name';
    cmp.widthClass = 'govuk-input--width-20';
    localFixture.detectChanges();

    expect(cmp.label).toBe('Name');
    expect(cmp.hint).toBe('Enter your full name');
    expect(cmp.idPrefix).toBe('full-name');
    expect(cmp.widthClass).toBe('govuk-input--width-20');
  });
});
