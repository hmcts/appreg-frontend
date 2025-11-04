import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  forwardRef,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

function coerceToString(this: void, raw: unknown): string | null {
  if (raw === null) {
    return null;
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (typeof raw === 'number') {
    return String(raw);
  }
  return null;
}

function ukPhoneValidator(
  this: void,
  c: AbstractControl,
): ValidationErrors | null {
  const s = coerceToString(c.value);
  if (s === null) {
    return null;
  }
  const trimmed = s.trim();
  if (trimmed === '') {
    return null;
  }

  // strip spaces, dashes, parentheses
  let d = trimmed.replaceAll(/[^\d]/g, '');
  if (d.startsWith('0044')) {
    d = d.slice(2);
  } // 0044 = 44…

  const ok =
    (d.startsWith('0') && d.length === 11) || // national format, e.g. 07123456789
    (d.startsWith('44') && d.length === 12); // international, e.g. +447123456789 (after stripping)

  return ok ? null : { ukPhone: true };
}

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './phone-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
})
export class PhoneInputComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  @Input() id = 'phone-number';
  @Input() name = 'phoneNumber';
  @Input() label = 'UK phone number';
  @Input() widthClass = 'govuk-input--width-20';
  @Input() autocomplete = 'tel';

  @Input() required = true;
  @Input() validateUkPhone = true;

  @Input() showError = false;

  @Input() errorTextRequired = 'Enter a UK phone number';
  @Input() errorTextInvalid = 'Enter a UK phone number';

  control = new FormControl<string | null>(null);
  private sub?: Subscription;

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const required: (c: AbstractControl) => ValidationErrors | null = (c) =>
      Validators.required(c);
    if (this.required) {
      this.control.addValidators(required);
    }
    if (this.validateUkPhone) {
      this.control.addValidators(ukPhoneValidator);
    }

    this.sub = this.control.valueChanges.subscribe((v) => this.onChange(v));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // CVA
  writeValue(v: string | null | undefined): void {
    this.control.setValue(v ?? null, { emitEvent: false });
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    if (disabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  markTouched(): void {
    this.onTouched();
  }

  // error helpers
  get errorId(): string {
    return `${this.id}-error`;
  }

  get showFieldError(): boolean {
    const c = this.control;
    return c.invalid && this.showError;
  }

  get errorText(): string {
    const e = this.control.errors || {};
    if (e['required']) {
      return this.errorTextRequired;
    }
    if (e['ukPhone']) {
      return this.errorTextInvalid;
    }
    return this.errorTextRequired;
  }
}
