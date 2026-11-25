import { DestroyRef, signal } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

import type { ErrorItem } from '@components/error-summary/error-summary.component';

type CaptureCompositeError = (
  error: ErrorItem | undefined,
  clear?: boolean,
) => void;
const compositeFields = new WeakMap<AbstractControl, CaptureCompositeError>();

/**
 * Associates an Angular control with its component’s capture callback.
 * Skips duplicate registrations and removes the callback when the component is destroyed.
 *
 * @param control
 * @param capture
 * @param destroyRef
 * @returns
 */
export function registerCompositeError(
  control: AbstractControl,
  capture: CaptureCompositeError,
  destroyRef: DestroyRef,
): void {
  if (compositeFields.get(control) === capture) {
    return;
  }

  compositeFields.set(control, capture);
  destroyRef.onDestroy(() => {
    if (compositeFields.get(control) === capture) {
      compositeFields.delete(control);
    }
  });
}

/**
 * Goes through a formgroup (recursive for nested groups/arrays) passing a clear flag and matching error to the
 * component.
 *
 * @param form
 * @param errors
 * @param clear
 * @param path
 */
export function captureCompositeErrors(
  form: FormGroup,
  errors: readonly ErrorItem[],
  clear = false,
  path = '',
): void {
  for (const [name, control] of Object.entries(form.controls)) {
    const id = path ? `${path}.${name}` : name;

    if (control instanceof FormGroup) {
      captureCompositeErrors(control, errors, clear, id);
    } else {
      compositeFields.get(control)?.(
        errors.find((error) => error.id === id),
        clear,
      );
    }
  }
}

/**
 * Class that captures validation errors in a form so we can retain inline errors
 * and is cleared on resubmission. Capturing new errors will write new overs existing ones.
 */
export class SubmittedFieldErrors {
  private readonly errors = signal<readonly ErrorItem[]>([]);
  readonly items = this.errors.asReadonly();

  // Store errors, will write over existing errors
  capture(errors: readonly ErrorItem[], form?: FormGroup): void {
    this.errors.set(errors.map((error) => ({ ...error })));
    if (form) {
      captureCompositeErrors(form, errors);
    }
  }

  clear(form?: FormGroup): void {
    this.errors.set([]);
    if (form) {
      captureCompositeErrors(form, [], true);
    }
  }

  // Returns the first saved error for a field, or undefined
  errorFor(fieldId: string): ErrorItem | undefined {
    return this.errors().find(
      (error) => (error.id ?? error.href?.slice(1)) === fieldId,
    );
  }
  hasError(fieldId: string): boolean {
    return !!this.errorFor(fieldId);
  }
}
