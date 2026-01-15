import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type RadioOption = {
  label: string;
  value: string;
  hint?: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-radio-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radio-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioButtonComponent),
      multi: true,
    },
  ],
})
export class RadioButtonComponent implements ControlValueAccessor {
  @Input({ required: true }) legend!: string;
  @Input({ required: true }) options: RadioOption[] = [];

  @Input() idPrefix = 'radio';
  @Input() name?: string;
  @Input() size: 's' | 'm' | 'l' = 'l';
  @Input() hint?: string;

  // Error display controlled by parent
  @Input() showError = false;
  @Input() errorText = 'Select an option';

  value: string | null = null;
  disabled = false;

  // CVA
  private _onChange: (v: string | null) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    this.value = v ?? null;
  }
  registerOnChange(fn: (v: string | null) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelect(v: string): void {
    if (this.disabled) {
      return;
    }
    this.value = v;
    this._onChange(v);
    this._onTouched();
  }

  get fieldsetLegendClass(): string {
    switch (this.size) {
      case 's':
        return 'govuk-fieldset__legend govuk-fieldset__legend--s';
      case 'm':
        return 'govuk-fieldset__legend govuk-fieldset__legend--m';
      default:
        return 'govuk-fieldset__legend govuk-fieldset__legend--l';
    }
  }

  describedById(hintPresent: boolean, errorPresent: boolean): string | null {
    const ids: string[] = [];
    if (hintPresent) {
      ids.push(`${this.idPrefix}-hint`);
    }
    if (errorPresent) {
      ids.push(`${this.idPrefix}-error`);
    }
    return ids.length ? ids.join(' ') : null;
  }
}
