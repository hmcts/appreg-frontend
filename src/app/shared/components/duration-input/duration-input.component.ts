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
  @Input() idPrefix!: string;
  @Input() label?: string;
  @Input() hint?: string;
  @Input() disabled = false;
  @Input() submitted = false;
  @Input() required = true;

  // single source of truth: numbers
  hours: number | null = null;
  minutes: number | null = null;

  private onChange: (value: Duration | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  // CVA
  writeValue(value: Duration | null): void {
    this.hours = value?.hours ?? null;
    this.minutes = value?.minutes ?? null;
    // no emit on writeValue
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

  private isBlank(v: unknown): boolean {
    return v === null || v === undefined || v === '';
  }

  private computeErrors(): ValidationErrors | null {
    const h = this.hours,
      m = this.minutes;

    if (this.required && this.isBlank(h) && this.isBlank(m)) {
      return { requiredParts: true };
    }

    if (this.required && (this.isBlank(h) || this.isBlank(m))) {
      return { requiredParts: true };
    }

    if (h === null && m === null) {
      return null;
    }
    if (h === null || m === null) {
      return { requiredParts: true };
    }
    if (!Number.isInteger(h) || !Number.isInteger(m)) {
      return { durationInvalid: true };
    }
    if (h < 0 || h > 23 || m < 0 || m > 59) {
      return { durationInvalid: true };
    }
    return null;
  }

  get displayErrors(): boolean {
    return this.submitted && this.showErrors;
  }

  get showErrors(): boolean {
    return this.submitted && !!this.computeErrors();
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

  // Events
  private emit(): void {
    this.onChange({ hours: this.hours, minutes: this.minutes }); // always emit object
    this.onValidatorChange();
  }
  onHoursInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value.trim();
    this.hours = /^\d+$/.test(v) ? parseInt(v, 10) : null;
    this.emit();
  }
  onMinutesInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value.trim();
    this.minutes = /^\d+$/.test(v) ? parseInt(v, 10) : null;
    this.emit();
  }
  touch(): void {
    this.onTouched();
  }
}
