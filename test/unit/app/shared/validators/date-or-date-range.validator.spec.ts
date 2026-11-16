import { FormControl, FormGroup } from '@angular/forms';

import { singleDateOrDateRangeValidator } from '@validators/date-or-date-range.validator';

describe('singleDateOrDateRangeValidator', () => {
  const mkForm = () =>
    new FormGroup({
      date: new FormControl<string | null>(null),
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
    });

  it('returns null when called with a non-FormGroup control', () => {
    const validator = singleDateOrDateRangeValidator();

    expect(validator(new FormControl('x'))).toBeNull();
  });

  it('sets singleDateOrDateRange on date when date and a full date range are given', () => {
    const form = mkForm();
    form.controls.date.setValue('2026-05-21');
    form.controls.dateFrom.setValue('2026-05-01');
    form.controls.dateTo.setValue('2026-05-31');

    const validator = singleDateOrDateRangeValidator();
    const result = validator(form);

    expect(result).toEqual({ singleDateOrDateRange: true });
    expect(form.controls.date.errors).toEqual({ singleDateOrDateRange: true });
    expect(form.controls.dateFrom.errors).toBeNull();
    expect(form.controls.dateTo.errors).toBeNull();
  });

  it.each([
    ['Date from', 'dateFrom'],
    ['Date to', 'dateTo'],
  ] as const)(
    'sets singleDateOrDateRange on date when date and only %s are given',
    (_label, controlName) => {
      const form = mkForm();
      form.controls.date.setValue('2026-05-21');
      form.controls[controlName].setValue('2026-05-01');

      const result = singleDateOrDateRangeValidator()(form);

      expect(result).toEqual({ singleDateOrDateRange: true });
      expect(form.controls.date.errors).toEqual({
        singleDateOrDateRange: true,
      });
    },
  );

  it('does not set singleDateOrDateRange when only date is given', () => {
    const form = mkForm();
    form.controls.date.setValue('2026-05-21');

    const result = singleDateOrDateRangeValidator()(form);

    expect(result).toBeNull();
    expect(form.controls.date.errors).toBeNull();
  });

  it('does not set singleDateOrDateRange when only a date range is given', () => {
    const form = mkForm();
    form.controls.dateFrom.setValue('2026-05-01');
    form.controls.dateTo.setValue('2026-05-31');

    const result = singleDateOrDateRangeValidator()(form);

    expect(result).toBeNull();
    expect(form.controls.date.errors).toBeNull();
  });

  it('does not set singleDateOrDateRange when no dates are given', () => {
    const result = singleDateOrDateRangeValidator()(mkForm());

    expect(result).toBeNull();
  });

  it('treats blank and whitespace-only values as missing', () => {
    const form = mkForm();
    form.controls.date.setValue('2026-05-21');
    form.controls.dateFrom.setValue('');
    form.controls.dateTo.setValue('   ');

    singleDateOrDateRangeValidator()(form);

    expect(form.controls.date.errors).toBeNull();
  });

  it('clears only its own error when the date range is removed', () => {
    const form = mkForm();
    form.controls.date.setValue('2026-05-21');
    form.controls.dateFrom.setValue('2026-05-01');
    singleDateOrDateRangeValidator()(form);

    form.controls.date.setErrors({
      dateInvalid: true,
      singleDateOrDateRange: true,
    });
    form.controls.dateFrom.setValue(null);
    singleDateOrDateRangeValidator()(form);

    expect(form.controls.date.errors).toEqual({ dateInvalid: true });
  });

  it('supports custom control names and error keys', () => {
    const form = new FormGroup({
      listDate: new FormControl<string | null>('2026-05-21'),
      startDate: new FormControl<string | null>('2026-05-01'),
      endDate: new FormControl<string | null>(null),
    });

    singleDateOrDateRangeValidator(
      'listDate',
      'startDate',
      'endDate',
      'dateAndRange',
    )(form);

    expect(form.controls.listDate.errors).toEqual({ dateAndRange: true });
  });
});
