import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
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
  @Input() label = 'Duration';
  @Input() hint = '';
  @Input() idPrefix = 'duration';
  @Input() submitted = false;

  disabled = false;
  private touchedFlag = false;

  // keep raw text so non-digits are detectable
  private hoursText = '';
  private minutesText = '';

  // expose values for template bindings `[value]="hours ?? ''"` etc.
  get hours(): string | null {
    return this.hoursText;
  }
  get minutes(): string | null {
    return this.minutesText;
  }

  private onChange: (value: Duration | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(value: Duration | null): void {
    if (value) {
      this.hoursText = value.hours !== null ? String(value.hours) : '';
      this.minutesText = value.minutes !== null ? String(value.minutes) : '';
    } else {
      this.hoursText = '';
      this.minutesText = '';
    }
  }
  registerOnChange(fn: (value: Duration | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Validation
  validate(_: AbstractControl): ValidationErrors | null {
    void _;
    return this.computeErrors();
  }
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  private computeErrors(): ValidationErrors | null {
    const h = this.hoursText.trim();
    const m = this.minutesText.trim();

    if (h === '' && m === '') {
      return null;
    } // optional if both empty
    if (h === '' || m === '') {
      return { requiredParts: true };
    }

    if (!/^\d{1,2}$/.test(h) || !/^\d{1,2}$/.test(m)) {
      return { durationInvalid: true };
    }

    const hh = Number(h),
      mm = Number(m);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      return { durationInvalid: true };
    }

    return null;
  }

  get showErrors(): boolean {
    return !!this.computeErrors() && (this.touchedFlag || this.submitted);
  }
  get errorText(): string {
    const e = this.computeErrors();
    if (!e) {
      return '';
    }
    if (e['requiredParts']) {
      return 'Enter hours and minutes';
    }
    if (e['durationInvalid']) {
      return 'Enter a valid duration between 00:00 and 23:59';
    }
    return 'Enter a valid duration';
  }

  // ---- events ----
  private propagate(): void {
    const errs = this.computeErrors();
    if (!errs) {
      this.onChange({
        hours: Number(this.hoursText),
        minutes: Number(this.minutesText),
      });
    } else {
      this.onChange(null);
    }
    this.onValidatorChange();
  }
  onHoursInput(e: Event): void {
    this.hoursText = (e.target as HTMLInputElement).value;
    this.propagate();
  }
  onMinutesInput(e: Event): void {
    this.minutesText = (e.target as HTMLInputElement).value;
    this.propagate();
  }
  touch(): void {
    this.touchedFlag = true;
    this.onTouched();
  }
}
