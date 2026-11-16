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

  /** Other courts labels, by code: court names, never question text. */
  readonly courtChipLabels = (): Record<string, string> => ({
    ...this._courtChipLabels(),
  });

  setState(next: ApplicationsSearchFormValue): void {
    this._state.set(cloneSearchForm(next));
  }

  patchState(patch: Partial<ApplicationsSearchFormValue>): void {
    this._state.update((current) => cloneSearchForm({ ...current, ...patch }));
  }

  /** Keeps only the given codes' labels, so removed courts' labels go. */
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
