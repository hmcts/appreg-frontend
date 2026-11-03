import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { NavigationWarningComponent } from '@components/navigation-warning/navigation-warning.component';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
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
  imports: [ReactiveFormsModule, DateTimePipe, NavigationWarningComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './payment-reference-edit.component.html',
})
export class PaymentReferenceEditComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly navigationWarning = viewChild(NavigationWarningComponent);
  readonly hasUnsavedEntry = signal(false);
  private entryReturnUrl: string | undefined;
  private entryReturnState: Record<string, unknown> = {};
  private readonly initialReference = signal<string | undefined>(undefined);

  row: Row | null = null;
  paymentReference = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(15)],
  });
  private readonly referenceValue = toSignal(
    this.paymentReference.valueChanges,
    {
      initialValue: '',
    },
  );
  readonly hasUnsavedReference = computed(() => {
    const initial = this.initialReference();
    return initial !== undefined && this.referenceValue() !== initial;
  });
  readonly hasUnsavedChanges = computed(
    () => this.hasUnsavedEntry() || this.hasUnsavedReference(),
  );

  submitted = signal(false);

  get statusDateRaw(): string | undefined {
    const value = this.row?.['statusDateRaw'];
    return typeof value === 'string' ? value : undefined;
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const maybeRow: unknown = (history.state as { row?: unknown } | null)?.row;

    if (!isRowLike(maybeRow)) {
      void this.router.navigate(['../'], {
        relativeTo: this.route,
        queryParamsHandling: 'preserve',
      });
      return;
    }

    this.row = maybeRow;
    // Capture before popstate changes history.state to the destination ALE's state.
    const { row, ...returnState } = history.state as Record<string, unknown>;
    this.entryReturnState = returnState;

    const protection = (
      history.state as { aleDraftProtection?: unknown } | null
    )?.aleDraftProtection;
    if (isRowLike(protection) && typeof protection['returnUrl'] === 'string') {
      this.hasUnsavedEntry.set(protection['active'] === true);
      this.entryReturnUrl = protection['returnUrl'];
    }

    const currentRef =
      typeof this.row['paymentReference'] === 'string'
        ? this.row['paymentReference']
        : '';

    this.paymentReference.setValue(currentRef);
    if (this.entryReturnUrl !== undefined) {
      this.initialReference.set(currentRef);
    }
  }

  canLeave(): boolean | Observable<boolean> {
    const navigation = this.router.currentNavigation();
    const returningToEntry =
      this.entryReturnUrl !== undefined &&
      navigation?.extractedUrl.toString().split(/[?#]/, 1)[0] ===
        this.entryReturnUrl;
    // Only a validated Save may discard the reference editor without a warning.
    if (
      returningToEntry &&
      navigation?.trigger === 'imperative' &&
      navigation?.extras.state?.['aleDraftReturn'] === true &&
      navigation.extras.state['paymentRefReturn'] !== undefined
    ) {
      return true;
    }

    const changed =
      this.hasUnsavedReference() ||
      (!returningToEntry && this.hasUnsavedEntry());
    const decision = this.navigationWarning()?.canLeave(changed) ?? !changed;
    const preserveEntry = (): void => {
      if (returningToEntry && navigation) {
        // Browser Back has no return snapshot; attach it before the router activates the ALE.
        navigation.extras.state = this.buildReturnState({
          focusId: 'civil-fee-section',
        });
      }
    };
    if (typeof decision === 'boolean') {
      if (decision) {
        preserveEntry();
      }
      return decision;
    }
    return decision.pipe(
      tap((leave) => {
        if (leave) {
          preserveEntry();
        }
      }),
    );
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
    return {
      ...this.entryReturnState,
      ...extraState,
      ...(this.entryReturnUrl && extraState['paymentRefReturn'] !== undefined
        ? { aleDraftReturn: true }
        : {}),
    };
  }
}
