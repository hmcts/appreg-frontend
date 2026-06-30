import { Injectable, signal } from '@angular/core';

import { ApplicationsSearchFormValue as BaseApplicationsSearchFormValue } from '@shared-types/applications/applications.type';

export type ApplicationsSearchFormValue = BaseApplicationsSearchFormValue & {
  isAdvancedSearch: boolean;
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

@Injectable({
  providedIn: 'root',
})
export class ApplicationsSearchFormService {
  private readonly _state = signal<ApplicationsSearchFormValue>(
    DEFAULT_APPLICATIONS_SEARCH_FORM,
  );

  readonly state = this._state.asReadonly();

  setState(next: ApplicationsSearchFormValue): void {
    this._state.set(next);
  }

  patchState(patch: Partial<ApplicationsSearchFormValue>): void {
    this._state.update((current) => ({ ...current, ...patch }));
  }

  reset(): void {
    this._state.set(DEFAULT_APPLICATIONS_SEARCH_FORM);
  }
}
