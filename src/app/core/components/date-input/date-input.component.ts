import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ErrorHandler,
  afterNextRender,
  forwardRef,
  inject,
  input,
  viewChild,
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
  styleUrl: './date-input.component.scss',
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
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ReactiveFormsModule],
})
export class DateInputComponent implements ControlValueAccessor, Validator {
  label = input('Date');
  hint = input('For example, 27 3 2007');
  idPrefix = input('date');
  submitted = input(false);
  isSearch = input(false);
  disallowFutureDates = input(false);
  pastDatesOnly = input(false);
  externalErrorText = input('');

  containerWidthClass = input('govuk-grid-column-one-half');

  disabled = false;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly calendar =
    viewChild.required<ElementRef<HTMLElement>>('calendar');
  private calendarButton?: HTMLButtonElement;
  private closeCalendar?: () => void;

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

    const valueDate = new Date(y, m - 1, d);

    // this line is to set the full year correctly, as short years will default to 1901
    valueDate.setFullYear(y);

    if (
      valueDate < new Date(1900, 0, 1) ||
      valueDate > new Date(3000, 11, 31)
    ) {
      return {
        dateInvalid: true,
        dateErrorText: 'Date must be between 1900 and 3000',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.pastDatesOnly()) {
      if (valueDate.getTime() >= today.getTime()) {
        return {
          dateNotInPast: true,
          dateInvalid: true,
          dateErrorText: 'Date must be in the past',
        };
      }
    }

    if (this.disallowFutureDates()) {
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
  );

  private ctrl(name: DateField) {
    return this.dateForm.get(name);
  }

  private val(name: DateField) {
    return this.ctrl(name)?.value;
  }

  constructor() {
    afterNextRender(() => {
      void this.initCalendar().catch((error: unknown) => {
        // Manual entry remains available if the calendar cannot be loaded.
        this.errorHandler.handleError(error);
      });
    });
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

  private async initCalendar(): Promise<void> {
    // Import only in the browser, after Angular has rendered the manual inputs.
    const { DatePicker } = await import('@ministryofjustice/frontend');
    if (this.destroyRef.destroyed) {
      return;
    }
    const root = this.calendar().nativeElement;
    const bridge = root.querySelector('input')!;
    // The MOJ widget expects one input. This hidden bridge keeps the existing
    // three-field form as the only editable date value.
    const listeners: Parameters<HTMLElement['addEventListener']>[] = [];
    const body = root.ownerDocument.body;
    const original = Object.getOwnPropertyDescriptor(body, 'addEventListener');
    const addListener = body.addEventListener.bind(body);
    // MOJ 6 has no destroy API and installs a body mouseup listener. Capture
    // its synchronous registration so route changes can remove that listener.
    body.addEventListener = (
      ...args: Parameters<HTMLElement['addEventListener']>
    ) => {
      listeners.push(args);
      addListener(...args);
    };
    let picker: InstanceType<typeof DatePicker>;
    try {
      picker = new DatePicker(root, {
        minDate: '01/01/1900',
        maxDate: '31/12/3000',
      });
    } finally {
      if (original) {
        Object.defineProperty(body, 'addEventListener', original);
      } else {
        Reflect.deleteProperty(body, 'addEventListener');
      }
      this.destroyRef.onDestroy(() => {
        for (const args of listeners) {
          body.removeEventListener(...args);
        }
      });
    }
    this.calendarButton = root.querySelector<HTMLButtonElement>(
      '.moj-js-datepicker-toggle',
    )!;
    this.calendarButton.disabled = this.disabled;
    this.calendarButton.setAttribute(
      'aria-label',
      `Choose ${this.label().toLowerCase()}`,
    );
    const closeDialog = picker.closeDialog.bind(picker);
    // MOJ normally restores focus to its text input; ours is a hidden bridge.
    picker.closeDialog = () => {
      closeDialog();
      this.calendarButton?.focus();
    };
    this.closeCalendar = () => picker.closeDialog();
    const prepareCalendar = () => {
      const { day, month, year } = this.dateForm.getRawValue();
      bridge.value =
        this.dateForm.valid && this.hasAny() ? `${day}/${month}/${year}` : '';
      const max = new Date();
      if (this.pastDatesOnly()) {
        max.setDate(max.getDate() - 1);
      }
      picker.config.maxDate =
        this.pastDatesOnly() || this.disallowFutureDates()
          ? `${max.getDate()}/${max.getMonth() + 1}/${max.getFullYear()}`
          : '31/12/3000';
      picker.setMinAndMaxDatesOnCalendar();
    };
    const selectDate = () => {
      if (this.disabled) {
        return;
      }
      const [day, month, year] = bridge.value.split('/');
      this.dateForm.setValue({ day, month, year });
      this.dateForm.markAsDirty();
      this.onTouched();
    };
    // Capture runs before the widget opens, including keyboard-triggered clicks.
    this.calendarButton.addEventListener('click', prepareCalendar, true);
    bridge.addEventListener('change', selectDate);
    this.destroyRef.onDestroy(() => {
      this.calendarButton?.removeEventListener('click', prepareCalendar, true);
      bridge.removeEventListener('change', selectDate);
    });
  }

  groupError(submitted: boolean): boolean {
    if (submitted === false) {
      return false;
    }
    const miss =
      this.missing('day') || this.missing('month') || this.missing('year');
    const externalError = this.hasExternalError(submitted);
    if (!this.isSearch()) {
      return this.dateForm.invalid || miss || externalError;
    }
    return this.hasAny() && (this.dateForm.invalid || miss || externalError);
  }

  fieldError(name: DateField, submitted: boolean): boolean {
    if (this.disabled) {
      return false;
    }
    const c = this.ctrl(name);
    const base = !!(c?.invalid && (c?.touched || c?.dirty));
    const miss = this.missing(name);
    const dateInvalid = !!this.dateForm.errors?.['dateInvalid'];
    const externalError = this.hasExternalError(submitted);
    if (!submitted) {
      return base;
    }
    if (!this.isSearch()) {
      return base || miss || dateInvalid || externalError;
    }
    return base || (this.hasAny() && (miss || dateInvalid || externalError));
  }

  private isInteractedInvalid(name: DateField): boolean {
    const c = this.ctrl(name);
    return !!(c?.invalid && (c.touched || c.dirty));
  }

  ariaInvalidLive(name: DateField): 'true' | null {
    return this.isInteractedInvalid(name) ? 'true' : null;
  }

  ariaInvalidAfterSubmit(name: DateField): 'true' | null {
    const missingFieldIsInvalid = this.isSearch()
      ? this.hasAny() && this.missing(name)
      : this.missing(name);

    return this.isInteractedInvalid(name) ||
      missingFieldIsInvalid ||
      this.hasExternalError(true)
      ? 'true'
      : null;
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
    if (isDisabled) {
      this.closeCalendar?.();
    }
    this.disabled = isDisabled;
    if (this.calendarButton) {
      this.calendarButton.disabled = isDisabled;
    }
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

  private hasExternalError(submitted: boolean): boolean {
    return submitted && !!this.externalErrorText().trim();
  }
}
