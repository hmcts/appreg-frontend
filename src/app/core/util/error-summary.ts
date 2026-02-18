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
  const priorityKeys = options?.priorityKeys;

  // Top-level controls
  for (const name of Object.keys(form.controls)) {
    addControlErrors(
      errors,
      form.controls[name],
      name,
      messages,
      hrefs,
      name,
      priorityKeys,
    );
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
        priorityKeys,
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
        priorityKeys,
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
  priorityKeys?: Record<string, string[]>,
): void {
  if (!control?.errors) {
    return;
  }

  const rawErrors = control.errors as Record<string, unknown>;
  const map = messages[controlName] ?? {};
  const href = hrefs[id] ?? hrefs[controlName] ?? `#${id}`;

  const preferred = priorityKeys?.[controlName] ?? priorityKeys?.[id];

  const orderedKeys = preferred?.length
    ? [
        ...preferred,
        ...Object.keys(rawErrors).filter((k) => !preferred.includes(k)),
      ]
    : Object.keys(rawErrors);

  for (const key of orderedKeys) {
    const text = map[key];
    if (!text) {
      continue;
    }
    if (!(key in rawErrors)) {
      continue;
    }

    bucket.push({ id, text, href });

    break;
  }
}
