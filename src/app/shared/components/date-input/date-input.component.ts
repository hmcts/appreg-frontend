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

type DateForm = FormGroup<{
  day: FormControl<string>;
  month: FormControl<string>;
  year: FormControl<string>;
}>;

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
  @Input() submitted = false;
  @Input() isSearch = false;

  readonly dateForm: DateForm;

  private onTouched: () => void = () => {};
  private onChange: (value: string | null) => void = () => {};
  private onValidatorChange: () => void = () => {};

  constructor(private fb: NonNullableFormBuilder) {
    this.dateForm = this.fb.group(
      {
        day: this.fb.control('', {
          validators: [(c) => Validators.pattern(/^\d{1,2}$/)(c)],
        }),
        month: this.fb.control('', {
          validators: [(c) => Validators.pattern(/^\d{1,2}$/)(c)],
        }),
        year: this.fb.control('', {
          validators: [(c) => Validators.pattern(/^\d{4}$/)(c)],
        }),
      },
      { validators: [this.groupValidator] },
    ) as DateForm;

    this.dateForm.valueChanges.subscribe(() => {
      const { day, month, year } = this.dateForm.getRawValue();
      const allEmpty = day === '' && month === '' && year === '';

      let value: string | null = null;
      if (!allEmpty && this.dateForm.valid) {
        value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      this.onChange(value);
      this.onValidatorChange();
    });
  }

  private readonly groupValidator: ValidatorFn = (
    ctrl: AbstractControl,
  ): ValidationErrors | null => {
    const g = ctrl as DateForm;
    const { day, month, year } = g.getRawValue();

    const allEmpty = day === '' && month === '' && year === '';
    if (allEmpty) {
      return null;
    }

    // if any part missing -> requiredParts
    if (day === '' || month === '' || year === '') {
      return { requiredParts: true };
    }

    if (
      !/^\d{1,2}$/.test(day) ||
      !/^\d{1,2}$/.test(month) ||
      !/^\d{4}$/.test(year)
    ) {
      return { dateInvalid: true };
    }

    const d = Number(day),
      m = Number(month),
      y = Number(year);
    if (m < 1 || m > 12 || d < 1) {
      return { dateInvalid: true };
    }

    const daysInMonth = new Date(y, m, 0).getDate();
    if (d > daysInMonth) {
      return { dateInvalid: true };
    }

    return null;
  };

  // ControlValueAccessor
  writeValue(value: string | null): void {
    const { day, month, year } = this.dateForm.getRawValue();
    const current =
      this.dateForm.valid && day && month && year
        ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        : null;

    if (value === current) {
      return;
    }

    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      this.dateForm.setValue(
        { day: d, month: m, year: y },
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
    return this.dateForm.errors;
  }
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  onBlur(): void {
    this.onTouched();
  }
}
