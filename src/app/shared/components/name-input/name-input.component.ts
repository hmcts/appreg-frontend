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
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

export interface NameValue {
  firstName: string | null;
  lastName: string | null;
}

@Component({
  selector: 'app-name-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './name-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NameInputComponent),
      multi: true,
    },
  ],
})
export class NameInputComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  // fieldset and ids
  @Input() legend = 'Full name';
  @Input() idPrefix = 'full-name';

  // labels
  @Input() firstLabel = 'First name';
  @Input() lastLabel = 'Last name';

  // validation toggles
  @Input() requiredFirst = true;
  @Input() requiredLast = true;

  // parent-controlled error reveal
  @Input() showError = false;

  // error texts
  @Input() errorTextFirst = 'Enter your first name';
  @Input() errorTextLast = 'Enter your last name';

  // typed form
  form: FormGroup<{
    firstName: FormControl<string | null>;
    lastName: FormControl<string | null>;
  }> = new FormGroup({
    firstName: new FormControl<string | null>(null),
    lastName: new FormControl<string | null>(null),
  });

  private sub?: Subscription;
  private onChange: (v: NameValue | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const required: (c: AbstractControl) => ValidationErrors | null = (c) =>
      Validators.required(c);
    if (this.requiredFirst) {
      this.form.controls.firstName.addValidators(required);
    }
    if (this.requiredLast) {
      this.form.controls.lastName.addValidators(required);
    }

    this.sub = this.form.valueChanges.subscribe((v) =>
      this.onChange(v as NameValue),
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // CVA
  writeValue(v: NameValue | null | undefined): void {
    const value: NameValue = {
      firstName: v?.firstName ?? null,
      lastName: v?.lastName ?? null,
    };
    this.form.patchValue(value, { emitEvent: false });
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: NameValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    if (disabled) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  markTouched(): void {
    this.onTouched();
  }

  // ids
  get firstId(): string {
    return `${this.idPrefix}-first`;
  }
  get lastId(): string {
    return `${this.idPrefix}-last`;
  }
  get firstErrId(): string {
    return `${this.firstId}-error`;
  }
  get lastErrId(): string {
    return `${this.lastId}-error`;
  }

  // error gating
  get showFirstError(): boolean {
    const c = this.form.controls.firstName;
    return c.invalid && this.showError;
  }
  get showLastError(): boolean {
    const c = this.form.controls.lastName;
    return c.invalid && this.showError;
  }
}
