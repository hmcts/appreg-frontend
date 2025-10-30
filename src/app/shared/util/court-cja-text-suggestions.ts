/* 
Court and CJA Text Suggestions Helpers
Used by applications-list, applications-list-create, application-list-detail .

Functionality:
- onCourthouseInputChange(): updates court field and filters courthouse suggestions
- onCjaInputChange(): updates CJA field and filters CJA suggestions
- selectCourthouse(): sets selected courthouse value and clears suggestions
- selectCja(): sets selected CJA value and clears suggestions

Input: FormGroup, current search string, and available data lists
Output: Updated filtered lists and selected values
*/

import { FormGroup } from '@angular/forms';

import {
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '../../../generated/openapi';

import { cjaMatches, courtMatches, filterSuggestions } from './suggestions';

type WithLabelValue<T> = T & { label?: string; value?: string };

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
