import { AbstractControl, FormGroup } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';

export type ErrorMessage =
  | string
  | {
      text: string;
      href?: string;
    };

export type ErrorMessageMap = Record<string, Record<string, ErrorMessage>>;

export type BuildFormErrorSummaryFn = (
  form: FormGroup,
  messages: ErrorMessageMap,
  options?: { nested?: { path: string; prefixId?: string }[] },
) => ErrorItem[];

function buildFormErrorSummaryImpl(
  form: FormGroup,
  messages: ErrorMessageMap,
  options?: { nested?: { path: string; prefixId?: string }[] },
): ErrorItem[] {
  const errors: ErrorItem[] = [];

  const controls = form.controls;
  const controlNames = Object.keys(controls);

  for (const name of controlNames) {
    const control = controls[name];
    addControlErrors(errors, control, name, messages, name);
  }

  options?.nested?.forEach(({ path }) => {
    const group = form.get(path);
    if (!(group instanceof FormGroup)) {
      return;
    }

    const nestedControls = group.controls;
    const nestedNames = Object.keys(nestedControls);

    nestedNames.forEach((childName) => {
      const ctrl = nestedControls[childName];
      addControlErrors(errors, ctrl, childName, messages, childName);
    });
  });

  return errors;
}

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
    const entry = map[key];
    if (!entry) {
      continue;
    }

    if (typeof entry === 'string') {
      bucket.push({ id, text: entry });
    } else {
      bucket.push({
        id,
        text: entry.text,
        href: entry.href,
      });
    }
  }
}
