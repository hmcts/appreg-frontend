/*
attachLocationDisabler
Feature helper for Applications List forms.

Purpose:
- Toggle enabled/disabled state of location-related controls based on selection
  (e.g., court vs CJA vs free-text “other location”).
- A page can also pass an additionalCourts control (a list of court codes, such
  as Other courts on /applications). Holding at least one code counts as a
  court, and a location or CJA disables it with the court. Pages that do not
  pass it behave as before.

----------------

Court and CJA Text Suggestions Helpers
Used by applications-list, applications-list-create, application-list-detail .

Functionality:
- onCourthouseInputChange(): updates court field and filters courthouse suggestions
- onCjaInputChange(): updates CJA field and filters CJA suggestions
- selectCourthouse(): sets selected courthouse value and clears suggestions
- selectCja(): sets selected CJA value and clears suggestions

Input: FormGroup, current search string, and available data lists
Output: Updated filtered lists and selected values

-----------------
Ensures court location && (location || cja) is followed
Else return informative string to display
*/

import { AbstractControl, FormGroup } from '@angular/forms';
import { Subscription, merge } from 'rxjs';

import { has } from './has';
import { trimStringToLowerCase } from './string-helpers';

import {
  CjaSuggestionItem,
  CourtSuggestionItem,
  toCjaSuggestionItem,
  toCourtSuggestionItem,
} from '@components/suggestions/suggestions.types';
import { FormRaw } from '@core-types/forms/forms.types';
import {
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '@openapi';

export interface LocationControls {
  court: AbstractControl;
  location: AbstractControl;
  cja: AbstractControl;
  /**
   * More courts as a list of codes (Other courts on /applications). Optional:
   * without it, only `court` counts as a court.
   */
  additionalCourts?: AbstractControl;
}

/**
 * True when a list of court codes holds at least one non-blank code. Arrays
 * are checked here because has() is true for any array, even an empty one.
 */
export function hasCourtCodes(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some((code) => typeof code === 'string' && code.trim().length > 0)
  );
}

const enableAll = (controls: readonly AbstractControl[]): void => {
  for (const control of controls) {
    control.enable({ emitEvent: false });
  }
};

const disableAll = (controls: readonly AbstractControl[]): void => {
  for (const control of controls) {
    control.disable({ emitEvent: false });
  }
};

/**
 * Wires mutually exclusive enable/disable for court (and any additional
 * courts) vs location+cja.
 */
export function attachLocationDisabler({
  court,
  location,
  cja,
  additionalCourts,
}: LocationControls): Subscription {
  const courts = additionalCourts ? [court, additionalCourts] : [court];

  const sync = () => {
    const hasCourt = has(court.value) || hasCourtCodes(additionalCourts?.value);
    const hasLoc = has(location.value);
    const hasCja = has(cja.value);

    if (hasCourt) {
      enableAll(courts);
      disableAll([location, cja]);
    } else if (hasLoc || hasCja) {
      disableAll(courts);
      enableAll([location, cja]);
    } else {
      enableAll([...courts, location, cja]);
    }
  };

  const sub = merge(
    ...[...courts, location, cja].map((control) => control.valueChanges),
  ).subscribe(sync);

  sync();
  return sub;
}

export function onCourthouseInputChange(
  form: FormGroup,
  courthouseSearch: string,
  courtLocations: CourtLocationGetSummaryDto[],
): CourtSuggestionItem[] {
  form.controls['court'].setValue(courthouseSearch || '');
  const filtered = filterSuggestions(
    courtLocations,
    courthouseSearch,
    courtMatches,
  );
  return filtered.map(toCourtSuggestionItem);
}

export function onCjaInputChange(
  form: FormGroup,
  cjaSearch: string,
  cja: CriminalJusticeAreaGetDto[],
): CjaSuggestionItem[] {
  form.controls['cja'].setValue(cjaSearch || '');
  const filtered = filterSuggestions(cja, cjaSearch, cjaMatches);
  return filtered.map(toCjaSuggestionItem);
}

export function selectCourthouse(
  form: FormGroup,
  c: CourtLocationGetSummaryDto,
): {
  courthouseSearch: string;
  filteredCourthouses: CourtSuggestionItem[];
} {
  const value = c.locationCode ?? '';
  const label = toCourtSuggestionItem(c).label;
  form.controls['court'].setValue(value);
  return { courthouseSearch: label, filteredCourthouses: [] };
}

export function selectCja(
  form: FormGroup,
  c: CriminalJusticeAreaGetDto | CjaSuggestionItem,
): { cjaSearch: string; filteredCja: CjaSuggestionItem[] } {
  const value = c.code ?? '';
  const label = toCjaSuggestionItem(c).label;
  form.controls['cja'].setValue(value);
  return { cjaSearch: label, filteredCja: [] };
}

export const validateCourtVsLocOrCja = (
  v: Pick<FormRaw<unknown>, 'court' | 'location' | 'cja'>,
): string | null => {
  const court = has(v.court);
  const loc = has(v.location);
  const cja = has(v.cja);
  return court && (loc || cja)
    ? 'You can not have Court and Other Location or CJA filled in'
    : null;
};

function filterSuggestions<T>(
  items: T[],
  query: string,
  matches: (item: T, q: string) => boolean,
  limit = 20,
): T[] {
  const q = trimStringToLowerCase(query ?? '');
  if (!q) {
    return [];
  }
  return (items ?? []).filter((i) => matches(i, q)).slice(0, limit);
}

// Both location filters also match the displayed "code - name/description"
// label so editing a selected label does not make its suggestion disappear.
// Filtering alone does not select an entry or restore its stored code.
const courtMatches = (c: CourtLocationGetSummaryDto, q: string): boolean =>
  (c.name ?? '').toLowerCase().includes(q) ||
  (c.locationCode ?? '').toLowerCase().includes(q) ||
  toCourtSuggestionItem(c).label.toLowerCase().includes(q);

const cjaMatches = (x: CriminalJusticeAreaGetDto, q: string): boolean =>
  (x.code ?? '').toLowerCase().includes(q) ||
  (x.description ?? '').toLowerCase().includes(q) ||
  toCjaSuggestionItem(x).label.toLowerCase().includes(q);
