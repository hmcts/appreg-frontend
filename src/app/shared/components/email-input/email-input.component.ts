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

@Component({
  selector: 'app-email-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './email-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmailInputComponent),
      multi: true,
    },
  ],
})
export class EmailInputComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  // a11y and content
  @Input() id = 'email';
  @Input() name = 'email';
  @Input() label = 'Email address';
  @Input() hint: string | null = null;

  // validation toggles
  @Input() required = true;
  @Input() validateEmailFormat = true;

  // parent-controlled error reveal (e.g. after submit)
  @Input() showError = false;

  // error messages
  @Input() errorTextRequired = 'Enter an email address';
  @Input() errorTextInvalid =
    'Enter an email address in the correct format, like name@example.com';

  control = new FormControl<string | null>(null);
  private sub?: Subscription;

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // wrap to satisfy unbound-method lint
    const required: (c: AbstractControl) => ValidationErrors | null = (c) =>
      Validators.required(c);
    const email: (c: AbstractControl) => ValidationErrors | null = (c) =>
      Validators.email(c);

    if (this.required) {
      this.control.addValidators(required);
    }
    if (this.validateEmailFormat) {
      this.control.addValidators(email);
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

  // template helpers
  get hintId(): string {
    return `${this.id}-hint`;
  }

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
    if (e['email']) {
      return this.errorTextInvalid;
    }
    return this.errorTextRequired;
  }

  get describedBy(): string | null {
    const ids: string[] = [];
    if (this.hint) {
      ids.push(this.hintId);
    }
    if (this.showFieldError) {
      ids.push(this.errorId);
    }
    return ids.length ? ids.join(' ') : null;
  }
}
