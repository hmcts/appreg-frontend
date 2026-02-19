import { FormGroup } from '@angular/forms';

export function trimToString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function trimToUndefined(v: unknown): string | undefined {
  const s = trimToString(v);
  return s === '' ? undefined : s;
}

export function isNullableString(x: unknown): x is string | null | undefined {
  return x === undefined || x === null || typeof x === 'string';
}

//Below could exist in a title-util or input-utils in future
export type TitleOption = { value: string; label: string };

/**
 * Normalises any incoming title string to one of the option values.
 * - trims
 * - lowercases
 * - strips periods (e.g. "Mr." -> "mr")
 * - returns '' when empty (so select shows placeholder)
 * - returns fallbackValue ("other" by default) when non-empty but not recognised
 */
export function mapTitleToOptionValue(
  title: string | null | undefined,
  options: readonly TitleOption[],
  fallbackValue = 'other',
): string {
  const raw = (title ?? '').trim();
  if (!raw) {
    return '';
  }

  const normalised = raw.toLowerCase().replaceAll('.', '');

  const allowed = new Set(options.map((o) => o.value));
  if (allowed.has(normalised)) {
    return normalised;
  }

  // if fallback exists in options, use it; otherwise return '' (no selection)
  return allowed.has(fallbackValue) ? fallbackValue : '';
}

/**
 * Converts a selected option value back to an API-friendly title string.
 * Default: returns the *label* for the chosen option (e.g. "mr" -> "Mr").
 * If value is empty/null, returns undefined.
 */
export function mapOptionValueToTitle(
  value: string | null | undefined,
  options: readonly TitleOption[],
): string | undefined {
  const v = (value ?? '').trim();
  if (!v) {
    return undefined;
  }

  const match = options.find((o) => o.value === v);
  return match?.label ?? undefined;
}

/**
 * Read formgroup string or return null
 */
export function getTrimmedStringOrNullFromGroup(
  group: FormGroup,
  name: string,
): string | null {
  const v: unknown = group.get(name)?.value;
  if (typeof v !== 'string') {
    return null;
  }
  const s = v.trim();
  return s || null;
}
