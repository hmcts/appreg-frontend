import {
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '@openapi';
import { PlaceFieldsBase } from '@util/place-fields.base';

export type SuggestionsFacade = {
  // Court
  courthouseSearch: () => string;
  setCourthouseSearch: (v: string) => void;
  filteredCourthouses: () => CourtLocationGetSummaryDto[];
  onCourthouseInputChange: () => void;
  selectCourthouse: (item: unknown) => void;

  // CJA
  cjaSearch: () => string;
  setCjaSearch: (v: string) => void;
  filteredCja: () => CriminalJusticeAreaGetDto[];
  onCjaInputChange: () => void;
  selectCja: (item: unknown) => void;
};

export function buildSuggestionsFacade(
  host: PlaceFieldsBase,
): SuggestionsFacade {
  return {
    courthouseSearch: () => host.placeState().courthouseSearch ?? '',
    setCourthouseSearch: (v) => host.setCourthouseSearch(v),
    filteredCourthouses: () => host.placeState().filteredCourthouses ?? [],
    onCourthouseInputChange: () => host.onCourthouseInputChange(),
    selectCourthouse: (x) => host.selectCourthouse(x),

    cjaSearch: () => host.placeState().cjaSearch ?? '',
    setCjaSearch: (v) => host.setCjaSearch(v),
    filteredCja: () => host.placeState().filteredCja ?? [],
    onCjaInputChange: () => host.onCjaInputChange(),
    selectCja: (x) => host.selectCja(x),
  };
}
