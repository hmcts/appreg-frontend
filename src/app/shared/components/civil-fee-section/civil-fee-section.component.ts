import {
  Component,
  Injector,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  runInInjectionContext,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DateInputComponent } from '@components/date-input/date-input.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TableColumn } from '@components/selectable-sortable-table/selectable-sortable-table.component';
import { SortableTableComponent } from '@components/sortable-table/sortable-table.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { CIVIL_FEE_FIELD_MESSAGES } from '@constants/application-list-entry/error-messages';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import { Row } from '@core-types/table/row.types';
import { FeeStatus, PaymentStatus } from '@openapi';
import {
  AddFeeDetailsPayload,
  CivilFeeMeta,
} from '@shared-types/civil-fee/civil-fee';
import { buildCivilFeeHeading, feeStatusRowId } from '@util/civil-fee-utils';
import { markFormGroupClean } from '@util/form-helpers';

export type CivilFeeForm = FormGroup<{
  hasOffsiteFee: FormControl<boolean | null>;
  feeStatus: FormControl<string | null>;
  feeStatusDate: FormControl<string | null>;
  paymentRef: FormControl<string | null>;
  feeStatuses: FormControl<FeeStatus[] | null>;
}>;

type CivilFeeValidatedControlName = keyof typeof CIVIL_FEE_FIELD_MESSAGES;

