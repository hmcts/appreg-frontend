import { Component, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
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
export class CivilFeeSectionComponent {
  router = inject(Router);
  route = inject(ActivatedRoute);

  readonly entryId = this.route.snapshot.paramMap.get('id');

  feeForm = input.required<CivilFeeForm>();
  civilFeeColumns = input.required<TableColumn[]>();
  feeStatusOptions = input.required<{ value: string; label: string }[]>();
  feeMeta = input<CivilFeeMeta | null>(null);

  civilFeeErrors = output<ErrorItem[]>();
  addFeeDetails = output<AddFeeDetailsPayload>();
  offsiteFeeChanged = output<boolean>();

  submitted = signal(false);

  // Application code returns whether a fee is required
  feeRequired = input<boolean>(false);

  feeStatusOptionsWithPlaceholder = (): {
    value: string;
    label: string;
    disabled?: boolean;
  }[] => [
    { value: '', label: 'Select fee status', disabled: true },
    ...this.feeStatusOptions(),
  ];

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

    //Lazy attach validators so they don't show on parent update
    f.feeStatus.setValidators([(c) => Validators.required(c)]);
    f.feeStatusDate.setValidators([(c) => Validators.required(c)]);
    f.paymentRef.setValidators([(c) => Validators.maxLength(15)(c)]);

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
        statusDateRaw: fs.statusDate, // e.g. 2025-10-25 (sort-friendly)
      };
    });

  onChangePaymentReference = (row: Row): void => {
    if (!row['paymentReference']) {
      return;
    }

    void this.router.navigate(['change-payment-reference'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
      state: { row },
    });
  };

  private clearCivilFeeInputsAndErrors(): void {
    const f = this.feeForm().controls;

    f.feeStatus.reset(null, { emitEvent: false });
    f.feeStatusDate.reset(null, { emitEvent: false });
    f.paymentRef.reset(null, { emitEvent: false });

    markFormGroupClean(this.feeForm());
  }
}
