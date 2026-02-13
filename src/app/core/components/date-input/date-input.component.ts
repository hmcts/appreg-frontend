import {
  Component,
  DestroyRef,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

type DateField = 'day' | 'month' | 'year';

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
  label = input('Date');
  hint = input('For example, 27 3 2007');
  idPrefix = input('date');
  submitted = input(false);
  isSearch = input(false);
  disallowFutureDates = input(false);

  disabled = false;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private onTouched: () => void = () => {};
  private onChange: (value: string | null) => void = () => {};
  private onValidatorChange: () => void = () => {};

  private readonly groupValidator: ValidatorFn = (
    ctrl: AbstractControl,
  ): ValidationErrors | null => {
    const g = ctrl as DateForm;
    const { day, month, year } = g.getRawValue();

    if (day === '' && month === '' && year === '') {
      return null;
    }

    const missing = this.findMissing(day, month, year);
    if (missing.length > 0) {
      return {
        required: true,
        ...this.dateError(this.missingMsg(missing)),
      };
    }

    const d = Number(day),
      m = Number(month),
      y = Number(year);
    if (!this.isRealDate(d, m, y)) {
      return this.dateError();
    }

    if (this.disallowFutureDates()) {
      const valueDate = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (valueDate.getTime() > today.getTime()) {
        return {
          dateInFuture: true,
          dateInvalid: true,
          dateErrorText: 'Date must not be in the future',
        };
      }
    }

    return null;
  };

  readonly dateForm: DateForm = this.fb.group(
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

  private ctrl(name: DateField) {
    return this.dateForm.get(name);
  }

  private val(name: DateField) {
    return this.ctrl(name)?.value;
  }

  constructor() {
    this.dateForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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

  groupError(submitted: boolean): boolean {
    if (!submitted) {
      return false;
    }
    const miss =
      this.missing('day') || this.missing('month') || this.missing('year');
    if (!this.isSearch()) {
      return this.dateForm.invalid || miss;
    }
    return this.hasAny() && (this.dateForm.invalid || miss);
  }

  fieldError(name: DateField, submitted: boolean): boolean {
    if (this.disabled) {
      return false;
    }
    const c = this.ctrl(name);
    const base = !!(c?.invalid && (c?.touched || c?.dirty));
    const miss = this.missing(name);
    const dateInvalid = !!this.dateForm.errors?.['dateInvalid'];
    if (!submitted) {
      return base;
    }
    if (!this.isSearch()) {
      return base || miss || dateInvalid;
    }
    return base || (this.hasAny() && (miss || dateInvalid));
  }

  private isInteractedInvalid(name: DateField): boolean {
    const c = this.ctrl(name);
    return !!(c?.invalid && (c.touched || c.dirty));
  }

  ariaInvalidLive(name: DateField): 'true' | null {
    return this.isInteractedInvalid(name) ? 'true' : null;
  }

  ariaInvalidAfterSubmit(name: DateField): 'true' | null {
    return this.isInteractedInvalid(name) || this.missing(name) ? 'true' : null;
  }

  writeValue(value: string | null): void {
    const { day, month, year } = this.dateForm.getRawValue();
    const allEmpty = day === '' && month === '' && year === '';

    if (value === null || value === undefined) {
      if (!allEmpty) {
        this.dateForm.reset(
          { day: '', month: '', year: '' },
          { emitEvent: false },
        );
      }
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
    this.disabled = isDisabled;
    if (isDisabled) {
      this.dateForm.disable({ emitEvent: false });
    } else {
      this.dateForm.enable({ emitEvent: false });
    }
  }

  // Validator
  validate(control: AbstractControl): ValidationErrors | null {
    // Looks like a redundant param but needed to bypass eslint and sonarqube
    if (control === null) {
      return this.dateForm.errors;
    }
    return this.dateForm.errors;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  onBlur(): void {
    this.onTouched();
  }

  // helpers
  private missingMsg(missing: string[]): string {
    switch (missing.length) {
      case 1:
        return `Enter ${missing[0]}`;
      case 2:
        return `Enter ${missing[0]} and ${missing[1]}`;
      default:
        return 'Enter day, month and year';
    }
  }

  private findMissing(day: string, month: string, year: string): string[] {
    const out: string[] = [];
    if (day === '') {
      out.push('day');
    }
    if (month === '') {
      out.push('month');
    }
    if (year === '') {
      out.push('year');
    }
    return out;
  }

  private isRealDate(d: number, m: number, y: number): boolean {
    if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
      return false;
    }
    if (m < 1 || m > 12 || d < 1) {
      return false;
    }
    const daysInMonth = new Date(y, m, 0).getDate();
    return d <= daysInMonth;
  }

  private dateError(msg = 'Enter a valid date'): ValidationErrors {
    return { dateInvalid: true, dateErrorText: msg };
  }

  hasAny(): boolean {
    return !!(this.val('day') || this.val('month') || this.val('year'));
  }

  missing(name: DateField): boolean {
    return !this.val(name);
  }
}
