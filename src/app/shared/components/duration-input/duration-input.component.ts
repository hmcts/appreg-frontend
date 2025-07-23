import { Component, forwardRef, Input } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface Duration {
  hours: number | null;
  minutes: number | null;
}

@Component({
  selector: 'app-duration-input',
  standalone: true,
  imports: [ CommonModule, FormsModule, ReactiveFormsModule ],
  templateUrl: './duration-input.component.html',
  styleUrls: ['./duration-input.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DurationInputComponent),
    multi: true
  }]
})
export class DurationInputComponent implements ControlValueAccessor {
  /** Label text above the inputs */
  @Input() label = 'Duration';
  /** Hint text below the label */
  @Input() hint = '';
  /** Prefix for id/name attrs (so you can have multiple on one page) */
  @Input() idPrefix = 'duration';

  /** Internal model */
  hours: number | null = null;
  minutes: number | null = null;

  disabled = false;
  private onChange: (value: Duration | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Duration | null): void {
    if (value) {
      this.hours = value.hours;
      this.minutes = value.minutes;
    } else {
      this.hours = this.minutes = null;
    }
  }

  registerOnChange(fn: any): void   { this.onChange = fn; }
  registerOnTouched(fn: any): void  { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Call whenever either input changes */
  private propagate() {
    const out: Duration = {
      hours: this.hours,
      minutes: this.minutes
    };
    // only emit once we’ve touched it
    this.onChange(out);
  }

  onHoursInput(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    this.hours = isNaN(val) ? null : val;
    this.propagate();
  }

  onMinutesInput(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    this.minutes = isNaN(val) ? null : val;
    this.propagate();
  }

  // mark as touched on blur of either input
  touch() {
    this.onTouched();
  }
}