@Component({
  selector: 'app-civil-fee-section',
  imports: [
    SortableTableComponent,
    SelectInputComponent,
    DateInputComponent,
    TextInputComponent,
    ReactiveFormsModule,
    DateTimePipe,
  ],
  templateUrl: './civil-fee-section.component.html',
})
export class CivilFeeSectionComponent implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);

  readonly entryId = this.route.snapshot.paramMap.get('id');

  feeForm = input.required<CivilFeeForm>();
  civilFeeColumns = input.required<TableColumn[]>();
  feeStatusOptions = input.required<{ value: string; label: string }[]>();
  feeMeta = input<CivilFeeMeta | null>(null);
  changePaymentReferenceStateFactory = input<
    (() => Record<string, unknown>) | null
  >(null);

  civilFeeErrors = output<ErrorItem[]>();
  addFeeDetails = output<AddFeeDetailsPayload>();
  offsiteFeeChanged = output<boolean>();

  submitted = signal(false);
  parentSubmitted = input(false);

  // Application code returns whether a fee is required
  feeRequired = input<boolean>(false);

  ngOnInit(): void {
    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (!this.parentSubmitted()) {
          return;
        }
        this.attachValidatorsForSubmitAttempt();
      });
    });
  }

  // Show error msg with both parent and child form submission
  readonly showErrors = computed(() => {
    const f = this.feeForm().controls;
    const feeRowsEmpty = (f.feeStatuses.value ?? []).length === 0;

    if (this.feeRequired() && feeRowsEmpty) {
      return this.submitted() || this.parentSubmitted();
    }

    return false;
  });

  readonly feeStatusOptionsWithPlaceholder = computed<
    { value: string; label: string; disabled?: boolean }[]
  >(() => {
    // Disable unselection if fee is required and there's no fees associated
    const feesAreRequiredAndEmpty =
      this.feeRequired() &&
      (this.feeForm().controls.feeStatuses.value ?? []).length === 0;

    return [
      {
        value: '',
        label: 'Select fee status',
        disabled: feesAreRequiredAndEmpty,
      },
      ...this.feeStatusOptions(),
    ];
  });

  offSiteFee = (): boolean =>
    this.feeForm().controls.hasOffsiteFee.value === true;

  onOffsiteFeeChange(event?: Event): void {
    const ctrl = this.feeForm().controls.hasOffsiteFee;
    const current = ctrl.value === true;
    const next = !current;

    // Keyboard: prevent native toggle so it doesn't double-fire / race
    if (event instanceof KeyboardEvent) {
      event.preventDefault();

      // Because we prevented the browser toggle, update the control ourselves
      ctrl.setValue(next, { emitEvent: false });
    }

    this.offsiteFeeChanged.emit(next);
  }

  onAddFeeDetailsClick(): void {
    this.submitted.set(true);
    const f = this.feeForm().controls;

    // Lazy attach validators so they do not show on parent update.
    f.feeStatus.setValidators([(c) => Validators.required(c)]);
    f.feeStatusDate.setValidators([(c) => Validators.required(c)]);
    f.paymentRef.setValidators([
      this.paymentRefNotAllowedWhenDueValidator,
      (c) => Validators.maxLength(15)(c),
    ]);

    f.feeStatus.updateValueAndValidity({ emitEvent: false });
    f.feeStatusDate.updateValueAndValidity({ emitEvent: false });
    f.paymentRef.updateValueAndValidity({ emitEvent: false });

    f.feeStatus.markAsTouched();
    f.feeStatusDate.markAsTouched();
    f.paymentRef.markAsTouched();

    this.emitCivilFeeErrors();

    if (
      f.feeStatus.invalid ||
      f.feeStatusDate.invalid ||
      f.paymentRef.invalid
    ) {
      return;
    }

    const payload: AddFeeDetailsPayload = {
      feeStatus: f.feeStatus.value?.trim() as PaymentStatus,
      statusDate: (f.feeStatusDate.value ?? '').trim(),
      paymentReference: (f.paymentRef.value ?? null)?.trim() || null,
    };

    this.addFeeDetails.emit(payload);

    this.submitted.set(false);
    this.clearCivilFeeInputsAndErrors();
  }

  private emitCivilFeeErrors(): void {
    const entries: ErrorItem[] = [];

    (['feeStatus', 'feeStatusDate', 'paymentRef'] as const).forEach((name) => {
      this.getControlErrorMessages(name).forEach((message) => {
        entries.push({ id: name, text: message });
      });
    });

    this.civilFeeErrors.emit(entries);
  }

  getControlErrorMessages(controlName: CivilFeeValidatedControlName): string[] {
    const ctrl = this.feeForm().controls[controlName];
    const errors = ctrl.errors;
    if (!errors) {
      return [];
    }

    const map = CIVIL_FEE_FIELD_MESSAGES[controlName] ?? {};

    return Object.keys(errors)
      .map((errorKey) => map[errorKey])
      .filter((msg): msg is string => !!msg);
  }

  isControlInvalid(controlName: keyof CivilFeeForm['controls']): boolean {
    const ctrl = this.feeForm().controls[controlName];
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  feeHeadingText(): string {
    return buildCivilFeeHeading(this.feeMeta() ?? {}, this.offSiteFee());
  }

  civilFeeColumnsWithChangeLink = (): TableColumn[] => [
    ...this.civilFeeColumns(),
    { header: 'Action', field: 'actions', sortable: false },
  ];

  feeStatusRows = (): Row[] =>
    (this.feeForm().controls.feeStatuses.value ?? []).map((fs) => {
      return {
        rowId: feeStatusRowId(fs),
        paymentReference: fs.paymentReference ?? '',
        paymentStatus: fs.paymentStatus,
        statusDateRaw: fs.statusDate, // e.g. 2025-10-25 (sort-friendly), in template is formatted
      };
    });

  onChangePaymentReference = (row: Row): void => {
    if (row['paymentStatus'] === 'DUE') {
      return;
    }

    const extraState = this.changePaymentReferenceStateFactory()?.() ?? {};

    void this.router.navigate(['change-payment-reference'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
      state: { ...extraState, row },
    });
  };

  private clearCivilFeeInputsAndErrors(): void {
    const f = this.feeForm().controls;

    f.feeStatus.reset(null, { emitEvent: false });
    f.feeStatusDate.reset(null, { emitEvent: false });
    f.paymentRef.reset(null, { emitEvent: false });

    markFormGroupClean(this.feeForm());
  }

  private readonly feeStatusesRequiredValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    if (!this.feeRequired()) {
      return null;
    }

    const v = control.value as unknown;
    const arr = Array.isArray(v) ? v : [];
    return arr.length > 0 ? null : { feeRequired: true };
  };

  // This attaches validators when the parent attempts to submit
  // Without this it will only attach when clicking civil-fee button
  private attachValidatorsForSubmitAttempt(): void {
    const f = this.feeForm().controls;

    f.feeStatuses.setValidators(
      this.feeRequired() ? [this.feeStatusesRequiredValidator] : [],
    );
    f.feeStatuses.updateValueAndValidity({ emitEvent: false });

    const feeRowsEmpty = (f.feeStatuses.value ?? []).length === 0;

    if (this.feeRequired() && feeRowsEmpty) {
      f.feeStatus.setValidators([(c) => Validators.required(c)]);
      f.feeStatusDate.setValidators([(c) => Validators.required(c)]);
    } else {
      f.feeStatus.setValidators([]);
      f.feeStatusDate.setValidators([]);
    }
    f.paymentRef.setValidators([
      this.paymentRefNotAllowedWhenDueValidator,
      (c) => Validators.maxLength(15)(c),
    ]);

    f.feeStatus.updateValueAndValidity({ emitEvent: false });
    f.feeStatusDate.updateValueAndValidity({ emitEvent: false });
    f.paymentRef.updateValueAndValidity({ emitEvent: false });

    f.feeStatuses.markAsTouched();
    f.feeStatus.markAsTouched();
    f.feeStatusDate.markAsTouched();
    f.paymentRef.markAsTouched();

    this.emitCivilFeeErrors();
  }

  private readonly paymentRefNotAllowedWhenDueValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const paymentRef = ((control.value as string) ?? '').toString().trim();
    if (!paymentRef) {
      return null;
    }

    const status = (this.feeForm().controls.feeStatus.value ?? '')
      .toString()
      .trim();
    return status === 'DUE' ? { invalidStatus: true } : null;
  };
}
