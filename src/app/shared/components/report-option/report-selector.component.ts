import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ReportOption {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-report-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReportSelectorComponent),
      multi: true
    }
  ],
  templateUrl: './report-selector.component.html'
})
export class ReportSelectorComponent implements ControlValueAccessor {
  /** Required: the list of radio options */
  @Input({ required: true }) options: ReportOption[] = [];
  /** Heading text in the legend */
  @Input() legend = 'Select an option';
  /** Radio group name (use a unique name per instance) */
  @Input() name = 'report';
  /** Prefix for the input/label IDs (unique per instance is ideal) */
  @Input() idPrefix = 'report';
  /** Optional aria-describedby id */
  @Input() ariaDescribedBy?: string;

  disabled = false;
  value: string | null = null;

  onChange: (v: string | null) => void = () => {
  };
  onTouched: () => void = () => {
  };

  writeValue(v: string | null): void {
    this.value = v;
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

  onModelChange(v: string): void {
    this.value = v;
    this.onChange(v);
  }
}
