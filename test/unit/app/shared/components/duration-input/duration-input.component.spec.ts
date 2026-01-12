import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  Duration,
  DurationInputComponent,
} from '@components/duration-input/duration-input.component';

describe('DurationInputComponent', () => {
  let fixture: ComponentFixture<DurationInputComponent>;
  let component: DurationInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DurationInputComponent], // standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(DurationInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates with null hours/minutes and enabled state', () => {
    expect(component).toBeTruthy();
    expect(component.hours).toBeNull();
    expect(component.minutes).toBeNull();
    expect(component.disabled).toBe(false);
  });

  it('writeValue sets hours/minutes; writeValue(null) resets both', () => {
    const onChange = jest.fn<void, [Duration | null]>();
    component.registerOnChange(onChange);

    component.writeValue({ hours: 2, minutes: 30 });
    expect(component.hours).toBe(2);
    expect(component.minutes).toBe(30);
    // writeValue should not emit
    expect(onChange).not.toHaveBeenCalled();

    component.writeValue(null);
    expect(component.hours).toBeNull();
    expect(component.minutes).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('registerOnTouched is stored and invoked by touch()', () => {
    const onTouched = jest.fn<void, []>();
    component.registerOnTouched(onTouched);

    component.touch();
    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('setDisabledState toggles the disabled flag', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

  it('onHoursInput parses integer and propagates combined value', () => {
    const onChange = jest.fn<void, [Duration | null]>();
    component.registerOnChange(onChange);

    // minutes currently null, will be included in payload
    const evt = { target: { value: '5' } } as unknown as Event;
    component.onHoursInput(evt);

    expect(component.hours).toBe(5);
    expect(onChange).toHaveBeenLastCalledWith({ hours: 5, minutes: null });
  });

  it('onMinutesInput parses integer and propagates combined value', () => {
    const onChange = jest.fn<void, [Duration | null]>();
    component.registerOnChange(onChange);

    // set hours first so we can verify both fields in the payload
    component.writeValue({ hours: 1, minutes: null });

    const evt = { target: { value: '45' } } as unknown as Event;
    component.onMinutesInput(evt);

    expect(component.minutes).toBe(45);
    expect(onChange).toHaveBeenLastCalledWith({ hours: 1, minutes: 45 });
  });

  it('onHoursInput with non-numeric sets hours to null and propagates', () => {
    const onChange = jest.fn<void, [Duration | null]>();
    component.registerOnChange(onChange);

    // set minutes so we can verify it remains unchanged
    component.writeValue({ hours: 2, minutes: 10 });

    const evt = { target: { value: '' } } as unknown as Event; // NaN -> null
    component.onHoursInput(evt);

    expect(component.hours).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith({ hours: null, minutes: 10 });
  });

  it('onMinutesInput with non-numeric sets minutes to NaN and propagates', () => {
    const onChange = jest.fn<void, [Duration | null]>();
    component.registerOnChange(onChange);
    component.writeValue({ hours: 3, minutes: 0 });
    const evt = { target: { value: 'abc' } } as unknown as Event;
    component.onMinutesInput(evt);
    expect(Number.isNaN(component.minutes as unknown as number)).toBe(true);
    const lastArg = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastArg?.hours).toBe(3);
    expect(Number.isNaN(lastArg?.minutes)).toBe(true);
  });

  it('propagates after sequential edits to both fields', () => {
    const onChange = jest.fn<void, [Duration | null]>();
    component.registerOnChange(onChange);

    component.onHoursInput({ target: { value: '2' } } as unknown as Event);
    component.onMinutesInput({ target: { value: '15' } } as unknown as Event);

    expect(onChange).toHaveBeenCalledWith({ hours: 2, minutes: null });
    expect(onChange).toHaveBeenCalledWith({ hours: 2, minutes: 15 });
  });
});
