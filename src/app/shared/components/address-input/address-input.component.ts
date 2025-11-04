// address-group.component.ts
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

export interface AddressValue {
  line1: string | null;
  line2: string | null;
  town: string | null;
  county: string | null;
  postcode: string | null;
}

const RE_UK_POSTCODE = /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i;

function toInputString(this: void, raw: unknown): string | null {
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

export function ukPostcodeValidator(
  this: void,
  c: AbstractControl,
): ValidationErrors | null {
  const s = toInputString(c.value);
  if (s === null) {
    return null;
  }

  const trimmed = s.trim();
  if (trimmed === '') {
    return null;
  }

  const upper = trimmed.toUpperCase();
  return RE_UK_POSTCODE.test(upper) ? null : { ukPostcode: true };
}

@Component({
  selector: 'app-address-group',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressInputComponent),
      multi: true,
    },
  ],
})
export class AddressInputComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  @Input() legend = 'What is your address?';
  @Input() idPrefix = 'address';

  @Input() requiredLine1 = true;
  @Input() requiredTown = true;
  @Input() requiredPostcode = true;
  @Input() validateUkPostcode = false;

  @Input() showError = false;

  @Input() errorTextLine1 =
    'Enter address line 1, typically the building and street';
  @Input() errorTextTown = 'Enter town or city';
  @Input() errorTextPostcodeRequired = 'Enter postcode';
  @Input() errorTextPostcodeInvalid = 'Enter a full UK postcode';

  form: FormGroup<{
    line1: FormControl<string | null>;
    line2: FormControl<string | null>;
    town: FormControl<string | null>;
    county: FormControl<string | null>;
    postcode: FormControl<string | null>;
  }> = new FormGroup({
    line1: new FormControl<string | null>(null),
    line2: new FormControl<string | null>(null),
    town: new FormControl<string | null>(null),
    county: new FormControl<string | null>(null),
    postcode: new FormControl<string | null>(null),
  });

  private sub?: Subscription;
  private onChange: (v: AddressValue | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const required: (ctrl: AbstractControl) => ValidationErrors | null = (
      ctrl,
    ) => Validators.required(ctrl);

    if (this.requiredLine1) {
      this.form.controls.line1.addValidators(required);
    }
    if (this.requiredTown) {
      this.form.controls.town.addValidators(required);
    }
    if (this.requiredPostcode) {
      this.form.controls.postcode.addValidators(required);
    }
    if (this.validateUkPostcode) {
      this.form.controls.postcode.addValidators(ukPostcodeValidator);
    }

    this.sub = this.form.valueChanges.subscribe((v) =>
      this.onChange(v as AddressValue),
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // CVA
  writeValue(v: AddressValue | null | undefined): void {
    const value: AddressValue = {
      line1: v?.line1 ?? null,
      line2: v?.line2 ?? null,
      town: v?.town ?? null,
      county: v?.county ?? null,
      postcode: v?.postcode ?? null,
    };
    this.form.patchValue(value, { emitEvent: false });
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: AddressValue | null) => void): void {
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

  // Errors
  get line1ErrorId(): string {
    return `${this.idPrefix}-line-1-error`;
  }

  get townErrorId(): string {
    return `${this.idPrefix}-town-error`;
  }

  get postcodeErrorId(): string {
    return `${this.idPrefix}-postcode-error`;
  }

  get showLine1Error(): boolean {
    const c = this.form.controls.line1;
    return c.invalid && this.showError;
  }

  get showTownError(): boolean {
    const c = this.form.controls.town;
    return c.invalid && this.showError;
  }

  get showPostcodeError(): boolean {
    const c = this.form.controls.postcode;
    return c.invalid && this.showError;
  }

  get postcodeErrorText(): string {
    const errs = this.form.controls.postcode.errors || {};
    if (errs['required']) {
      return this.errorTextPostcodeRequired;
    }
    if (errs['ukPostcode'] || errs['pattern']) {
      return this.errorTextPostcodeInvalid;
    }
    return this.errorTextPostcodeRequired;
  }
}
