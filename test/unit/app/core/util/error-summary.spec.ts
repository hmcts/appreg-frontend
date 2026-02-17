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

  it('prioritises error keys for a top-level control when priorityKeys is provided', () => {
    const form = new FormGroup({
      date: new FormControl<string | null>(null),
    });

    // multiple errors present
    form.controls.date.setErrors({ required: true, dateInvalid: true });

    const messages: ErrorMessageMap = {
      date: {
        required: 'Enter day, month and year',
        dateInvalid: 'Enter a valid date',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      priorityKeys: {
        date: ['dateInvalid', 'required'],
      },
    });

    // Should choose dateInvalid first and only emit one item for that control
    expect(result).toEqual<ErrorItem[]>([
      { id: 'date', href: '#date', text: 'Enter a valid date' },
    ]);
  });

  it('falls back to later priority keys when earlier priority keys are not present', () => {
    const form = new FormGroup({
      date: new FormControl<string | null>(null),
    });

    // only required exists
    form.controls.date.setErrors({ required: true });

    const messages: ErrorMessageMap = {
      date: {
        required: 'Enter day, month and year',
        dateInvalid: 'Enter a valid date',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      priorityKeys: {
        date: ['dateInvalid', 'required'],
      },
    });

    expect(result).toEqual<ErrorItem[]>([
      { id: 'date', href: '#date', text: 'Enter day, month and year' },
    ]);
  });

  it('if priorityKeys are provided but none match, it uses the first mapped error key it finds', () => {
    const form = new FormGroup({
      date: new FormControl<string | null>(null),
    });

    // error keys present, but priority keys are irrelevant
    form.controls.date.setErrors({ required: true, dateInvalid: true });

    const messages: ErrorMessageMap = {
      date: {
        required: 'Enter day, month and year',
        dateInvalid: 'Enter a valid date',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      priorityKeys: {
        date: ['dateInFuture'], // not present
      },
    });

    expect(result).toEqual<ErrorItem[]>([
      { id: 'date', href: '#date', text: 'Enter day, month and year' },
    ]);
  });

  it('can prioritise by id (useful when nested prefixId is used)', () => {
    const form = new FormGroup({
      applicationNotes: new FormGroup({
        date: new FormControl<string | null>(null),
      }),
    });

    const notesGroup = form.get('applicationNotes') as FormGroup;
    notesGroup.controls['date'].setErrors({
      required: true,
      dateInvalid: true,
    });

    const messages: ErrorMessageMap = {
      date: {
        required: 'Enter day, month and year',
        dateInvalid: 'Enter a valid date',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      nested: [{ path: 'applicationNotes', prefixId: 'applicationNotes' }],
      priorityKeys: {
        // prioritise by the computed id, not the controlName
        'applicationNotes.date': ['dateInvalid', 'required'],
      },
    });

    expect(result).toEqual<ErrorItem[]>([
      {
        id: 'applicationNotes.date',
        href: '#applicationNotes.date',
        text: 'Enter a valid date',
      },
    ]);
  });

  it('applies priorityKeys to nested groups as well as top-level controls', () => {
    const form = new FormGroup({
      applicationNotes: new FormGroup({
        notes: new FormControl<string | null>(null),
      }),
    });

    const notesGroup = form.get('applicationNotes') as FormGroup;
    // both errors exist
    notesGroup.controls['notes'].setErrors({ maxlength: true, required: true });

    const messages: ErrorMessageMap = {
      notes: {
        required: 'Enter notes',
        maxlength: 'Notes must be less than 4000 characters',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      nested: [{ path: 'applicationNotes' }],
      priorityKeys: {
        notes: ['required', 'maxlength'],
      },
    });

    expect(result).toEqual<ErrorItem[]>([
      { id: 'notes', href: '#notes', text: 'Enter notes' },
    ]);
  });

  it('applies priorityKeys to external groups passed in options.groups', () => {
    const external = new FormGroup({
      time: new FormControl<string | null>(null),
    });

    external.controls.time.setErrors({ durationInvalid: true, required: true });

    const form = new FormGroup({
      // root form can be empty here; we only care about the external group
    });

    const messages: ErrorMessageMap = {
      time: {
        required: 'Enter hours and minutes',
        durationInvalid: 'Enter a valid duration between 00:00 and 23:59',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      groups: [{ group: external, prefixId: 'external' }],
      priorityKeys: {
        // prioritise by controlName
        time: ['durationInvalid', 'required'],
      },
    });

    expect(result).toEqual<ErrorItem[]>([
      {
        id: 'external.time',
        href: '#external.time',
        text: 'Enter a valid duration between 00:00 and 23:59',
      },
    ]);
  });

  it('still uses hrefs mapping when provided, even with priorityKeys', () => {
    const form = new FormGroup({
      date: new FormControl<string | null>(null),
    });

    form.controls.date.setErrors({ required: true, dateInvalid: true });

    const messages: ErrorMessageMap = {
      date: {
        required: 'Enter day, month and year',
        dateInvalid: 'Enter a valid date',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      hrefs: { date: '#date-day' },
      priorityKeys: { date: ['dateInvalid', 'required'] },
    });

    expect(result).toEqual<ErrorItem[]>([
      { id: 'date', href: '#date-day', text: 'Enter a valid date' },
    ]);
  });

  it('does not emit an error if the chosen priority key has no message mapping, and will fall through to the next mapped key', () => {
    const form = new FormGroup({
      date: new FormControl<string | null>(null),
    });

    form.controls.date.setErrors({ dateInvalid: true, required: true });

    const messages: ErrorMessageMap = {
      date: {
        // intentionally omit dateInvalid mapping
        required: 'Enter day, month and year',
      },
    };

    const result = buildFormErrorSummary(form, messages, {
      priorityKeys: { date: ['dateInvalid', 'required'] },
    });

    expect(result).toEqual<ErrorItem[]>([
      { id: 'date', href: '#date', text: 'Enter day, month and year' },
    ]);
  });
});
