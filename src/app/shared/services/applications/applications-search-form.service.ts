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
});

@Injectable({
  providedIn: 'root',
})
export class ApplicationsSearchFormService {
  private readonly _state = signal<ApplicationsSearchFormValue>(
    cloneSearchForm(DEFAULT_APPLICATIONS_SEARCH_FORM),
  );

  readonly state = (): ApplicationsSearchFormValue =>
    cloneSearchForm(this._state());

  setState(next: ApplicationsSearchFormValue): void {
    this._state.set(cloneSearchForm(next));
  }

  patchState(patch: Partial<ApplicationsSearchFormValue>): void {
    this._state.update((current) => cloneSearchForm({ ...current, ...patch }));
  }

  reset(): void {
    this._state.set(cloneSearchForm(DEFAULT_APPLICATIONS_SEARCH_FORM));
  }
}
