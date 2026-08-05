import { FormControl, FormGroup } from '@angular/forms';

import { atLeastOneRequiredValidator } from '@validators/at-least-one-value.validator';

describe('atLeastOneRequiredValidator', () => {
  const validate = atLeastOneRequiredValidator();

  it('returns an error when every control is empty', () => {
    const form = new FormGroup({
      first: new FormControl<string | null>(null),
      second: new FormControl(''),
      third: new FormControl('   '),
      values: new FormControl<string[]>([]),
    });

    expect(validate(form)).toEqual({ atLeastOneRequired: true });
  });

  it('returns null when at least one control has a non-empty string', () => {
    const form = new FormGroup({
      first: new FormControl('   '),
      second: new FormControl('value'),
    });

    expect(validate(form)).toBeNull();
  });

  it('returns null when at least one control has a non-empty array', () => {
    const form = new FormGroup({
      values: new FormControl<string[]>(['value']),
    });

    expect(validate(form)).toBeNull();
  });

  it('treats non-null non-string values as supplied', () => {
    const form = new FormGroup({
      count: new FormControl(0),
      enabled: new FormControl(false),
    });

    expect(validate(form)).toBeNull();
  });

  it('returns null when called with a non-FormGroup control', () => {
    expect(validate(new FormControl('value'))).toBeNull();
  });
});
