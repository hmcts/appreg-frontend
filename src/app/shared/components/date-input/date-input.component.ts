import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  styleUrls: ['./date-input.component.scss'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
})
export class DateInputComponent implements ControlValueAccessor {
  /** Displayed legend text */
  @Input() label = 'Date';
  /** Displayed hint text */
  @Input() hint = 'For example, 27 3 2007';
  /** Prefix used for id/name attributes */
  @Input() idPrefix = 'date';

  /** Internal form group with day/month/year controls */
  dateForm: FormGroup;

  private onTouched = () => {};
  private onChange: (value: string | null) => void = () => {};

  constructor(private fb: FormBuilder) {
    this.dateForm = this.fb.group({
      day: ['', [Validators.required, Validators.pattern(/^\d{1,2}$/)]],
      month: ['', [Validators.required, Validators.pattern(/^\d{1,2}$/)]],
      year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    });

    // Emit a YYYY-MM-DD string when the form is valid, otherwise null
    this.dateForm.valueChanges.subscribe(val => {
      if (this.dateForm.valid) {
        const d = val.day.padStart(2, '0');
        const m = val.month.padStart(2, '0');
        const y = val.year;
        this.onChange(`${y}-${m}-${d}`);
      } else {
        this.onChange(null);
      }
    });
  }

  // Called by the forms API to write to the view when model changes
  writeValue(value: string | null): void {
    if (value) {
      const [y, m, d] = value.split('-');
      this.dateForm.setValue({ day: d, month: m, year: y }, { emitEvent: false });
    } else {
      this.dateForm.reset({ day: '', month: '', year: '' }, { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.dateForm.disable() : this.dateForm.enable();
  }
}
