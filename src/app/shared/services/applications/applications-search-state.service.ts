import { Injectable, signal } from '@angular/core';

import {
  type ApplicationsState,
  defaultApplicationsSort,
} from '@components/applications/util/applications.state';
import { EntryGetFilterDto } from '@openapi';

export type ApplicationsSearchState = Pick<
  ApplicationsState,
  'currentPage' | 'pageSize' | 'sortField'
> & {
  hasSearched: boolean;
  appliedFilters: EntryGetFilterDto;
};

export const DEFAULT_APPLICATIONS_SEARCH_STATE: ApplicationsSearchState = {
  hasSearched: false,
  currentPage: 0,
  pageSize: 10,
  sortField: defaultApplicationsSort(),
  appliedFilters: {},
};

const cloneSearchState = (
  state: ApplicationsSearchState,
): ApplicationsSearchState => ({
  ...state,
  sortField: { ...state.sortField },
  appliedFilters: { ...state.appliedFilters },
});

@Injectable({
  providedIn: 'root',
})
export class ApplicationsSearchStateService {
  private readonly _state = signal<ApplicationsSearchState>(
    cloneSearchState(DEFAULT_APPLICATIONS_SEARCH_STATE),
  );

  readonly state = (): ApplicationsSearchState =>
    cloneSearchState(this._state());

  setState(next: ApplicationsSearchState): void {
    this._state.set(cloneSearchState(next));
  }

  patchState(patch: Partial<ApplicationsSearchState>): void {
    this._state.update((current) =>
      cloneSearchState({
        ...current,
        ...patch,
        sortField: patch.sortField
          ? { ...patch.sortField }
          : { ...current.sortField },
        appliedFilters: patch.appliedFilters
          ? { ...patch.appliedFilters }
          : { ...current.appliedFilters },
      }),
    );
  }

  reset(): void {
    this._state.set(cloneSearchState(DEFAULT_APPLICATIONS_SEARCH_STATE));
  }
}
