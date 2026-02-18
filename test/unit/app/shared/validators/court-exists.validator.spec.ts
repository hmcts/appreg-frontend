import { FormControl, FormGroup } from '@angular/forms';

import { courtMustExistIfTypedValidator } from '@validators/court-exists.validator';

describe('courtMustExistIfTypedValidator', () => {
  const mkForm = () =>
    new FormGroup({
      court: new FormControl<string>(''),
      location: new FormControl<string>(''),
      cja: new FormControl<string>(''),
    });

  const mkValidator = (opts?: {
    typed?: string;
    validCodes?: readonly string[];
  }) => {
    const getTyped = jest.fn(() => opts?.typed ?? '');
    const getValidCodes = jest.fn(() => opts?.validCodes ?? ['A1', 'B2']);

    const v = courtMustExistIfTypedValidator({ getTyped, getValidCodes });
    return { v, getTyped, getValidCodes };
  };

  it('returns null when called with a non-FormGroup control', () => {
    const { v } = mkValidator({ typed: 'Alpha' });
    expect(v(new FormControl('x'))).toBeNull();
  });

  it('when nothing typed: clears courtNotFound and does not require a court value', () => {
    const form = mkForm();
    form.controls.court.setErrors({ courtNotFound: true, other: true });

    const { v, getTyped, getValidCodes } = mkValidator({ typed: '   ' });

    const res = v(form);

    expect(res).toBeNull();
    expect(getTyped).toHaveBeenCalled();
    expect(getValidCodes).not.toHaveBeenCalled();

    // clears only courtNotFound, preserves other errors
    expect(form.controls.court.errors).toEqual({ other: true });
  });

  it('when typed but court empty: sets courtNotFound', () => {
    const form = mkForm();

    const { v } = mkValidator({ typed: 'Alp' });

    v(form);

    expect(form.controls.court.errors).toEqual({ courtNotFound: true });
  });

  it('when typed but court not in valid codes: sets courtNotFound', () => {
    const form = mkForm();
    form.controls.court.setValue('ZZ');

    const { v } = mkValidator({ typed: 'Alpha', validCodes: ['A1', 'B2'] });

    v(form);

    expect(form.controls.court.errors).toEqual({ courtNotFound: true });
  });

  it('when typed and court in valid codes: clears courtNotFound', () => {
    const form = mkForm();
    form.controls.court.setValue('A1');

    // seed an existing courtNotFound plus another error to ensure only the key is cleared
    form.controls.court.setErrors({ courtNotFound: true, other: true });

    const { v } = mkValidator({ typed: 'Alpha', validCodes: ['A1', 'B2'] });

    v(form);

    expect(form.controls.court.errors).toEqual({ other: true });
  });

  it('preserves unrelated errors when setting courtNotFound', () => {
    const form = mkForm();
    form.controls.court.setValue('ZZ');
    form.controls.court.setErrors({ other: true });

    const { v } = mkValidator({ typed: 'Alpha', validCodes: ['A1', 'B2'] });

    v(form);

    expect(form.controls.court.errors).toEqual({
      other: true,
      courtNotFound: true,
    });
  });

  it('does not set courtNotFound if typed but court value is whitespace', () => {
    const form = mkForm();
    form.controls.court.setValue('   ');

    const { v } = mkValidator({ typed: 'Alpha', validCodes: ['A1'] });

    v(form);

    expect(form.controls.court.errors).toEqual({ courtNotFound: true });
  });

  it('clears courtNotFound when user clears the typed text (even if court value remains invalid)', () => {
    const form = mkForm();
    form.controls.court.setValue('ZZ');

    const { v } = mkValidator({ typed: 'Alpha', validCodes: ['A1'] });
    v(form);

    expect(form.controls.court.errors).toEqual({ courtNotFound: true });

    const { v: v2 } = mkValidator({ typed: '   ', validCodes: ['A1'] });
    v2(form);

    expect(form.controls.court.errors).toBeNull();
  });
});
