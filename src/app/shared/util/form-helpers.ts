/* 
Form group helper functions
*/

import { AbstractControl, FormGroup } from '@angular/forms';

function markControlClean(control: AbstractControl): void {
  control.markAsPristine();
  control.markAsUntouched();
  control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
}

/*
Marks all controls of a FormGroup as pristine/untouched
*/
export function markFormGroupClean(group: FormGroup): void {
  const controls = Object.values(group.controls);

  for (const ctrl of controls) {
    markControlClean(ctrl);
  }
}

export function readText(form: FormGroup, path: string): string {
  const control: AbstractControl | null = form.get(path);

  if (!control) {
    return '';
  }

  const value: unknown = control.value;

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }

  return '';
}
