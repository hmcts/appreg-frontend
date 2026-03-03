import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Row } from '@core-types/table/row.types';

function isRowLike(value: unknown): value is Row {
  return typeof value === 'object' && value !== null;
}

const PAYMENT_REF_EDIT_ERRORS = {
  paymentReference: {
    maxlength: 'Payment reference must be less than or equal to 15 characters',
  },
};

@Component({
  selector: 'app-payment-reference-edit',
  imports: [ReactiveFormsModule],
  templateUrl: './payment-reference-edit.component.html',
})
export class PaymentReferenceEditComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  row: Row | null = null;
  paymentReference = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(15)],
  });

  submitted = signal(false);

  ngOnInit(): void {
    const maybeRow: unknown = (history.state as { row?: unknown }).row;

    if (!isRowLike(maybeRow)) {
      void this.router.navigate(['../'], {
        relativeTo: this.route,
        queryParamsHandling: 'preserve',
      });
      return;
    }

    this.row = maybeRow;

    const currentRef =
      typeof this.row['paymentReference'] === 'string'
        ? this.row['paymentReference']
        : '';

    this.paymentReference.setValue(currentRef);
  }

  isPaymentReferenceInvalid(): boolean {
    const c = this.paymentReference;
    return c.invalid && (c.touched || c.dirty || this.submitted());
  }

  getPaymentReferenceError(): string | null {
    const errors = this.paymentReference.errors;
    if (!errors) {
      return null;
    }

    const map = PAYMENT_REF_EDIT_ERRORS.paymentReference;

    if (errors['maxlength']) {
      return map.maxlength;
    }

    return null;
  }

  save(): void {
    this.submitted.set(true);

    this.paymentReference.markAsTouched();
    this.paymentReference.updateValueAndValidity({ emitEvent: false });

    if (!this.row || this.paymentReference.invalid) {
      return;
    }

    const updatedRowId =
      typeof this.row['rowId'] === 'string' ? this.row['rowId'] : null;
    if (!updatedRowId) {
      return;
    }

    void this.router.navigate(['../'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
      state: this.buildReturnState({
        paymentRefReturn: {
          updatedRowId,
          newPaymentReference: this.paymentReference.value,
        },
      }),
    });
  }

  cancel(): void {
    void this.router.navigate(['../'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
      state: this.buildReturnState({ focusId: 'civil-fee-section' }), // TODO: Implement a scroll service to focus on certain elements on navigation
    });
  }

  private buildReturnState(
    extraState: Record<string, unknown>,
  ): Record<string, unknown> {
    const current = (history.state ?? {}) as Record<string, unknown>;
    const { row, ...rest } = current;
    return { ...rest, ...extraState };
  }
}
