/**
 * Generic add CJA, Court, Other location validators to a form group
 */

import { FormGroup } from '@angular/forms';

import { cjaMustExistIfTypedValidator } from './cja-exists.validator';
import { courtMustExistIfTypedValidator } from './court-exists.validator';
import { courtLocCjaValidator } from './court-or-cja.validator';

import { PlaceFieldsState } from '@util/place-fields.base';

export function addLocationValidatorsToForm(
  form: FormGroup,
  getState: () => PlaceFieldsState,
): void {
  form.addValidators([
    courtLocCjaValidator({
      getCourtTyped: () => getState().courthouseSearch ?? '',
      getCjaTyped: () => getState().cjaSearch ?? '',
    }),
    cjaMustExistIfTypedValidator({
      getTyped: () => getState().cjaSearch ?? '',
      getValidCodes: () => getState().cja.map((x) => x.code),
    }),
    courtMustExistIfTypedValidator({
      getTyped: () => getState().courthouseSearch ?? '',
      getValidCodes: () => getState().courtLocations.map((x) => x.locationCode),
    }),
  ]);
}
