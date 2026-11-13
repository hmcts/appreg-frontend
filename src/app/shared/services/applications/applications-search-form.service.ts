/**
 * Applications search form state
 *
 * Keeps the /applications search form's values while staff move between
 * pages, so the page can restore them. Every value read or saved is a copy.
 *
 * courtChipLabels() keeps the labels of Other courts codes that the court
 * typeahead does not know, such as end-dated courts from a plain-English
 * search, so their chips keep the API's label after a restore. They are court
 * names, never question text. Only the labels of codes in the saved Other
 * courts are kept, and reset() clears them.
 */

import { Injectable, signal } from '@angular/core';

import { ApplicationsSearchFormValue as BaseApplicationsSearchFormValue } from '@shared-types/applications/applications.type';

export type ApplicationsSearchFormValue = BaseApplicationsSearchFormValue & {
  isAdvancedSearch: boolean;
};

export const DEFAULT_APPLICATIONS_SEARCH_FORM: ApplicationsSearchFormValue = {
  date: null,
  dateFrom: null,
  dateTo: null,
  applicantOrg: '',
  respondentOrg: '',
  applicantSurname: '',
  respondentSurname: '',
  applicantName: '',
  respondentName: '',
  applicationTitle: '',
  location: '',
  standardApplicantCode: '',
  respondentPostcode: '',
  accountReference: '',
  applicationCodes: [],
  resultCodes: [],
  court: '',
  courtCodes: [],
  cja: '',
  status: null,
  isAdvancedSearch: false,
};

// Copies the list values so the saved form never shares an array with the
// form controls or the defaults
const cloneSearchForm = (
  value: ApplicationsSearchFormValue,
): ApplicationsSearchFormValue => ({
  ...value,
  applicationCodes: [...value.applicationCodes],
  resultCodes: [...value.resultCodes],
  courtCodes: [...value.courtCodes],
});

@Injectable({
  providedIn: 'root',
})
export class ApplicationsSearchFormService {
  private readonly _state = signal<ApplicationsSearchFormValue>(
    cloneSearchForm(DEFAULT_APPLICATIONS_SEARCH_FORM),
  );
  private readonly _courtChipLabels = signal<Record<string, string>>({});

  readonly state = (): ApplicationsSearchFormValue =>
    cloneSearchForm(this._state());

  /** The saved labels for Other courts codes, by code. */
  readonly courtChipLabels = (): Record<string, string> => ({
    ...this._courtChipLabels(),
  });

  setState(next: ApplicationsSearchFormValue): void {
    this._state.set(cloneSearchForm(next));
  }

  patchState(patch: Partial<ApplicationsSearchFormValue>): void {
    this._state.update((current) => cloneSearchForm({ ...current, ...patch }));
  }

  /**
   * Saves the labels of the given Other courts codes only, so the labels of
   * courts that were removed are dropped.
   */
  setCourtChipLabels(
    labels: Readonly<Record<string, string>>,
    courtCodes: readonly string[],
  ): void {
    this._courtChipLabels.set(
      Object.fromEntries(
        Object.entries(labels).filter(([code]) => courtCodes.includes(code)),
      ),
    );
  }

  reset(): void {
    this._state.set(cloneSearchForm(DEFAULT_APPLICATIONS_SEARCH_FORM));
    this._courtChipLabels.set({});
  }
}
