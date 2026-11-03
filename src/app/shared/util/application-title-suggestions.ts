import { WritableSignal } from '@angular/core';
import { FormControl } from '@angular/forms';

import {
  ApplicationCodeTitleSuggestionItem,
  SuggestionsItem,
  isAppcodeSuggestionItem,
  toAppcodeSuggestionsItem,
} from '@components/suggestions/suggestions.types';
import { ReferenceDataFacade } from '@core/services/reference-data.facade';

export function filterAppTitles(
  value: string,
  facade: ReferenceDataFacade,
): ApplicationCodeTitleSuggestionItem[] {
  const filterFor = value.trim().toLowerCase();

  if (!filterFor) {
    return [];
  }

  return [...new Set(facade.applicationCodeTitles())]
    .filter((title) => title.toLowerCase().includes(filterFor))
    .slice(0, 20)
    .map(toAppcodeSuggestionsItem);
}

export function titleInputChange(
  value: string,
  control: FormControl<string | null>,
  searchValue: WritableSignal<string>,
): void {
  searchValue.set(value);
  control.setValue(value);
}

export function TitleSelected(
  item: SuggestionsItem,
  searchValue: WritableSignal<string>,
  control: FormControl<string | null>,
): void {
  if (isAppcodeSuggestionItem(item)) {
    searchValue.set(item.value);
    control.setValue(item.value);
  }
}
