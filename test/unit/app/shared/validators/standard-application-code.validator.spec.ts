// standard-applicant-code.validator.spec.ts

import { FormControl, FormGroup } from '@angular/forms';

import { ApplicantType } from '@shared-types/applications-list-entry-create/application-list-entry-create-form';
import { standardApplicantCodeConditionalRequired } from '@validators/standard-applicant-code.validator';

describe('standardApplicantCodeConditionalRequired', () => {
  function setup(applicantType: ApplicantType, code: unknown) {
    const group = new FormGroup({
      applicantType: new FormControl<ApplicantType>(applicantType, {
        nonNullable: true,
      }),
      standardApplicantCode: new FormControl<unknown>(code, {
        validators: [standardApplicantCodeConditionalRequired],
      }),
    });

    const ctrl = group.controls.standardApplicantCode;
    // ensure validator runs with correct parent wiring
    ctrl.updateValueAndValidity({ emitEvent: false });

    return { group, ctrl };
  }

  it('returns {required:true} when applicantType is standard and code is empty', () => {
    const { ctrl } = setup('standard', null);
    expect(ctrl.errors).toEqual({ required: true });
  });

  it('treats whitespace-only as empty (still required)', () => {
    const { ctrl } = setup('standard', '   ');
    expect(ctrl.errors).toEqual({ required: true });
  });

  it('returns null when applicantType is standard and code is non-empty', () => {
    const { ctrl } = setup('standard', ' SA-123 ');
    expect(ctrl.errors).toBeNull();
  });

  it('returns null when applicantType is person even if code is empty', () => {
    const { ctrl } = setup('person', null);
    expect(ctrl.errors).toBeNull();
  });

  it('returns null when applicantType is org even if code is empty', () => {
    const { ctrl } = setup('org', '');
    expect(ctrl.errors).toBeNull();
  });

  it('returns null if control has no parent (defensive)', () => {
    const ctrl = new FormControl<string | null>(null, {
      validators: [standardApplicantCodeConditionalRequired],
    });

    ctrl.updateValueAndValidity({ emitEvent: false });
    expect(ctrl.errors).toBeNull();
  });

  it('re-evaluates when applicantType changes', () => {
    const { group, ctrl } = setup('org', null);
    expect(ctrl.errors).toBeNull();

    group.controls.applicantType.setValue('standard');
    // changing applicantType doesn't automatically re-run sibling validators unless you trigger it
    ctrl.updateValueAndValidity({ emitEvent: false });

    expect(ctrl.errors).toEqual({ required: true });
  });

  it('clears required when code becomes non-empty', () => {
    const { ctrl } = setup('standard', '');
    expect(ctrl.errors).toEqual({ required: true });

    ctrl.setValue('SA-999');
    ctrl.updateValueAndValidity({ emitEvent: false });

    expect(ctrl.errors).toBeNull();
  });
});
