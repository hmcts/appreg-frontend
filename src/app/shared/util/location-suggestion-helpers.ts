/*
attachLocationDisabler
Feature helper for Applications List forms.

Purpose:
- Toggle enabled/disabled state of location-related controls based on selection
  (e.g., court vs CJA vs free-text “other location”).

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
}

/** Wires mutually exclusive enable/disable for court vs location+cja. */
export function attachLocationDisabler({
  court,
  location,
  cja,
}: LocationControls): Subscription {
  const sync = () => {
    const hasCourt = has(court.value);
    const hasLoc = has(location.value);
    const hasCja = has(cja.value);

    if (hasCourt) {
      court.enable({ emitEvent: false });
      location.disable({ emitEvent: false });
      cja.disable({ emitEvent: false });
    } else if (hasLoc || hasCja) {
      court.disable({ emitEvent: false });
      location.enable({ emitEvent: false });
      cja.enable({ emitEvent: false });
    } else {
      court.enable({ emitEvent: false });
      location.enable({ emitEvent: false });
      cja.enable({ emitEvent: false });
    }
  };

  const sub = merge(
    court.valueChanges,
    location.valueChanges,
    cja.valueChanges,
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
  c: CourtLocationGetSummaryDto | CourtSuggestionItem,
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

const courtMatches = (
  c: { name?: string; locationCode?: string },
  q: string,
): boolean =>
  (c.name ?? '').toLowerCase().includes(q) ||
  (c.locationCode ?? '').toLowerCase().includes(q);

const cjaMatches = (
  x: { code?: string; description?: string },
  q: string,
): boolean =>
  (x.code ?? '').toLowerCase().includes(q) ||
  (x.description ?? '').toLowerCase().includes(q);
