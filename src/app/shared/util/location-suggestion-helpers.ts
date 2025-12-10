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

import {
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '../../../generated/openapi';

import { has } from './has';
import { FormRaw } from './types/shared-types';

export interface LocationControls {
  court: AbstractControl;
  location: AbstractControl;
  cja: AbstractControl;
}

type WithLabelValue<T> = T & { label?: string; value?: string };

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

const courtLabel = (c: { locationCode?: string; name?: string }) => {
  const code = c.locationCode ?? '';
  return c.name ? `${code} - ${c.name}` : code;
};
const cjaLabel = (a: { code?: string; description?: string }) => {
  const code = a.code ?? '';
  return a.description ? `${code} - ${a.description}` : code;
};

export function onCourthouseInputChange(
  form: FormGroup,
  courthouseSearch: string,
  courtLocations: CourtLocationGetSummaryDto[],
): CourtLocationGetSummaryDto[] {
  form.controls['court'].setValue(courthouseSearch || '');
  const filtered = filterSuggestions(
    courtLocations,
    courthouseSearch,
    courtMatches,
  );
  return filtered.map(
    (c) =>
      ({
        ...c,
        label: courtLabel(c),
        value: c.locationCode,
      }) as WithLabelValue<CourtLocationGetSummaryDto>,
  );
}

export function onCjaInputChange(
  form: FormGroup,
  cjaSearch: string,
  cja: CriminalJusticeAreaGetDto[],
): CriminalJusticeAreaGetDto[] {
  form.controls['cja'].setValue(cjaSearch || '');
  const filtered = filterSuggestions(cja, cjaSearch, cjaMatches);
  return filtered.map(
    (a) =>
      ({
        ...a,
        label: cjaLabel(a),
        value: a.code,
      }) as WithLabelValue<CriminalJusticeAreaGetDto>,
  );
}

export function selectCourthouse(
  form: FormGroup,
  c: { locationCode?: string; name?: string } | CourtLocationGetSummaryDto,
): {
  courthouseSearch: string;
  filteredCourthouses: CourtLocationGetSummaryDto[];
} {
  const value = c.locationCode ?? '';
  const label = courtLabel(c as { locationCode?: string; name?: string });
  form.controls['court'].setValue(value);
  return { courthouseSearch: label, filteredCourthouses: [] };
}

export function selectCja(
  form: FormGroup,
  c: { code?: string; description?: string } | CriminalJusticeAreaGetDto,
): { cjaSearch: string; filteredCja: CriminalJusticeAreaGetDto[] } {
  const value = c.code ?? '';
  const label = cjaLabel(c as { code?: string; description?: string });
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
  const q = (query ?? '').trim().toLowerCase();
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
