import { Injectable, signal } from '@angular/core';

import {
  ApplicationsState,
  createInitialApplicationsState,
} from '@components/applications/util/applications.state';
import { createSignalState } from '@util/signal-state-helpers';

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
  courthouseSearch: string;
  cjaSearch: string;
};

const createDefaultApplicationsSearchFormValue =
  (): ApplicationsSearchFormValue => ({
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
    courthouseSearch: '',
    cjaSearch: '',
  });

@Injectable({ providedIn: 'root' })
export class ApplicationsSearchStateService {
  private readonly signalState = createSignalState<ApplicationsState>(
    createInitialApplicationsState(),
  );
  private readonly formSignal = signal<ApplicationsSearchFormValue>(
    createDefaultApplicationsSearchFormValue(),
  );

  readonly state = this.signalState.state;
  readonly vm = this.signalState.vm;
  readonly patch = this.signalState.patch;
  readonly formState = this.formSignal.asReadonly();

  setFormState(next: ApplicationsSearchFormValue): void {
    this.formSignal.set({
      ...createDefaultApplicationsSearchFormValue(),
      ...next,
    });
  }

  reset(): void {
    this.state.set(createInitialApplicationsState());
    this.formSignal.set(createDefaultApplicationsSearchFormValue());
  }
}
