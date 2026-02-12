import { FormControl, FormGroup } from '@angular/forms';

import { CLOSE_MESSAGES } from '@constants/application-list-detail-update/error-messages';
import {
  CloseValidationEntry,
  closePermitted,
} from '@validators/applications-list-close.validator';

describe('closePermitted', () => {
  const mkForm = () =>
    new FormGroup({
      status: new FormControl<string | null>(null),
      duration: new FormControl<{ hours: number | null; minutes: number | null } | null>(null),
    });

  const runValidator = (
    form: FormGroup,
    entries: CloseValidationEntry[] = [],
  ) => {
    const v = closePermitted({ getEntries: () => entries });
    return v(form);
  };

  it('returns null for non-FormGroup controls', () => {
    const v = closePermitted();
    const c = new FormControl('x');
    expect(v(c)).toBeNull();
  });

  it('does nothing when status is not closed and clears duration close error', () => {
    const form = mkForm();
    form.controls.status.setValue('open');
    form.controls.duration.setErrors({
      closeDurationMissing: true,
      durationErrorText: CLOSE_MESSAGES.durationMissing,
    });

    const res = runValidator(form);

    expect(res).toBeNull();
    expect(form.controls.duration.errors).toBeNull();
  });

  it('adds rule errors when closing', () => {
    const form = mkForm();
    form.controls.status.setValue('closed');
    form.controls.duration.setValue({ hours: 1, minutes: 0 });

    const res = runValidator(form, [
      { hasResult: false },
      { hasOfficials: false },
      { hasFees: true, hasPaidFee: false },
      { requiresRespondent: true, hasRespondent: false },
    ]);

    expect(res).toEqual({
      closeNotPermitted: {
        noClose: [
          CLOSE_MESSAGES.resultMissing,
          CLOSE_MESSAGES.officialsMissing,
          CLOSE_MESSAGES.feeMissing,
          CLOSE_MESSAGES.respondentMissing,
        ],
      },
    });
  });

  it('adds duration missing when no duration provided', () => {
    const form = mkForm();
    form.controls.status.setValue('closed');
    form.controls.duration.setValue(null);

    const res = runValidator(form);

    expect(res).toEqual({
      closeNotPermitted: { noClose: [CLOSE_MESSAGES.durationMissing] },
    });
    expect(form.controls.duration.errors).toEqual({
      closeDurationMissing: true,
      durationErrorText: CLOSE_MESSAGES.durationMissing,
    });
  });

  it('adds duration missing when any entry hasDuration is false', () => {
    const form = mkForm();
    form.controls.status.setValue('closed');
    form.controls.duration.setValue({ hours: 1, minutes: 0 });

    const res = runValidator(form, [{ hasDuration: false }]);

    expect(res).toEqual({
      closeNotPermitted: { noClose: [CLOSE_MESSAGES.durationMissing] },
    });
  });

  it('adds duration non-positive when duration is 0:0', () => {
    const form = mkForm();
    form.controls.status.setValue('closed');
    form.controls.duration.setValue({ hours: 0, minutes: 0 });

    const res = runValidator(form);

    expect(res).toEqual({
      closeNotPermitted: { noClose: [CLOSE_MESSAGES.durationNonPositive] },
    });
    expect(form.controls.duration.errors).toEqual({
      closeDurationMissing: true,
      durationErrorText: CLOSE_MESSAGES.durationNonPositive,
    });
  });

  it('clears closeDurationMissing when duration is valid', () => {
    const form = mkForm();
    form.controls.status.setValue('closed');
    form.controls.duration.setErrors({
      closeDurationMissing: true,
      durationErrorText: CLOSE_MESSAGES.durationMissing,
    });
    form.controls.duration.setValue({ hours: 0, minutes: 5 });

    const res = runValidator(form);

    expect(res).toBeNull();
    expect(form.controls.duration.errors).toBeNull();
  });
});
