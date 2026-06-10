import { Injectable, computed, signal } from '@angular/core';

import {
  ApplicationsState,
  initialApplicationsState,
} from './applications.state';

export type ApplicationsSearchFormValue = {
  date: string | null;
  applicantOrg: string;
  respondentOrg: string;
  applicantSurname: string;
  respondentSurname: string;
  location: string;
  standardApplicantCode: string;
  respondentPostcode: string;
  accountReference: string;
  court: string;
  cja: string;
  status: string | null;
  isAdvancedSearch: boolean;
};

export type ApplicationsSearchSnapshot = {
  form: ApplicationsSearchFormValue;
  state: ApplicationsState;
};

export const DEFAULT_APPLICATIONS_SEARCH_FORM: ApplicationsSearchFormValue = {
  date: null,
  applicantOrg: '',
  respondentOrg: '',
  applicantSurname: '',
  respondentSurname: '',
  location: '',
  standardApplicantCode: '',
  respondentPostcode: '',
  accountReference: '',
  court: '',
  cja: '',
  status: null,
  isAdvancedSearch: false,
};

export const cloneApplicationsState = (
  state: ApplicationsState,
): ApplicationsState => ({
  ...state,
  isLoading: false,
  isSelectingAll: false,
  searchErrors: [...state.searchErrors],
  errorSummary: [...state.errorSummary],
  rows: [...state.rows],
  sortField: { ...state.sortField },
  selectedIds: new Set(state.selectedIds),
  selectedRows: [...state.selectedRows],
  getFilters: { ...state.getFilters },
});

const cloneSearchForm = (
  form: ApplicationsSearchFormValue,
): ApplicationsSearchFormValue => ({
  ...form,
});

const defaultSnapshot = (): ApplicationsSearchSnapshot => ({
  form: cloneSearchForm(DEFAULT_APPLICATIONS_SEARCH_FORM),
  state: cloneApplicationsState(initialApplicationsState),
});

const cloneSnapshot = (
  snapshot: ApplicationsSearchSnapshot,
): ApplicationsSearchSnapshot => ({
  form: cloneSearchForm(snapshot.form),
  state: cloneApplicationsState(snapshot.state),
});

@Injectable({
  providedIn: 'root',
})
export class ApplicationsSearchStateService {
  private readonly _state =
    signal<ApplicationsSearchSnapshot>(defaultSnapshot());

  readonly state = computed(() => cloneSnapshot(this._state()));

  save(form: ApplicationsSearchFormValue, state: ApplicationsState): void {
    this._state.set(
      cloneSnapshot({
        form,
        state,
      }),
    );
  }

  setAdvancedSearch(isAdvancedSearch: boolean): void {
    this._state.update((current) =>
      cloneSnapshot({
        form: {
          ...current.form,
          isAdvancedSearch,
        },
        state: {
          ...current.state,
          isAdvancedSearch,
        },
      }),
    );
  }

  reset(): void {
    this._state.set(defaultSnapshot());
  }
}
