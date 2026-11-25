import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
} from '@angular/core';
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

/**
 * SelectInputComponent
 *
 * Functionality:
 * - Displays a select input with labels and errors.
 * - Integrates selection and disabled state with Angular forms.
 * - Supports hints, errors, and a supplied list of options.
 */
@Component({
  selector: 'app-select-input',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './select-input.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
  label = input('Select');
  /** Hint text shown under the label */
  hint = input('');
  /** Prefix for all `id` and `name` attributes */
  idPrefix = input('select');
  /** The list of `<option>`s to render */
  options = input<SelectOption[]>([]);

  /** Current value */
  value: string | null = null;

  /** Disabled state (set via CVA) */
  disabled = false;

  submitted = input(false);
  showError = input(false);
  errorText = input('');
  submittedError = input<string | null>();

  get displaysError(): boolean {
    const saved = this.submittedError();
    return (
      this.submitted() &&
      (saved === undefined ? !this.value || this.showError() : !!saved)
    );
  }

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
