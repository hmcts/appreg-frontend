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

export function onCourthouseInputChange(
  form: FormGroup,
  courthouseSearch: string,
  courtLocations: CourtLocationGetSummaryDto[],
): CourtLocationGetSummaryDto[] {
  form.controls['court'].setValue(courthouseSearch || '');
  return filterSuggestions(courtLocations, courthouseSearch, courtMatches);
}

export function onCjaInputChange(
  form: FormGroup,
  cjaSearch: string,
  cja: CriminalJusticeAreaGetDto[],
): CriminalJusticeAreaGetDto[] {
  form.controls['cja'].setValue(cjaSearch || '');
  return filterSuggestions(cja, cjaSearch, cjaMatches);
}

export function selectCourthouse(
  form: FormGroup,
  c: { locationCode?: string } | CourtLocationGetSummaryDto,
): {
  courthouseSearch: string;
  filteredCourthouses: CourtLocationGetSummaryDto[];
} {
  const label = c.locationCode ?? '';
  form.controls['court'].setValue(label);
  return { courthouseSearch: label, filteredCourthouses: [] };
}

export function selectCja(
  form: FormGroup,
  c: { code?: string } | CriminalJusticeAreaGetDto,
): { cjaSearch: string; filteredCja: CriminalJusticeAreaGetDto[] } {
  const label = c.code ?? '';
  form.controls['cja'].setValue(label);
  return { cjaSearch: label, filteredCja: [] };
}
