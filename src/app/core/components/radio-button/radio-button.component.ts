import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type RadioOption = {
  label: string;
  value: StringBoolNull;
  hint?: string;
  disabled?: boolean;
};

type StringBoolNull = string | boolean | null;

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
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly legend = input.required<string>();
  readonly options = input.required<RadioOption[]>();

  readonly idPrefix = input('radio');
  readonly name = input<string | undefined>();
  readonly size = input<'s' | 'm' | 'l'>('l');
  readonly hint = input<string | undefined>();
  readonly containerWidthClass = input('');

  // Error display controlled by parent
  readonly showError = input(false);
  readonly errorText = input('Select an option');

  readonly buttonsInline = input(false);

  value: StringBoolNull = null;
  disabled = false;

  // CVA
  private _onChange: (v: StringBoolNull) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(v: StringBoolNull): void {
    this.value = v ?? null;
    this.changeDetector.markForCheck();
  }
  registerOnChange(fn: (v: StringBoolNull) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.changeDetector.markForCheck();
  }

  onSelect(v: StringBoolNull): void {
    if (this.disabled) {
      return;
    }
    this.value = v;
    this._onChange(v);
    this._onTouched();
  }

  radioValue(value: StringBoolNull): string {
    return value === null ? '' : String(value);
  }

  get fieldsetLegendClass(): string {
    switch (this.size()) {
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
      ids.push(`${this.idPrefix()}-hint`);
    }
    if (errorPresent) {
      ids.push(`${this.idPrefix()}-error`);
    }
    return ids.length ? ids.join(' ') : null;
  }
}
