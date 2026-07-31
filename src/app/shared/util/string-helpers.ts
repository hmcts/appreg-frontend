import { FormGroup } from '@angular/forms';

import { Applicant, FullName } from '@openapi';

export function trimToString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function trimToUndefined(v: unknown): string | undefined {
  const s = trimToString(v);
  return s === '' ? undefined : s;
}

export function trimToNull(v: unknown): string | null {
  const s = trimToString(v);
  return s === '' ? null : s;
}

export function hasText(v: unknown): v is string {
  return trimToUndefined(v) !== undefined;
}

export function toNullableInteger(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && Number.isInteger(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return null;
  }

  return Number(trimmed);
}

export function isNullableString(x: unknown): x is string | null | undefined {
  return x === undefined || x === null || typeof x === 'string';
}

export function trimStringToLowerCase(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
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
  return trimToNull(v);
}

type PartyWithName = Pick<Applicant, 'person' | 'organisation'>;

export function formatFullName(name?: FullName | null): string | null {
  if (!name) {
    return null;
  }

  const parts = [
    trimToString(name.firstName),
    trimToString(name.lastName),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' ') : null;
}

/** Formats a person's display name for UI use: first forename, surname. */
export function formatPersonName(party?: PartyWithName): string | null {
  return formatFullName(party?.person?.name);
}

/** Formats an applicant/respondent display name, preferring organisation name. */
export function returnOrgName(party?: PartyWithName): string | null {
  const name = trimToString(party?.organisation?.name);
  return name || null;
}

export function formatPartyName(party?: PartyWithName): string | null {
  return returnOrgName(party) ?? formatPersonName(party);
}

// Get today's date as a string
export function getDateStamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
