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
  @Input() submitted = false; // optional: show errors after form submit

  hours: number | null = null;
  minutes: number | null = null;
  disabled = false;

  // local touch flag for error display
  private touchedFlag = false;

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

  // ---- Validation ----
  validate(_: AbstractControl): ValidationErrors | null {
    void _;
    return this.computeErrors();
  }
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  private computeErrors(): ValidationErrors | null {
    const h = this.hours;
    const m = this.minutes;

    // optional when both empty
    if ((h === null || h === undefined) && (m === null || m === undefined)) {
      return null;
    }

    // one missing -> require both parts
    if (h === null || h === undefined || m === null || m === undefined) {
      return { requiredParts: true };
    }

    const hoursOk = Number.isInteger(h) && h >= 0 && h <= 23;
    const minsOk = Number.isInteger(m) && m >= 0 && m <= 59;

    if (!hoursOk || !minsOk) {
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
    this.onChange({ hours: this.hours, minutes: this.minutes });
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
  touch(): void {
    this.touchedFlag = true;
    this.onTouched();
  }
}
