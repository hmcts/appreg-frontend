import { Injectable, signal } from '@angular/core';

import {
  ApplicationsState,
  initialApplicationsState,
} from '@components/applications/util/applications.state';

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
  searchErrors: state.searchErrors.map((error) => ({ ...error })),
  errorSummary: state.errorSummary.map((error) => ({ ...error })),
  rows: state.rows.map((row) => ({ ...row })),
  sortField: { ...state.sortField },
  selectedIds: new Set(state.selectedIds),
  selectedRows: state.selectedRows.map((row) => ({ ...row })),
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
  private readonly snapshotState =
    signal<ApplicationsSearchSnapshot>(defaultSnapshot());
  private readonly refreshOnRestore = signal(false);

  readonly state = (): ApplicationsSearchSnapshot =>
    cloneSnapshot(this.snapshotState());

  save(form: ApplicationsSearchFormValue, state: ApplicationsState): void {
    this.snapshotState.set(
      cloneSnapshot({
        form,
        state,
      }),
    );
  }

  requestRefreshOnRestore(): void {
    this.refreshOnRestore.set(true);
  }

  consumeRefreshOnRestore(): boolean {
    const shouldRefresh = this.refreshOnRestore();

    if (shouldRefresh) {
      this.refreshOnRestore.set(false);
    }

    return shouldRefresh;
  }

  setAdvancedSearch(isAdvancedSearch: boolean): void {
    this.snapshotState.update((current) =>
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
    this.snapshotState.set(defaultSnapshot());
    this.refreshOnRestore.set(false);
  }
}
