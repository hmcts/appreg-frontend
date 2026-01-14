import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { RowLike } from '@components/sortable-table/sortable-table.component';

function isRowLike(value: unknown): value is RowLike {
  return typeof value === 'object' && value !== null;
}

const requiredValidator = (control: AbstractControl): ValidationErrors | null =>
  Validators.required(control);

const PAYMENT_REF_EDIT_ERRORS = {
  paymentReference: {
    required: 'Enter a payment reference',
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

  row: RowLike | null = null;
  paymentReference = new FormControl<string>('', {
    nonNullable: true,
    validators: [requiredValidator, Validators.maxLength(15)],
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

    if (errors['required']) {
      return map.required;
    }
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
      state: {
        paymentRefReturn: {
          updatedRowId,
          newPaymentReference: this.paymentReference.value,
        },
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['../'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
      state: { focusId: 'civil-fee-section' }, // TODO: Implement a scroll service to focus on certain elements on navigation
    });
  }
}
