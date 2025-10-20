// suggestions-helpers.ts
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
