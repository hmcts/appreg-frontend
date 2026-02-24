import { FormControl, FormGroup } from '@angular/forms';

import { setControlError } from '@util/validation-helpers';

describe('setControlError', () => {
  const mkForm = () =>
    new FormGroup({
      field: new FormControl<string | null>(null),
    });

  it('does nothing when control is missing', () => {
    const form = new FormGroup({});

    expect(() =>
      setControlError(form, 'missing', 'errKey', true),
    ).not.toThrow();
  });

  it('sets an error key when on=true', () => {
    const form = mkForm();

    setControlError(form, 'field', 'errKey', true);

    expect(form.controls.field.errors).toEqual({ errKey: true });
  });

  it('preserves existing errors when adding a new one', () => {
    const form = mkForm();
    form.controls.field.setErrors({ existing: true });

    setControlError(form, 'field', 'errKey', true);

    expect(form.controls.field.errors).toEqual({
      existing: true,
      errKey: true,
    });
  });

  it('adds error text when provided and missing', () => {
    const form = mkForm();

    setControlError(form, 'field', 'errKey', true, {
      errorTextKey: 'errorText',
      errorText: 'Boom',
    });

    expect(form.controls.field.errors).toEqual({
      errKey: true,
      errorText: 'Boom',
    });
  });

  it('does not override existing error text', () => {
    const form = mkForm();
    form.controls.field.setErrors({ errorText: 'Existing' });

    setControlError(form, 'field', 'errKey', true, {
      errorTextKey: 'errorText',
      errorText: 'Boom',
    });

    expect(form.controls.field.errors).toEqual({
      errorText: 'Existing',
      errKey: true,
    });
  });

  it('removes only the specified error key when on=false', () => {
    const form = mkForm();
    form.controls.field.setErrors({ errKey: true, other: true });

    setControlError(form, 'field', 'errKey', false);

    expect(form.controls.field.errors).toEqual({ other: true });
  });

  it('removes error text only when it matches the provided text', () => {
    const form = mkForm();
    form.controls.field.setErrors({
      errKey: true,
      errorText: 'Match me',
      other: true,
    });

    setControlError(form, 'field', 'errKey', false, {
      errorTextKey: 'errorText',
      errorText: 'Match me',
    });

    expect(form.controls.field.errors).toEqual({ other: true });
  });

  it('keeps error text when it does not match the provided text', () => {
    const form = mkForm();
    form.controls.field.setErrors({
      errKey: true,
      errorText: 'Keep me',
    });

    setControlError(form, 'field', 'errKey', false, {
      errorTextKey: 'errorText',
      errorText: 'Different',
    });

    expect(form.controls.field.errors).toEqual({ errorText: 'Keep me' });
  });

  it('clears errors when no errors remain', () => {
    const form = mkForm();
    form.controls.field.setErrors({ errKey: true });

    setControlError(form, 'field', 'errKey', false);

    expect(form.controls.field.errors).toBeNull();
  });
});
