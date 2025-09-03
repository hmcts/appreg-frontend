import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './text-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
})
export class TextInputComponent implements ControlValueAccessor {
  /** The label shown above the input */
  @Input() label = '';
  /** The hint text shown under the label */
  @Input() hint = '';
  /** Prefix used for id/name (so you can render multiple on one page) */
  @Input() idPrefix = 'text-input';
  /** Optional width class (e.g. 'govuk-input--width-10') */
  @Input() widthClass = 'govuk-input--width-10';

  value: string | null = null;
  disabled = false;

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(obj: string | null): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
  }
}
