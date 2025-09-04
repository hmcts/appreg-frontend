import { Component, Input, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
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
  ],
  imports: [ReactiveFormsModule],
})
export class DateInputComponent implements ControlValueAccessor {
  @Input() label = 'Date';
  @Input() hint = 'For example, 27 3 2007';
  @Input() idPrefix = 'date';

  dateForm: FormGroup<{
    day: FormControl<string>;
    month: FormControl<string>;
    year: FormControl<string>;
  }>;

  /** Callbacks supplied by Angular forms */
  private onTouched: () => void = () => {};
  private onChange: (value: string | null) => void = () => {};

  constructor(private fb: NonNullableFormBuilder) {
    this.dateForm = this.fb.group({
      day: this.fb.control('', {
        validators: [
          // Wrap to avoid `unbound-method` on Validators.required
          (c) => Validators.required(c),
          (c) => Validators.pattern(/^\d{1,2}$/)(c),
        ],
      }),
      month: this.fb.control('', {
        validators: [
          (c) => Validators.required(c),
          (c) => Validators.pattern(/^\d{1,2}$/)(c),
        ],
      }),
      year: this.fb.control('', {
        validators: [
          (c) => Validators.required(c),
          (c) => Validators.pattern(/^\d{4}$/)(c),
        ],
      }),
    });

    // Emit a YYYY-MM-DD string when the form is valid, otherwise null
    this.dateForm.valueChanges.subscribe(() => {
      if (this.dateForm.valid) {
        const { day, month, year } = this.dateForm.getRawValue(); // strongly typed
        const d = day.padStart(2, '0');
        const m = month.padStart(2, '0');
        this.onChange(`${year}-${m}-${d}`);
      } else {
        this.onChange(null);
      }
    });
  }

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
}
