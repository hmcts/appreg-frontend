import { Injectable, signal } from '@angular/core';

export type StandardApplicantsSearchFormValue = {
  code: string;
  name: string;
};

export const DEFAULT_STANDARD_APPLICANTS_SEARCH_FORM: StandardApplicantsSearchFormValue =
  {
    code: '',
    name: '',
  };

@Injectable({
  providedIn: 'root',
})
export class StandardApplicantsSearchFormService {
  private readonly _state = signal<StandardApplicantsSearchFormValue>(
    DEFAULT_STANDARD_APPLICANTS_SEARCH_FORM,
  );

  readonly state = this._state.asReadonly();

  setState(next: StandardApplicantsSearchFormValue): void {
    this._state.set(next);
  }

  patchState(patch: Partial<StandardApplicantsSearchFormValue>): void {
    this._state.update((current) => ({ ...current, ...patch }));
  }

  reset(): void {
    this._state.set(DEFAULT_STANDARD_APPLICANTS_SEARCH_FORM);
  }
}
