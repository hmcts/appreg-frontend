import { FormControl, FormGroup } from '@angular/forms';

import { dateToOnOrAfterDateFromValidator } from '@validators/date-range.validator';

describe('dateToOnOrAfterDateFromValidator', () => {
  const mkForm = () =>
    new FormGroup({
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
    });

  it('returns null when called with a non-FormGroup control', () => {
    const validator = dateToOnOrAfterDateFromValidator();

    expect(validator(new FormControl('x'))).toBeNull();
  });

  it('sets dateRange on dateTo when Date to is before Date from', () => {
    const form = mkForm();
    form.controls.dateFrom.setValue('2026-05-21');
    form.controls.dateTo.setValue('2026-05-20');

    const validator = dateToOnOrAfterDateFromValidator();
    const result = validator(form);

    expect(result).toEqual({ dateRange: true });
    expect(form.controls.dateTo.errors).toEqual({ dateRange: true });
  });

  it('does not set dateRange when Date to is the same as Date from', () => {
    const form = mkForm();
    form.controls.dateFrom.setValue('2026-05-21');
    form.controls.dateTo.setValue('2026-05-21');

    dateToOnOrAfterDateFromValidator()(form);

    expect(form.controls.dateTo.errors).toBeNull();
  });

  it('does not set dateRange when Date to is after Date from', () => {
    const form = mkForm();
    form.controls.dateFrom.setValue('2026-05-21');
    form.controls.dateTo.setValue('2026-05-22');

    dateToOnOrAfterDateFromValidator()(form);

    expect(form.controls.dateTo.errors).toBeNull();
  });

  it('does not compare missing or non-ISO values', () => {
    const form = mkForm();
    form.controls.dateFrom.setValue('not-a-date');
    form.controls.dateTo.setValue('2026-05-20');

    dateToOnOrAfterDateFromValidator()(form);

    expect(form.controls.dateTo.errors).toBeNull();
  });

  it('clears only its own error when the date range becomes valid', () => {
    const form = mkForm();
    form.controls.dateFrom.setValue('2026-05-21');
    form.controls.dateTo.setValue('2026-05-20');
    form.controls.dateTo.setErrors({ required: true, dateRange: true });

    form.controls.dateTo.setValue('2026-05-22');
    form.controls.dateTo.setErrors({ required: true, dateRange: true });
    dateToOnOrAfterDateFromValidator()(form);

    expect(form.controls.dateTo.errors).toEqual({ required: true });
  });

  it('supports custom control names and error keys', () => {
    const form = new FormGroup({
      startDate: new FormControl<string | null>('2026-05-21'),
      endDate: new FormControl<string | null>('2026-05-20'),
    });

    dateToOnOrAfterDateFromValidator(
      'startDate',
      'endDate',
      'endBeforeStart',
    )(form);

    expect(form.controls.endDate.errors).toEqual({ endBeforeStart: true });
  });
});
