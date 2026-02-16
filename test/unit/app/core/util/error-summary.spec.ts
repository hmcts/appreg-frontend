import { FormControl, FormGroup } from '@angular/forms';

import type { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  type ErrorMessageMap,
  buildFormErrorSummary,
} from '@util/error-summary';

describe('buildFormErrorSummary', () => {
  it('returns an empty array when there are no control errors', () => {
    const form = new FormGroup({
      applicationCode: new FormControl<string | null>(null),
    });

    const messages: ErrorMessageMap = {
      applicationCode: {
        required: 'Enter an application code',
      },
    };

    const result = buildFormErrorSummary(form, messages);

    expect(result).toEqual<ErrorItem[]>([]);
  });

  it('returns a single error for a top-level control when mapped', () => {
    const form = new FormGroup({
      applicationCode: new FormControl<string | null>(null),
    });

    // Simulate a validation error
    form.controls.applicationCode.setErrors({ required: true });

    const messages: ErrorMessageMap = {
      applicationCode: {
        required: 'Enter an application code',
      },
    };

    const result = buildFormErrorSummary(form, messages);

    expect(result).toEqual<ErrorItem[]>([
      {
        id: 'applicationCode',
        href: '#applicationCode',
        text: 'Enter an application code',
      },
    ]);
  });

  it('ignores controls that have errors but no message mapping', () => {
    const form = new FormGroup({
      applicationCode: new FormControl<string | null>(null),
      someOtherField: new FormControl<string | null>(null),
    });

    form.controls.applicationCode.setErrors({ required: true });
    form.controls.someOtherField.setErrors({ required: true });

    const messages: ErrorMessageMap = {
      applicationCode: {
        required: 'Enter an application code',
      },
    };

    const result = buildFormErrorSummary(form, messages);

    expect(result).toEqual<ErrorItem[]>([
      {
        id: 'applicationCode',
        href: '#applicationCode',
        text: 'Enter an application code',
      },
    ]);
  });

  it('ignores error keys that do not have a corresponding message', () => {
    const form = new FormGroup({
      applicationCode: new FormControl<string | null>(null),
    });

    // Control has a maxlength error, but we only provide a "required" message
    form.controls.applicationCode.setErrors({ maxlength: true });

    const messages: ErrorMessageMap = {
      applicationCode: {
        required: 'Enter an application code',
      },
    };

    const result = buildFormErrorSummary(form, messages);

    expect(result).toEqual<ErrorItem[]>([]);
  });

  it('includes errors from nested form groups specified in options.nested', () => {
    const form = new FormGroup({
      applicationCode: new FormControl<string | null>(null),
      applicationNotes: new FormGroup({
        notes: new FormControl<string | null>(null),
        caseReference: new FormControl<string | null>(null),
      }),
    });

    form.controls.applicationCode.setErrors({ required: true });

    const notesGroup = form.get('applicationNotes') as FormGroup;
    notesGroup.controls['notes'].setErrors({ maxlength: true });
    notesGroup.controls['caseReference'].setErrors({ pattern: true });

    const messages: ErrorMessageMap = {
      applicationCode: {
        required: 'Enter an application code',
      },
      notes: {
        maxlength: 'Notes must be less than 4000 characters',
      },
      caseReference: {
        pattern: 'Case reference must only contain letters and numbers',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      nested: [{ path: 'applicationNotes' }],
    });

    expect(result).toEqual<ErrorItem[]>([
      {
        id: 'applicationCode',
        href: '#applicationCode',
        text: 'Enter an application code',
      },
      {
        id: 'notes',
        href: '#notes',
        text: 'Notes must be less than 4000 characters',
      },
      {
        id: 'caseReference',
        href: '#caseReference',
        text: 'Case reference must only contain letters and numbers',
      },
    ]);
  });

  it('skips nested paths that are not FormGroups', () => {
    const form = new FormGroup({
      applicationCode: new FormControl<string | null>(null),
      // not a FormGroup, just a control
      applicationNotes: new FormControl<string | null>(null),
    });

    form.controls.applicationCode.setErrors({ required: true });

    const messages: ErrorMessageMap = {
      applicationCode: {
        required: 'Enter an application code',
      },
      notes: {
        maxlength: 'Notes must be less than 4000 characters',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      nested: [{ path: 'applicationNotes' }],
    });

    // nested path is ignored because it's not a FormGroup
    expect(result).toEqual<ErrorItem[]>([
      {
        id: 'applicationCode',
        href: '#applicationCode',
        text: 'Enter an application code',
      },
    ]);
  });
});
