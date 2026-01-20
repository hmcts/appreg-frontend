import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select-input',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './select-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectInputComponent),
      multi: true,
    },
  ],
})
export class SelectInputComponent implements ControlValueAccessor {
  /** Legend text for the field */
  @Input() label = 'Select';
  /** Hint text shown under the label */
  @Input() hint = '';
  /** Prefix for all `id` and `name` attributes */
  @Input() idPrefix = 'select';
  /** The list of `<option>`s to render */
  @Input() options: SelectOption[] = [];

  /** Current value */
  value: string | null = null;

  /** Disabled state (set via CVA) */
  disabled = false;

  @Input() submitted = false;

  private onTouched: () => void = () => {};
  private onChange: (v: string | null) => void = () => {};

  writeValue(obj: string | null): void {
    this.value = obj;
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.value = val;
    this.onChange(val);
    this.onTouched();
  }
  handleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value ?? '';
    this.value = value;
    this.onChange(value === '' ? null : value);
  }
  handleBlur(): void {
    this.onTouched();
  }
}
