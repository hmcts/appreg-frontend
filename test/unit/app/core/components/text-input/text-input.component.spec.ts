import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextInputComponent } from '@components/text-input/text-input.component';

describe('TextInputComponent', () => {
  let fixture: ComponentFixture<TextInputComponent>;
  let component: TextInputComponent;

  const setInput = (name: string, value: unknown, detectChanges = true) => {
    fixture.componentRef.setInput(name, value);
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

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
    expect(component.label()).toBe('');
    expect(component.hint()).toBe('');
    expect(component.idPrefix()).toBe('text-input');
    expect(component.widthClass()).toBe('govuk-input--width-10');
    expect(component.valueState()).toBeNull();
    expect(component.disabledState()).toBe(false);
  });

  it('writeValue sets value without emitting change', () => {
    const onChange = jest.fn<void, [string | null]>();
    const onTouched = jest.fn<void, []>();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    component.writeValue('hello');
    expect(component.valueState()).toBe('hello');
    expect(onChange).not.toHaveBeenCalled();
    expect(onTouched).not.toHaveBeenCalled();

    component.writeValue(null);
    expect(component.valueState()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('setDisabledState toggles disabled flag', () => {
    component.setDisabledState(true);
    expect(component.disabledState()).toBe(true);
    component.setDisabledState(false);
    expect(component.disabledState()).toBe(false);
  });

  it('onInput updates value and calls onChange with the new string', () => {
    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    const evt = { target: { value: 'abc' } } as unknown as Event;
    component.onInput(evt);

    expect(component.valueState()).toBe('abc');
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
    localFixture.componentRef.setInput('label', 'Name');
    localFixture.componentRef.setInput('hint', 'Enter your full name');
    localFixture.componentRef.setInput('idPrefix', 'full-name');
    localFixture.componentRef.setInput('widthClass', 'govuk-input--width-20');
    localFixture.detectChanges();

    expect(cmp.label()).toBe('Name');
    expect(cmp.hint()).toBe('Enter your full name');
    expect(cmp.idPrefix()).toBe('full-name');
    expect(cmp.widthClass()).toBe('govuk-input--width-20');
  });

  it('enforces charLimit and truncates emitted value', () => {
    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);
    const typedSpy = jest.spyOn(component.typed, 'emit');

    setInput('charLimit', 5);
    fixture.detectChanges();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.value = '0123456789';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.valueState()).toBe('01234');
    expect(onChange).toHaveBeenLastCalledWith('01234');
    expect(typedSpy).toHaveBeenLastCalledWith('01234');
  });
});
