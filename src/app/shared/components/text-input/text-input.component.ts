import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
} from '@angular/core';
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
  @Input() label = '';
  /** The hint text shown under the label */
  @Input() hint = '';
  /** Prefix used for id/name (so you can render multiple on one page) */
  @Input() idPrefix = 'text-input';
  /** Optional width class (e.g. 'govuk-input--width-10') */
  @Input() widthClass = 'govuk-input--width-10';
  @Input() listId?: string;
  @Input() suggestions: {
    value: string;
    label?: string;
    [key: string]: unknown;
  }[] = [];
  @Input() submitted = false;
  @Input() suppressError = false;
  @Input() charLimit: number = 200;

  @Output() typed = new EventEmitter<string>();

  value: string | null = null;
  disabled = false;

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

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

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let val = target.value ?? '';

    if (this.charLimit && val.length > this.charLimit) {
      val = val.slice(0, this.charLimit);
      target.value = val;
    }

    this.value = val;
    this.onChange(val);
    this.typed.emit(val);
  }
}
