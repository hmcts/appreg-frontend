import { Component, Input, forwardRef } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  ValidatorFn,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
  imports: [ReactiveFormsModule],
})
export class DateInputComponent implements ControlValueAccessor, Validator {
  @Input() label = 'Date';
  @Input() hint = 'For example, 27 3 2007';
  @Input() idPrefix = 'date';

  dateForm: FormGroup<{
    day: FormControl<string>;
    month: FormControl<string>;
    year: FormControl<string>;
  }>;

  private onTouched: () => void = () => {};
  private onChange: (value: string | null) => void = () => {};
  private onValidatorChange: () => void = () => {};

  constructor(private fb: NonNullableFormBuilder) {
    this.dateForm = this.fb.group(
      {
        day: this.fb.control('', {
          validators: [
            // Wrap to avoid `unbound-method` on Validators.required
            (c) => Validators.pattern(/^\d{1,2}$/)(c),
          ],
        }),
        month: this.fb.control('', {
          validators: [(c) => Validators.pattern(/^\d{1,2}$/)(c)],
        }),
        year: this.fb.control('', {
          validators: [(c) => Validators.pattern(/^\d{4}$/)(c)],
        }),
      },
      { validators: [this.calendarDateValidator] },
    );

    this.dateForm.valueChanges.subscribe(() => {
      if (this.dateForm.valid) {
        const { day, month, year } = this.dateForm.getRawValue(); // strongly typed
        const d = day.padStart(2, '0');
        const m = month.padStart(2, '0');
        this.onChange(`${year}-${m}-${d}`);
      } else {
        this.onChange(null);
      }
      this.onValidatorChange();
    });
  }

  private readonly calendarDateValidator: ValidatorFn = (
    ctrl: AbstractControl,
  ): ValidationErrors | null => {
    const g = ctrl as FormGroup<{
      day: FormControl<string>;
      month: FormControl<string>;
      year: FormControl<string>;
    }>;

    const day = g.controls.day.value?.trim() ?? '';
    const month = g.controls.month.value?.trim() ?? '';
    const year = g.controls.year.value?.trim() ?? '';

    // Optional when completely empty
    if (!day && !month && !year) {
      return null;
    }

    const d = Number(day);
    const m = Number(month);
    const y = Number(year);

    if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
      return { dateInvalid: true };
    }
    if (m < 1 || m > 12 || d < 1) {
      return { dateInvalid: true };
    }

    const leap = (yy: number) =>
      (yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0;

    const dim = [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return d <= dim[m - 1] ? null : { dateInvalid: true };
  };

  // Called by the forms API to write to the view when model changes
  writeValue(value: string | null): void {
    if (value) {
      const [y, m, d] = value.split('-');
      this.dateForm.setValue(
        { day: d ?? '', month: m ?? '', year: y ?? '' },
        { emitEvent: false },
      );
    } else {
      this.dateForm.reset(
        { day: '', month: '', year: '' },
        { emitEvent: false },
      );
    }
  }
  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.dateForm.disable();
    } else {
      this.dateForm.enable();
    }
  }

  // Validator
  validate(_: AbstractControl): ValidationErrors | null {
    void _;
    const { day, month, year } = this.dateForm.getRawValue();
    const empty = !day && !month && !year;
    return empty || this.dateForm.valid ? null : { dateInvalid: true };
  }
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }
}
