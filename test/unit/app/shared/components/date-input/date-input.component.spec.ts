import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateInputComponent } from '../../../../../../src/app/shared/components/date-input/date-input.component';


describe('DateInputComponent', () => {
  let fixture: ComponentFixture<DateInputComponent>;
  let component: DateInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateInputComponent], // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with empty, enabled form', () => {
    expect(component).toBeTruthy();
    expect(component.dateForm.disabled).toBe(false); // was toBeFalse()
    expect(component.dateForm.value).toEqual({ day: '', month: '', year: '' });
  });

  it('emits a YYYY-MM-DD value when valid (with padding)', () => {
    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    component.dateForm.setValue({ day: '1', month: '2', year: '2024' });
    expect(onChange).toHaveBeenCalledWith('2024-02-01');
  });

  it('emits null when invalid (empty day)', () => {
    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    component.dateForm.setValue({ day: '', month: '12', year: '2024' });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('emits null when invalid (year not 4 digits)', () => {
    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    component.dateForm.setValue({ day: '10', month: '10', year: '24' });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('writeValue sets controls without emitting', () => {
    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    component.writeValue('2024-02-01'); // emitEvent: false in implementation
    expect(component.dateForm.value).toEqual({ day: '01', month: '02', year: '2024' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('writeValue(null) resets controls without emitting', () => {
    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    component.writeValue('2024-02-01');
    component.writeValue(null);
    expect(component.dateForm.value).toEqual({ day: '', month: '', year: '' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('setDisabledState toggles the form disabled state', () => {
    component.setDisabledState(true);
    expect(component.dateForm.disabled).toBe(true); // was toBeTrue()

    component.setDisabledState(false);
    expect(component.dateForm.disabled).toBe(false); // was toBeFalse()
  });

  it('registerOnTouched stores and can be invoked (manual call)', () => {
    const onTouched = jest.fn<void, []>();
    component.registerOnTouched(onTouched);

    // The component doesn’t call onTouched internally; invoke it to verify wiring.
    (component as unknown as { onTouched: () => void }).onTouched();
    expect(onTouched).toHaveBeenCalled();
  });

  it('updates output after subsequent edits', () => {
    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    component.dateForm.setValue({ day: '1', month: '1', year: '2020' });
    component.dateForm.setValue({ day: '2', month: '12', year: '2021' });

    expect(onChange).toHaveBeenCalledWith('2020-01-01');
    expect(onChange).toHaveBeenCalledWith('2021-12-02');
  });
});
