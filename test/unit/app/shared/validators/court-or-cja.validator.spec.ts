import { FormControl, FormGroup } from '@angular/forms';

import { courtLocCjaValidator } from '@validators/court-or-cja.validator';

describe('courtLocCjaValidator (create/update rule)', () => {
  const mkForm = () =>
    new FormGroup({
      court: new FormControl<string>(''),
      location: new FormControl<string>(''),
      cja: new FormControl<string>(''),
    });

  it('returns null when called with a non-FormGroup control', () => {
    const v = courtLocCjaValidator();
    expect(v(new FormControl('x'))).toBeNull();
  });

  it('when all empty: sets courtOrLocCjaRequired, but NOT locationRequired or cjaRequired', () => {
    const form = mkForm();
    const v = courtLocCjaValidator();

    const res = v(form);

    expect(res).toBeNull();

    expect(form.controls.location.errors).toBeNull();
    expect(form.controls.cja.errors).toBeNull();
    expect(form.controls.court.errors).toEqual({ courtOrLocCjaRequired: true });
  });

  it('when location provided only (no court): sets cjaRequired, keeps courtOrLocCjaRequired, does NOT set locationRequired', () => {
    const form = mkForm();
    form.controls.location.setValue('Somewhere');

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.location.errors).toBeNull();
    expect(form.controls.cja.errors).toEqual({ cjaRequired: true });
    expect(form.controls.court.errors).toEqual({ courtOrLocCjaRequired: true });
  });

  it('when cja provided only (no court): sets locationRequired, clears cjaRequired, keeps courtOrLocCjaRequired', () => {
    const form = mkForm();
    form.controls.cja.setValue('ABC');

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.cja.errors).toBeNull();
    expect(form.controls.location.errors).toEqual({ locationRequired: true });
    expect(form.controls.court.errors).toEqual({ courtOrLocCjaRequired: true });
  });

  it('when both location and cja provided (no court): clears requiredness errors', () => {
    const form = mkForm();
    form.controls.location.setValue('Somewhere');
    form.controls.cja.setValue('ABC');

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.location.errors).toBeNull();
    expect(form.controls.cja.errors).toBeNull();
    expect(form.controls.court.errors).toBeNull();
  });

  it('when court provided: clears dependent required errors and clears courtOrLocCjaRequired', () => {
    const form = mkForm();
    form.controls.court.setValue('COURT1');

    // seed errors to verify the validator clears only its own keys
    form.controls.court.setErrors({ courtOrLocCjaRequired: true, other: true });
    form.controls.location.setErrors({ locationRequired: true, other: true });
    form.controls.cja.setErrors({ cjaRequired: true, other: true });

    const v = courtLocCjaValidator();
    v(form);

    // our keys cleared, "other" preserved
    expect(form.controls.location.errors).toEqual({ other: true });
    expect(form.controls.cja.errors).toEqual({ other: true });
    expect(form.controls.court.errors).toEqual({ other: true });
  });

  it('trims values before evaluating requiredness', () => {
    const form = mkForm();
    form.controls.location.setValue('   ');
    form.controls.cja.setValue('  ');

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.location.errors).toBeNull();
    expect(form.controls.cja.errors).toBeNull();
    expect(form.controls.court.errors).toEqual({ courtOrLocCjaRequired: true });
  });

  it('when court and location filled: sets conflict error on court control', () => {
    const form = mkForm();
    form.controls.court.setValue('COURT1');
    form.controls.location.setValue('Other location');

    const v = courtLocCjaValidator();
    const res = v(form);

    expect(res).toBeNull();
    expect(form.controls.court.errors).toEqual({
      courtLocCjaConflict: true,
    });
  });

  it('when court and cja filled: sets conflict error on court control', () => {
    const form = mkForm();
    form.controls.court.setValue('COURT1');
    form.controls.cja.setValue('ABC');

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.court.errors).toEqual({
      courtLocCjaConflict: true,
    });
  });

  it('when conflict exists, it preserves other court errors and still clears location/cja requiredness when court is present', () => {
    const form = mkForm();
    form.controls.court.setValue('COURT1');
    form.controls.location.setValue('Other location');

    // seed court with an unrelated error
    form.controls.court.setErrors({ other: true });

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.location.errors).toBeNull();
    expect(form.controls.cja.errors).toBeNull();

    expect(form.controls.court.errors).toEqual({
      other: true,
      courtLocCjaConflict: true,
    });
  });

  it('clears conflict error when court-only becomes valid', () => {
    const form = mkForm();
    form.controls.court.setValue('COURT1');
    form.controls.location.setValue('Other location');

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.court.errors).toEqual({
      courtLocCjaConflict: true,
    });

    // fix the conflict by clearing location
    form.controls.location.setValue('');
    v(form);

    expect(form.controls.court.errors).toBeNull();
  });
});
