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
