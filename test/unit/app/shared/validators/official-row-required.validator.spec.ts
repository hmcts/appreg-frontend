import { FormControl, FormGroup } from '@angular/forms';

import {
  OFFICIAL_ROW_INCOMPLETE_ERROR,
  officialRowRequiredValidator,
} from '@validators/official-row-required.validator';

describe('officialRowRequiredValidator', () => {
  const mkForm = () =>
    new FormGroup({
      title: new FormControl<string | null>(null),
      firstName: new FormControl<string | null>(null),
      surname: new FormControl<string | null>(null),
    });

  const validator = officialRowRequiredValidator(
    'title',
    'firstName',
    'surname',
  );

  it('returns null when called with a non-FormGroup control', () => {
    expect(validator(new FormControl('x'))).toBeNull();
  });

  it('returns null and sets no errors when the row is empty', () => {
    const form = mkForm();

    expect(validator(form)).toBeNull();
    expect(form.controls.firstName.errors).toBeNull();
    expect(form.controls.surname.errors).toBeNull();
  });

  it('requires first name and surname when only title is entered', () => {
    const form = mkForm();
    form.controls.title.setValue('HHJ');

    expect(validator(form)).toEqual({
      [OFFICIAL_ROW_INCOMPLETE_ERROR]: true,
    });
    expect(form.controls.firstName.errors).toEqual({ required: true });
    expect(form.controls.surname.errors).toEqual({ required: true });
    expect(form.controls.title.errors).toBeNull();
  });

  it('requires surname when title and first name are entered', () => {
    const form = mkForm();
    form.controls.title.setValue('DJ');
    form.controls.firstName.setValue('Ada');

    expect(validator(form)).toEqual({
      [OFFICIAL_ROW_INCOMPLETE_ERROR]: true,
    });
    expect(form.controls.firstName.errors).toBeNull();
    expect(form.controls.surname.errors).toEqual({ required: true });
  });

  it('does not require title when first name and surname are entered', () => {
    const form = mkForm();
    form.controls.firstName.setValue('Ada');
    form.controls.surname.setValue('Bench');

    expect(validator(form)).toBeNull();
    expect(form.controls.title.errors).toBeNull();
    expect(form.controls.firstName.errors).toBeNull();
    expect(form.controls.surname.errors).toBeNull();
  });

  it('clears required errors when missing row values are completed', () => {
    const form = mkForm();
    form.controls.title.setValue('HHJ');
    validator(form);

    form.controls.firstName.setValue('Ada');
    form.controls.surname.setValue('Bench');

    expect(validator(form)).toBeNull();
    expect(form.controls.firstName.errors).toBeNull();
    expect(form.controls.surname.errors).toBeNull();
  });

  it('preserves unrelated errors when adding and clearing required', () => {
    const form = mkForm();
    form.controls.title.setValue('HHJ');
    form.controls.surname.setErrors({ maxlength: true });

    validator(form);

    expect(form.controls.surname.errors).toEqual({
      maxlength: true,
      required: true,
    });

    form.controls.surname.setValue('Bench');
    form.controls.surname.setErrors({ maxlength: true, required: true });
    validator(form);

    expect(form.controls.surname.errors).toEqual({ maxlength: true });
  });
});
