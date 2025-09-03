import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectInputComponent } from '../../../../../../src/app/shared/components/select-input/select-input.component';

describe('SelectInputComponent', () => {
  let fixture: ComponentFixture<SelectInputComponent>;
  let component: SelectInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectInputComponent], // standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(SelectInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates with sensible defaults', () => {
    expect(component).toBeTruthy();
    expect(component.label).toBe('Select');
    expect(component.hint).toBe('');
    expect(component.idPrefix).toBe('select');
    expect(component.options).toEqual([]);
    expect(component.value).toBeNull();
    expect(component.disabled).toBe(false);
  });

  it('writeValue sets the current value without emitting changes', () => {
    const onChange = jest.fn();
    const onTouched = jest.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    component.writeValue('open');
    expect(component.value).toBe('open');
    expect(onChange).not.toHaveBeenCalled();
    expect(onTouched).not.toHaveBeenCalled();

    component.writeValue(null);
    expect(component.value).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(onTouched).not.toHaveBeenCalled();
  });

  it('setDisabledState toggles disabled flag', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

  it('onSelectChange updates value and calls onChange + onTouched', () => {
    const onChange = jest.fn();
    const onTouched = jest.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    const evt = { target: { value: 'closed' } } as unknown as Event;
    component.onSelectChange(evt);

    expect(component.value).toBe('closed');
    expect(onChange).toHaveBeenCalledWith('closed');
    expect(onTouched).toHaveBeenCalled();
  });

  it('honors options provided by the parent (sanity check)', () => {
    component.options = [
      { value: 'choose', label: 'Choose status' },
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ];
    // No runtime transformation occurs in the class; this just asserts input is accepted
    expect(component.options.map((o) => o.value)).toEqual([
      'choose',
      'open',
      'closed',
    ]);
  });

  it('subsequent selections keep emitting with latest value', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.onSelectChange({ target: { value: 'open' } } as unknown as Event);
    component.onSelectChange({
      target: { value: 'closed' },
    } as unknown as Event);

    expect(onChange).toHaveBeenCalledWith('open');
    expect(onChange).toHaveBeenCalledWith('closed');
    expect(component.value).toBe('closed');
  });
});
