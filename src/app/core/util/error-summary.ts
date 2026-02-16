import { AbstractControl, FormGroup } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  BuildFormErrorSummaryFn,
  BuildFormErrorSummaryOptions,
} from '@core-types/error/form-error-messages.type';

export type ErrorMessageMap = Record<string, Record<string, string>>;
export type ErrorHrefsMap = Record<string, string>;

function buildFormErrorSummaryImpl(
  form: FormGroup,
  messages: ErrorMessageMap,
  options?: BuildFormErrorSummaryOptions,
): ErrorItem[] {
  const errors: ErrorItem[] = [];
  const hrefs = options?.hrefs ?? {};

  // Top-level controls
  for (const name of Object.keys(form.controls)) {
    addControlErrors(errors, form.controls[name], name, messages, hrefs, name);
  }

  // Nested groups (e.g. applicationNotes.*)
  options?.nested?.forEach(({ path, prefixId }) => {
    const group = form.get(path);
    if (!(group instanceof FormGroup)) {
      return;
    }

    for (const childName of Object.keys(group.controls)) {
      const id = prefixId ? `${prefixId}.${childName}` : childName;

      addControlErrors(
        errors,
        group.controls[childName],
        childName,
        messages,
        hrefs,
        id,
      );
    }
  });

  // External groups not under root form
  options?.groups?.forEach(({ group, prefixId }) => {
    for (const childName of Object.keys(group.controls)) {
      const id = prefixId ? `${prefixId}.${childName}` : childName;

      addControlErrors(
        errors,
        group.controls[childName],
        childName,
        messages,
        hrefs,
        id,
      );
    }
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
  hrefs: ErrorHrefsMap,
  id: string,
): void {
  if (!control?.errors) {
    return;
  }

  const rawErrors = control.errors as Record<string, unknown>;
  const map = messages[controlName] ?? {};
  const href = hrefs[id] ?? hrefs[controlName] ?? `#${id}`;

  for (const key of Object.keys(rawErrors)) {
    const text = map[key];
    if (!text) {
      continue;
    }

    bucket.push({
      id,
      text,
      href,
    });
  }
}
