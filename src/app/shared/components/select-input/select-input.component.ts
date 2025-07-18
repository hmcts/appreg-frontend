import { Component, Input, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-input',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './select-input.component.html',
  styleUrls: ['./select-input.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectInputComponent),
    multi: true
  }]
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

  private onTouched = () => {};
  private onChange: (v: string | null) => void = () => {};

  writeValue(obj: string | null): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {
    // we let the native <select> handle disabled
  }

  onSelectChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.value = val;
    this.onChange(val);
    this.onTouched();
  }
}
