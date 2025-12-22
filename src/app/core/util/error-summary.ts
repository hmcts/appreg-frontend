import { AbstractControl, FormGroup } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';

export type ErrorMessageMap = Record<string, Record<string, string>>;
export type ErrorHrefsMap = Record<string, string>;

export type BuildFormErrorSummaryOptions = {
  nested?: { path: string; prefixId?: string }[];
  hrefs?: ErrorHrefsMap;
};

export type BuildFormErrorSummaryFn = (
  form: FormGroup,
  messages: ErrorMessageMap,
  options?: BuildFormErrorSummaryOptions,
) => ErrorItem[];

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
  options?.nested?.forEach(({ path }) => {
    const group = form.get(path);
    if (!(group instanceof FormGroup)) {
      return;
    }

    for (const childName of Object.keys(group.controls)) {
      addControlErrors(
        errors,
        group.controls[childName],
        childName,
        messages,
        hrefs,
        childName,
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
  const href = hrefs[controlName];

  for (const key of Object.keys(rawErrors)) {
    const text = map[key];
    if (!text) {
      continue;
    }

    bucket.push({
      id,
      text,
      href, // optional; undefined if none
    });
  }
}
