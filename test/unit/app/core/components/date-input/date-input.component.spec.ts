import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';

import { DateInputComponent } from '@components/date-input/date-input.component';

jest.unmock('@ministryofjustice/frontend');
jest.unmock('govuk-frontend');

describe('DateInputComponent', () => {
  let fixture: ComponentFixture<DateInputComponent>;
  let component: DateInputComponent;

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported');
    await TestBed.configureTestingModule({
      imports: [DateInputComponent], // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.classList.remove('govuk-frontend-supported');
  });

  const element = <T extends HTMLElement>(selector: string): T =>
    fixture.nativeElement.querySelector(selector) as T;
  const openCalendar = async () => {
    await fixture.whenStable();
    element<HTMLButtonElement>('.moj-js-datepicker-toggle').click();
  };

  it('should create with empty, enabled form', () => {
    expect(component).toBeTruthy();
    expect(component.dateForm.disabled).toBe(false); // was toBeFalse()
    expect(component.dateForm.value).toEqual({ day: '', month: '', year: '' });
  });

  it('adds a calendar without replacing the manual fields', async () => {
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('input[type="text"]'),
    ).toHaveLength(3);
    expect(
      fixture.nativeElement.querySelector('.moj-js-datepicker-toggle'),
    ).not.toBeNull();
  });

  it('has no automated accessibility violations with the calendar open or closed', async () => {
    await fixture.whenStable();
    expect((await axe(fixture.nativeElement)).violations).toEqual([]);
    await openCalendar();
    expect((await axe(fixture.nativeElement)).violations).toEqual([]);
  });

  it('populates the manual fields and emits ISO dates from the real MOJ calendar', async () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);
    const touched = jest.fn();
    component.registerOnTouched(touched);
    component.writeValue('2024-02-29');
    await openCalendar();
    expect(element('.moj-js-datepicker-month-year').textContent).toBe(
      'February 2024',
    );
    element<HTMLButtonElement>('.moj-js-datepicker-ok').click();
    fixture.detectChanges();
    expect(component.dateForm.getRawValue()).toEqual({
      day: '29',
      month: '2',
      year: '2024',
    });
    expect(element<HTMLInputElement>('#date-day').value).toBe('29');
    expect(element<HTMLInputElement>('#date-month').value).toBe('2');
    expect(element<HTMLInputElement>('#date-year').value).toBe('2024');
    expect(onChange).toHaveBeenCalledWith('2024-02-29');
    expect(touched).toHaveBeenCalled();
    expect(component.dateForm.dirty).toBe(true);
    expect(document.activeElement).toBe(element('.moj-js-datepicker-toggle'));
  });

  it('uses manual edits on reopening and preserves them on Escape or cancel', async () => {
    component.dateForm.setValue({ day: '15', month: '6', year: '2025' });
    await openCalendar();
    const dialog = element('.moj-datepicker__dialog');
    expect(element('.moj-js-datepicker-month-year').textContent).toBe(
      'June 2025',
    );
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(dialog.classList.contains('moj-datepicker__dialog--open')).toBe(
      false,
    );
    expect(document.activeElement).toBe(element('.moj-js-datepicker-toggle'));
    component.dateForm.setValue({ day: '10', month: '3', year: '2026' });
    await openCalendar();
    expect(element('.moj-js-datepicker-month-year').textContent).toBe(
      'March 2026',
    );
    element<HTMLButtonElement>('.moj-js-datepicker-cancel').click();
    expect(component.dateForm.getRawValue()).toEqual({
      day: '10',
      month: '3',
      year: '2026',
    });
  });

  it('does not replace partial, invalid or cleared manual entries when opening', async () => {
    for (const value of [
      { day: '31', month: '2', year: '2025' },
      { day: '1', month: '', year: '' },
      { day: '', month: '', year: '' },
    ]) {
      component.dateForm.setValue(value);
      await openCalendar();
      expect(element<HTMLInputElement>('input[type="hidden"]').value).toBe('');
      element<HTMLButtonElement>('.moj-js-datepicker-cancel').click();
      expect(component.dateForm.getRawValue()).toEqual(value);
    }
  });

  it.each(['disallowFutureDates', 'pastDatesOnly'] as const)(
    'applies %s to both the calendar and manual entry',
    async (restriction) => {
      fixture.componentRef.setInput(restriction, true);
      const today = new Date();
      component.writeValue(
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      );
      await openCalendar();
      const todayButton = element<HTMLButtonElement>(
        `.moj-datepicker__button[data-testid="${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}"]`,
      );
      expect(todayButton.getAttribute('aria-disabled')).toBe(
        restriction === 'pastDatesOnly' ? 'true' : null,
      );
      const max = new Date();
      if (restriction === 'pastDatesOnly') {
        max.setDate(max.getDate() - 1);
      }
      const buttons: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll(
          '.moj-datepicker__button[data-testid]',
        );
      for (const button of buttons) {
        const [day, month, year] =
          button.dataset['testid']!.split('/').map(Number);
        if (new Date(year, month - 1, day) > max) {
          expect(button.getAttribute('aria-disabled')).toBe('true');
        }
      }
    },
  );

  it('disables the trigger before and after initialisation and closes any open calendar', async () => {
    component.setDisabledState(true);
    await fixture.whenStable();
    const trigger = element<HTMLButtonElement>('.moj-js-datepicker-toggle');
    expect(trigger.disabled).toBe(true);
    component.setDisabledState(false);
    trigger.click();
    expect(element('.moj-datepicker__dialog--open')).not.toBeNull();
    component.setDisabledState(true);
    expect(trigger.disabled).toBe(true);
    expect(element('.moj-datepicker__dialog--open')).toBeNull();
    const bridge = element<HTMLInputElement>('input[type="hidden"]');
    bridge.value = '1/1/2025';
    bridge.dispatchEvent(new Event('change'));
    expect(component.dateForm.getRawValue()).toEqual({
      day: '',
      month: '',
      year: '',
    });
  });

  it('removes the MOJ body listener and bridge listener when destroyed', async () => {
    const onChange = jest.fn();
    fixture.destroy();
    const add = jest.spyOn(document.body, 'addEventListener');
    const remove = jest.spyOn(document.body, 'removeEventListener');
    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    component.registerOnChange(onChange);
    fixture.detectChanges();
    await fixture.whenStable();
    const bridge = element<HTMLInputElement>('input[type="hidden"]');
    const registration = add.mock.calls.find(([type]) => type === 'mouseup')!;
    expect(registration).toBeDefined();
    fixture.destroy();
    expect(remove).toHaveBeenCalledWith(...registration);
    bridge.value = '1/1/2025';
    bridge.dispatchEvent(new Event('change'));
    expect(onChange).not.toHaveBeenCalled();
    add.mockRestore();
    remove.mockRestore();
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
    expect(component.dateForm.value).toEqual({
      day: '01',
      month: '02',
      year: '2024',
    });
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

  it('disallowFutureDates: marks future dates invalid and emits null', () => {
    // Freeze time so "today" is deterministic
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 19, 12, 0, 0)); // 19 Jan 2026 (month is 0-based)

    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    fixture.componentRef.setInput('disallowFutureDates', true);

    // Tomorrow relative to frozen "today"
    component.dateForm.setValue({ day: '20', month: '1', year: '2026' });

    expect(component.dateForm.valid).toBe(false);
    expect(component.dateForm.errors).toEqual(
      expect.objectContaining({
        dateInFuture: true,
        dateInvalid: true,
        dateErrorText: 'Date must not be in the future',
      }),
    );

    // Because invalid, CVA emits null
    expect(onChange).toHaveBeenCalledWith(null);

    jest.useRealTimers();
  });

  it('pastDatesOnly marks today invalid and emits null', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 19, 12, 0, 0));

    const onChange = jest.fn<void, [string | null]>();
    component.registerOnChange(onChange);

    fixture.componentRef.setInput('pastDatesOnly', true);

    component.dateForm.setValue({ day: '19', month: '1', year: '2026' });

    expect(component.dateForm.valid).toBe(false);
    expect(component.dateForm.errors).toEqual(
      expect.objectContaining({
        dateNotInPast: true,
        dateInvalid: true,
        dateErrorText: 'Date must be in the past',
      }),
    );
    expect(onChange).toHaveBeenCalledWith(null);

    jest.useRealTimers();
  });

  it('shows an external error message after submit', () => {
    component.dateForm.setValue({ day: '31', month: '1', year: '2026' });
    fixture.componentRef.setInput('submitted', true);
    fixture.componentRef.setInput(
      'externalErrorText',
      'Date to must be on or after Date from',
    );
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(
      '#date-error',
    ) as HTMLElement;
    const day = fixture.nativeElement.querySelector(
      '#date-day',
    ) as HTMLInputElement;
    const month = fixture.nativeElement.querySelector(
      '#date-month',
    ) as HTMLInputElement;
    const year = fixture.nativeElement.querySelector(
      '#date-year',
    ) as HTMLInputElement;

    expect(error.textContent).toContain(
      'Date to must be on or after Date from',
    );
    expect(day.classList.contains('govuk-input--error')).toBe(true);
    expect(month.classList.contains('govuk-input--error')).toBe(true);
    expect(year.classList.contains('govuk-input--error')).toBe(true);
  });

  it('shows an error for dates outside the allowed range', () => {
    component.dateForm.setValue({ day: '1', month: '1', year: '1899' });
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(
      '#date-error',
    ) as HTMLElement;

    expect(error.textContent).toContain('Date must be between 1900 and 3000');

    component.dateForm.setValue({ day: '1', month: '1', year: '3001' });
    fixture.detectChanges();

    expect(error.textContent).toContain('Date must be between 1900 and 3000');
  });
});
