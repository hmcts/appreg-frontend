import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const dateNotInFuture =
  (): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (typeof value !== 'string' || value.trim() === '') {
      return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    const valueDate = new Date(year, month - 1, day);
    valueDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return valueDate.getTime() > today.getTime()
      ? { dateInFuture: true }
      : null;
  };
