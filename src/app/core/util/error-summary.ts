import { AbstractControl, FormGroup } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';

export type ErrorMessageMap = Record<string, Record<string, string>>;

export type BuildFormErrorSummaryFn = (
  form: FormGroup,
  messages: ErrorMessageMap,
  options?: { nested?: { path: string; prefixId?: string }[] },
) => ErrorItem[];

// Implementation kept private
function buildFormErrorSummaryImpl(
  form: FormGroup,
  messages: ErrorMessageMap,
  options?: { nested?: { path: string; prefixId?: string }[] },
): ErrorItem[] {
  const errors: ErrorItem[] = [];

  const controls = form.controls;
  const controlNames = Object.keys(controls);

  // Handle top-level controls
  for (const name of controlNames) {
    const control = controls[name];
    addControlErrors(errors, control, name, messages, name);
  }

  // Handle nested form groups, e.g. applicationNotes.notes
  options?.nested?.forEach(({ path }) => {
    const group = form.get(path);
    if (!(group instanceof FormGroup)) {
      return;
    }

    const nestedControls = group.controls;
    const nestedNames = Object.keys(nestedControls);

    nestedNames.forEach((childName) => {
      const ctrl = nestedControls[childName];
      const id = childName;
      addControlErrors(errors, ctrl, childName, messages, id);
    });
  });

  return errors;
}

// The exported, typed runtime value — consumers can call it without casts
export const buildFormErrorSummary: BuildFormErrorSummaryFn =
  buildFormErrorSummaryImpl;

function addControlErrors(
  bucket: ErrorItem[],
  control: AbstractControl | null,
  controlName: string,
  messages: ErrorMessageMap,
  id: string,
): void {
  if (!control) {
    return;
  }

  const rawErrors = control.errors as Record<string, unknown> | null;
  if (!rawErrors) {
    return;
  }

  const map = messages[controlName] ?? {};
  for (const key of Object.keys(rawErrors)) {
    const message = map[key];
    if (!message) {
      continue;
    }
    bucket.push({ id, text: message });
  }
}
