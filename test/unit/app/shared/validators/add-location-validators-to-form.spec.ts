import { FormControl, FormGroup } from '@angular/forms';

import type { PlaceFieldsState } from '@util/place-fields.base';
import { addLocationValidatorsToForm } from '@validators/add-location-validators-to-form';

describe('addLocationValidatorsToForm', () => {
  const mkForm = () =>
    new FormGroup({
      court: new FormControl<string>(''),
      location: new FormControl<string>(''),
      cja: new FormControl<string>(''),
    });

  const mkState = (
    overrides: Partial<PlaceFieldsState> = {},
  ): PlaceFieldsState => ({
    courthouseSearch: '',
    cjaSearch: '',
    courtLocations: [],
    cja: [],
    filteredCourthouses: [],
    filteredCja: [],
    ...overrides,
  });

  const validate = (form: FormGroup): void => {
    form.updateValueAndValidity({ emitEvent: false });
  };

  it('adds the court or location/CJA required validator', () => {
    const form = mkForm();

    addLocationValidatorsToForm(form, () => mkState());
    validate(form);

    expect(form.controls.court.errors).toEqual({
      courtOrLocCjaRequired: true,
    });
    expect(form.controls.location.errors).toBeNull();
    expect(form.controls.cja.errors).toBeNull();
  });

  it('adds the court existence validator', () => {
    const form = mkForm();
    form.controls.court.setValue('UNKNOWN');

    addLocationValidatorsToForm(form, () =>
      mkState({
        courthouseSearch: 'UNKNOWN - Missing court',
        courtLocations: [{ locationCode: 'COURT1', name: 'Known court' }],
      }),
    );
    validate(form);

    expect(form.controls.court.errors).toEqual({ courtNotFound: true });
  });

  it('adds the CJA existence validator', () => {
    const form = mkForm();
    form.controls.location.setValue('Other location');
    form.controls.cja.setValue('UNKNOWN');

    addLocationValidatorsToForm(form, () =>
      mkState({
        cjaSearch: 'UNKNOWN - Missing CJA',
        cja: [{ code: 'CJA1', description: 'Known CJA' }],
      }),
    );
    validate(form);

    expect(form.controls.cja.errors).toEqual({ cjaNotFound: true });
  });

  it('reads the latest place state when the form is validated', () => {
    const form = mkForm();
    let state = mkState();

    addLocationValidatorsToForm(form, () => state);

    form.controls.court.setValue('UNKNOWN');
    state = mkState({
      courthouseSearch: 'UNKNOWN - Missing court',
      courtLocations: [{ locationCode: 'COURT1', name: 'Known court' }],
    });
    validate(form);

    expect(form.controls.court.errors).toEqual({ courtNotFound: true });

    state = mkState({
      courthouseSearch: 'COURT1 - Known court',
      courtLocations: [{ locationCode: 'COURT1', name: 'Known court' }],
    });
    form.controls.court.setValue('COURT1');
    validate(form);

    expect(form.controls.court.errors).toBeNull();
  });
});
