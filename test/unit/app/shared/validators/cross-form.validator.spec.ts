import { FormControl, FormGroup } from '@angular/forms';

import { crossFormValidation } from '@validators/cross-form.validator';

describe('crossFormValidation', () => {
  const mkForm = () =>
    new FormGroup({
      firstName: new FormControl<string | null>(null),
      surname: new FormControl<string | null>(null),
    });

  it('returns null when called with a non-FormGroup control', () => {
    const validator = crossFormValidation('firstName', 'surname');

    expect(validator(new FormControl('x'))).toBeNull();
  });

  it('sets required on the target control when source has text and target is empty', () => {
    const form = mkForm();
    form.controls.firstName.setValue('John');

    const validator = crossFormValidation('firstName', 'surname');
    const result = validator(form);

    expect(result).toBeNull();
    expect(form.controls.surname.errors).toEqual({ required: true });
  });

  it('treats whitespace-only values as empty', () => {
    const form = mkForm();
    form.controls.firstName.setValue('  John  ');
    form.controls.surname.setValue('   ');

    const validator = crossFormValidation('firstName', 'surname');
    validator(form);

    expect(form.controls.surname.errors).toEqual({ required: true });
  });

  it('does not set required when the source control is empty', () => {
    const form = mkForm();
    form.controls.firstName.setValue('   ');

    const validator = crossFormValidation('firstName', 'surname');
    validator(form);

    expect(form.controls.surname.errors).toBeNull();
  });

  it('clears only its own required error once the target has text', () => {
    const form = mkForm();
    form.controls.firstName.setValue('John');

    const validator = crossFormValidation('firstName', 'surname');

    form.controls.surname.setValue('Smith');
    form.controls.surname.setErrors({ required: true, maxlength: true });
    validator(form);

    expect(form.controls.surname.errors).toEqual({ maxlength: true });
  });

  it('preserves unrelated target errors when adding required', () => {
    const form = mkForm();
    form.controls.firstName.setValue('John');
    form.controls.surname.setErrors({ pattern: true });

    const validator = crossFormValidation('firstName', 'surname');
    validator(form);

    expect(form.controls.surname.errors).toEqual({
      pattern: true,
      required: true,
    });
  });
});
