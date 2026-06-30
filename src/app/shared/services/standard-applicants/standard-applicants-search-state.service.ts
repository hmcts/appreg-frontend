import { Injectable, signal } from '@angular/core';

import {
  StandardApplicantFilters,
  StandardApplicantsState,
} from '@components/standard-applicants/standard-applicants.component';

export type StandardApplicantsSearchState = Pick<
  StandardApplicantsState,
  'hasSearched' | 'currentPage' | 'pageSize' | 'sortField'
> & {
  appliedFilters: StandardApplicantFilters;
};

export const DEFAULT_STANDARD_APPLICANTS_SEARCH_STATE: StandardApplicantsSearchState =
  {
    hasSearched: false,
    currentPage: 0,
    pageSize: 10,
    sortField: { key: 'code', direction: 'asc' },
    appliedFilters: {},
  };

@Injectable({ providedIn: 'root' })
export class StandardApplicantsSearchStateService {
  private readonly _state = signal<StandardApplicantsSearchState>(
    DEFAULT_STANDARD_APPLICANTS_SEARCH_STATE,
  );

  readonly state = this._state.asReadonly();

  setState(next: StandardApplicantsSearchState): void {
    this._state.set({
      ...next,
      sortField: { ...next.sortField },
      appliedFilters: { ...next.appliedFilters },
    });
  }

  patchState(patch: Partial<StandardApplicantsSearchState>): void {
    this._state.update((current) => ({
      ...current,
      ...patch,
      sortField: patch.sortField
        ? { ...patch.sortField }
        : { ...current.sortField },
      appliedFilters: patch.appliedFilters
        ? { ...patch.appliedFilters }
        : { ...current.appliedFilters },
    }));
  }

  reset(): void {
    this._state.set(DEFAULT_STANDARD_APPLICANTS_SEARCH_STATE);
  }
}
