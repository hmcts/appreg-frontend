import { FormControl, FormGroup } from '@angular/forms';

import { validateCourtVsLocOrCja } from '@util/location-suggestion-helpers';
import { courtLocCjaValidator } from '@validators/court-or-cja.validator';

jest.mock('@util/location-suggestion-helpers', () => ({
  validateCourtVsLocOrCja: jest.fn(),
}));

const mockedValidate = validateCourtVsLocOrCja as jest.MockedFunction<
  typeof validateCourtVsLocOrCja
>;

describe('courtLocCjaValidator', () => {
  const mkForm = () =>
    new FormGroup({
      court: new FormControl<string>(''),
      location: new FormControl<string>(''),
      cja: new FormControl<string>(''),
    });

  beforeEach(() => {
    mockedValidate.mockReset();
    mockedValidate.mockReturnValue(null);
  });

  it('returns null when called with a non-FormGroup control', () => {
    const v = courtLocCjaValidator();
    expect(v(new FormControl('x'))).toBeNull();
  });

  it('when all empty: sets courtRequired, locationRequired, cjaRequired', () => {
    const form = mkForm();
    const v = courtLocCjaValidator();

    const res = v(form);

    expect(res).toBeNull(); // no conflict from mock

    expect(form.controls.court.errors).toEqual({ courtRequired: true });
    expect(form.controls.location.errors).toEqual({ locationRequired: true });
    expect(form.controls.cja.errors).toEqual({ cjaRequired: true });
  });

  it('when location provided (no court): clears locationRequired, keeps cjaRequired, clears courtRequired', () => {
    const form = mkForm();
    form.controls.location.setValue('Somewhere');

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.location.errors).toBeNull();
    expect(form.controls.cja.errors).toEqual({ cjaRequired: true });
    expect(form.controls.court.errors).toBeNull(); // because hasLoc || hasCja
  });

  it('when cja provided (no court): clears cjaRequired, keeps locationRequired, clears courtRequired', () => {
    const form = mkForm();
    form.controls.cja.setValue('ABC');

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.cja.errors).toBeNull();
    expect(form.controls.location.errors).toEqual({ locationRequired: true });
    expect(form.controls.court.errors).toBeNull();
  });

  it('when court provided: clears all requiredness errors but preserves other errors', () => {
    const form = mkForm();

    form.controls.court.setValue('COURT1');

    // Now seed errors that should be preserved
    form.controls.court.setErrors({ courtRequired: true, other: true });
    form.controls.location.setErrors({ locationRequired: true, other: true });
    form.controls.cja.setErrors({ cjaRequired: true, other: true });

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.court.errors).toEqual({ other: true });
    expect(form.controls.location.errors).toEqual({ other: true });
    expect(form.controls.cja.errors).toEqual({ other: true });
  });

  it('trims values before evaluating requiredness', () => {
    const form = mkForm();
    form.controls.location.setValue('   '); // treated as empty
    form.controls.cja.setValue('  '); // treated as empty

    const v = courtLocCjaValidator();
    v(form);

    expect(form.controls.location.errors).toEqual({ locationRequired: true });
    expect(form.controls.cja.errors).toEqual({ cjaRequired: true });
    expect(form.controls.court.errors).toEqual({ courtRequired: true });
  });

  it('returns conflict error object when validateCourtVsLocOrCja returns a message', () => {
    mockedValidate.mockReturnValueOnce('Conflict message');

    const form = mkForm();
    form.controls.court.setValue('COURT1');
    form.controls.location.setValue('Other location'); // typical conflict scenario

    const v = courtLocCjaValidator();
    const res = v(form);

    expect(res).toEqual({
      courtLocCjaConflict: { message: 'Conflict message' },
    });
  });

  it('still applies requiredness logic even when conflict exists', () => {
    mockedValidate.mockReturnValueOnce('Conflict message');

    const form = mkForm();
    // No court => requiredness should run
    form.controls.location.setValue('Somewhere'); // makes locationRequired false
    // cja empty => cjaRequired true

    const v = courtLocCjaValidator();
    const res = v(form);

    expect(res).toEqual({
      courtLocCjaConflict: { message: 'Conflict message' },
    });

    expect(form.controls.location.errors).toBeNull();
    expect(form.controls.cja.errors).toEqual({ cjaRequired: true });
    expect(form.controls.court.errors).toBeNull(); // because hasLoc
  });
});
