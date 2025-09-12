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

  /** Internal model */
  hours: number | null = null;
  minutes: number | null = null;

  disabled = false;

  /** CVA callbacks (typed) */
  private onChange: (value: Duration | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(value: Duration | null): void {
    if (value) {
      this.hours = value.hours;
      this.minutes = value.minutes;
    } else {
      this.hours = this.minutes = null;
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

  // Validation (hours: 0–23, mins: 0–59)
  validate(_: AbstractControl): ValidationErrors | null {
    void _;
    const h = this.hours;
    const m = this.minutes;

    if ((h === null || h === undefined) && (m === null || m === undefined)) {
      return null;
    }

    const isHoursValid =
      Number.isInteger(h) && (h as number) >= 0 && (h as number) <= 23;
    const isMinsValid =
      Number.isInteger(m) && (m as number) >= 0 && (m as number) <= 59;

    return isHoursValid && isMinsValid ? null : { durationInvalid: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  /** Call whenever either input changes */
  private propagate(): void {
    const out: Duration = {
      hours: this.hours,
      minutes: this.minutes,
    };
    this.onChange(out);
    this.onValidatorChange();
  }

  onHoursInput(e: Event): void {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    this.hours = Number.isNaN(val) ? null : val;
    this.propagate();
  }

  onMinutesInput(e: Event): void {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    this.minutes = Number.isNaN(val) ? null : val;
    this.propagate();
  }

  // mark as touched on blur of either input
  touch(): void {
    this.onTouched();
  }
}
