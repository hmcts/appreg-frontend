import { Injectable, signal } from '@angular/core';

import { Duration } from '@components/duration-input/duration-input.component';

export type SearchFormValue = {
  date: string | null;
  time: Duration | null;
  description: string;
  status: string | null;
  court: string;
  location: string;
  cja: string;
};

export const DEFAULT_STATE: SearchFormValue = {
  date: null,
  time: null,
  description: '',
  status: null,
  court: '',
  location: '',
  cja: '',
};

@Injectable({
  providedIn: 'root',
})
export class ApplicationListSearchFormService {
  private readonly _state = signal<SearchFormValue>(DEFAULT_STATE);

  readonly state = this._state.asReadonly();

  setState(next: SearchFormValue): void {
    this._state.set(next);
  }

  patchState(patch: Partial<SearchFormValue>): void {
    this._state.update((curr) => ({ ...curr, ...patch }));
  }

  reset(): void {
    this._state.set(DEFAULT_STATE);
  }
}
