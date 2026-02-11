import { CommonModule } from '@angular/common';
import { Component, forwardRef, input, output, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

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
  label = input('');
  /** The hint text shown under the label */
  hint = input('');
  /** Prefix used for id/name (so you can render multiple on one page) */
  idPrefix = input('text-input');
  /** Optional width class (e.g. 'govuk-input--width-10') */
  widthClass = input('govuk-input--width-10');
  listId = input<string | undefined>(undefined);
  suggestions = input<
    {
      value: string;
      label?: string;
      [key: string]: unknown;
    }[]
  >([]);
  submitted = input(false);
  suppressError = input(false);
  charLimit = input(200);
  error = input<string | null>(null);
  inputType = input<'email' | 'text' | 'tel'>('text');
  containerWidth = input<string>('govuk-grid-column-one-quarter');

  typed = output<string>();

  valueState = signal<string | null>(null);
  disabledState = signal(false);

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(obj: string | null): void {
    this.valueState.set(obj);
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let val = target.value ?? '';

    const limit = this.charLimit();
    if (limit && val.length > limit) {
      val = val.slice(0, limit);
      target.value = val;
    }

    this.valueState.set(val);
    this.onChange(val);
    this.typed.emit(val);
  }

  get errorState(): boolean {
    const v: unknown = this.valueState();

    let isEmpty = false;

    if (v === null || v === undefined) {
      isEmpty = true;
    } else if (typeof v === 'string') {
      isEmpty = v.trim().length === 0;
    } // If non string we keep false

    if (this.error()) {
      return true;
    }

    if (this.suppressError()) {
      return false;
    }

    return this.submitted() && isEmpty;
  }
}
