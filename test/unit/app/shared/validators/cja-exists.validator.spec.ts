import { FormControl, FormGroup } from '@angular/forms';

import { cjaMustExistIfTypedValidator } from '@validators/cja-exists.validator';

describe('cjaMustExistIfTypedValidator', () => {
  const mkForm = () =>
    new FormGroup({
      cja: new FormControl<string>(''),
    });

  it('does nothing (and clears cjaNotFound) when typed text is empty/whitespace', () => {
    const form = mkForm();

    // Simulate prior state
    form.controls.cja.setErrors({ cjaNotFound: true, someOther: true });

    const v = cjaMustExistIfTypedValidator({
      getTyped: () => '   ',
      getValidCodes: () => ['AAA', 'BBB'],
    });

    v(form);

    // cjaNotFound cleared, other errors preserved
    expect(form.controls.cja.errors).toEqual({ someOther: true });
    // validator returns null always (it sets control errors instead)
    expect(form.errors).toBeNull();
  });

  it('sets cjaNotFound when typed text exists but cja is empty', () => {
    const form = mkForm();
    form.controls.cja.setValue(''); // empty selection

    const v = cjaMustExistIfTypedValidator({
      getTyped: () => 'ABC - Something typed',
      getValidCodes: () => ['DEF'],
    });

    v(form);

    expect(form.controls.cja.errors).toEqual({ cjaNotFound: true });
  });

  it('sets cjaNotFound when typed text exists but cja code is not in valid list', () => {
    const form = mkForm();
    form.controls.cja.setValue('ABC');

    const v = cjaMustExistIfTypedValidator({
      getTyped: () => 'ABC - Something typed',
      getValidCodes: () => ['DEF', 'GHI'],
    });

    v(form);

    expect(form.controls.cja.errors).toEqual({ cjaNotFound: true });
  });

  it('clears cjaNotFound when typed text exists and cja code is valid', () => {
    const form = mkForm();
    form.controls.cja.setValue('ABC');

    // Prior error state should be cleaned up
    form.controls.cja.setErrors({ cjaNotFound: true, other: true });

    const v = cjaMustExistIfTypedValidator({
      getTyped: () => 'ABC - Something typed',
      getValidCodes: () => ['ABC', 'DEF'],
    });

    v(form);

    // only cjaNotFound cleared
    expect(form.controls.cja.errors).toEqual({ other: true });
  });

  it('trims cja control value before checking', () => {
    const form = mkForm();
    form.controls.cja.setValue('  ABC  ');

    const v = cjaMustExistIfTypedValidator({
      getTyped: () => 'typed',
      getValidCodes: () => ['ABC'],
    });

    v(form);

    expect(form.controls.cja.errors).toBeNull();
  });

  it('returns null when called with a non-FormGroup control', () => {
    const c = new FormControl('x');
    const v = cjaMustExistIfTypedValidator({
      getTyped: () => 'typed',
      getValidCodes: () => ['ABC'],
    });

    expect(v(c)).toBeNull();
  });
});
