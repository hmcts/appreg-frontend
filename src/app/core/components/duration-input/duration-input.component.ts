import { CommonModule } from '@angular/common';
import { Component, forwardRef, input, signal } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';

export interface Duration {
  hours: number | null;
  minutes: number | null;
}

export type DurationMode = 'clock' | 'duration';

@Component({
  selector: 'app-duration-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './duration-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DurationInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DurationInputComponent),
      multi: true,
    },
  ],
})
export class DurationInputComponent implements ControlValueAccessor, Validator {
  // @Input() idPrefix!: string;
  idPrefix = input.required<string>();
  // @Input() label?: string;
  label = input<string>();
  // @Input() hint?: string;
  hint = input<string>();
  // @Input() disabled = false;
  readonly disabled = input(false);
  // @Input() submitted = false;
  submitted = input(false);
  showError = input(false);
  errorTextOverride = input('');
  // @Input() required = true;
  required = input(true);
  // @Input() mode: DurationMode = 'clock'; // One for 24 hour clock and one for duration
  mode = input<DurationMode>('clock');

  // single source of truth: numbers
  hours: number | null = null;
  minutes: number | null = null;

  hoursText = '';
  minutesText = '';

  private onChange: (value: Duration | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  // CVA
  writeValue(value: Duration | null): void {
    this.hours = value?.hours ?? null;
    this.minutes = value?.minutes ?? null;

    this.hoursText =
      this.hours === null || Number.isNaN(this.hours) ? '' : String(this.hours);
    this.minutesText =
      this.minutes === null || Number.isNaN(this.minutes)
        ? ''
        : String(this.minutes);
  }
  registerOnChange(fn: (value: Duration | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // Validation
  validate(control: AbstractControl): ValidationErrors | null {
    // Looks like a redundant param but needed to bypass eslint and sonarqube
    if (control === null) {
      return this.computeErrors();
    }
    return this.computeErrors();
  }
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  private readonly HOURS_MIN = 0;
  private readonly HOURS_MAX_DURATION = 99;
  private readonly HOURS_MAX_CLOCK = 23;
  private readonly MINS_MIN = 0;
  private readonly MINS_MAX = 59;
  private readonly cvaDisabled = signal(false);

  get isDisabled(): boolean {
    return this.disabled() || this.cvaDisabled();
  }

  private computeErrors(): ValidationErrors | null {
    const h = this.hours,
      m = this.minutes;
    return this.mode() === 'clock'
      ? this.clockErrors(h, m)
      : this.durationErrors(h, m);
  }

  private clockErrors(
    h: number | null,
    m: number | null,
  ): ValidationErrors | null {
    // required + blanks
    if (this.required() && this.isBlank(h) && this.isBlank(m)) {
      return {
        required: true,
        durationErrorText: 'Enter hours and minutes',
      };
    }
    if (this.required() && (this.isBlank(h) || this.isBlank(m))) {
      return this.partsInvalidError(
        this.missingMsg(this.isBlank(h), this.isBlank(m)),
      );
    }

    // nulls
    if (h === null && m === null) {
      return null;
    }
    if (h === null || m === null) {
      return this.partsInvalidError(this.missingMsg(h === null, m === null));
    }

    if (Number.isNaN(h) || Number.isNaN(m)) {
      return this.invalidClock();
    }

    // type and range
    if (!Number.isInteger(h) || !Number.isInteger(m)) {
      return this.invalidClock();
    }
    if (
      !this.inRange(h, this.HOURS_MIN, this.HOURS_MAX_CLOCK) ||
      !this.inRange(m, this.MINS_MIN, this.MINS_MAX)
    ) {
      return this.invalidClock();
    }
    return null;
  }

  private durationErrors(
    h: number | null,
    m: number | null,
  ): ValidationErrors | null {
    const errors: ValidationErrors = {};

    // Hours validation
    if (!this.isBlank(h)) {
      const hh = h as number;
      if (
        !Number.isInteger(hh) ||
        !this.inRange(hh, this.HOURS_MIN, this.HOURS_MAX_DURATION)
      ) {
        errors['hoursErrorText'] =
          `Enter hours between ${this.HOURS_MIN} and ${this.HOURS_MAX_DURATION}`;
      }
    }

    // Minutes validation
    if (!this.isBlank(m)) {
      const mm = m as number;
      if (
        !Number.isInteger(mm) ||
        !this.inRange(mm, this.MINS_MIN, this.MINS_MAX)
      ) {
        errors['minutesErrorText'] =
          `Enter minutes between ${this.MINS_MIN} and ${this.MINS_MAX}`;
      }
    }

    // No errors
    if (Object.keys(errors).length === 0) {
      return null;
    }

    const firstMessage =
      (errors['hoursErrorText'] as string | undefined) ??
      (errors['minutesErrorText'] as string | undefined);

    if (firstMessage) {
      errors['durationErrorText'] = firstMessage;
    }

    errors['durationInvalid'] = true;

    return errors;
  }

  // Events
  private emit(): void {
    const h = this.hours;
    const m = this.minutes;

    const value: Duration | null =
      h === null && m === null ? null : { hours: h, minutes: m };

    this.onChange(value);
    this.onValidatorChange();
  }
  onHoursInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value.trim();
    this.hoursText = v;
    this.hours = this.parseClockPart(v);
    this.emit();
  }
  onMinutesInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value.trim();
    this.minutesText = v;
    this.minutes = this.parseClockPart(v);
    this.emit();
  }
  touch(): void {
    this.onTouched();
  }

  // Helpers
  private inRange(v: number, min: number, max: number) {
    return v >= min && v <= max;
  }

  private isBlank(v: unknown): boolean {
    return v === null || v === undefined || v === '';
  }
  private partsRequiredError(msg: string): ValidationErrors {
    return { required: true, durationErrorText: msg };
  }

  private partsInvalidError(msg: string): ValidationErrors {
    return {
      required: true,
      durationInvalid: true,
      durationErrorText: msg,
    };
  }

  private invalidClock(): ValidationErrors {
    return this.invalid('Enter a valid duration between 00:00 and 23:59');
  }

  private invalid(msg: string): ValidationErrors {
    return { durationInvalid: true, durationErrorText: msg };
  }

  private missingMsg(missH: boolean, missM: boolean): string {
    if (missH && missM) {
      return 'Enter hours and minutes';
    }
    if (missH) {
      return 'Enter hours';
    }
    return 'Enter minutes';
  }

  get displayErrors(): boolean {
    return this.submitted() && (this.showErrors || this.showError());
  }

  get showErrors(): boolean {
    return this.submitted() && !!this.computeErrors();
  }

  get errorText(): string {
    const override = this.errorTextOverride()?.trim();
    if (this.showError() && override) {
      return override;
    }

    const e = this.computeErrors();
    if (!e) {
      return '';
    }
    if (e['required']) {
      return 'Enter hours and minutes';
    }
    if (e['durationInvalid']) {
      if (this.mode() === 'clock') {
        return 'Enter a valid duration between 00:00 and 23:59';
      } else {
        return 'Enter a valid duration: Hours 0-99, Mins 0-59';
      }
    }
    return 'Enter a valid duration';
  }

  private parseClockPart(raw: string): number | null {
    const t = (raw ?? '').trim();
    if (t === '') {
      return null;
    }

    if (!/^\d{1,2}$/.test(t)) {
      return Number.NaN;
    }

    return Number.parseInt(t, 10);
  }
}
