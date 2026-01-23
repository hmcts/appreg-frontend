import { Injectable } from '@angular/core';

import { createSignalState } from '@util/signal-state-helpers';
import { ApplicationListRow } from '@util/types/application-list/types';

type recordsState = {
  rows: ApplicationListRow[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
  submitted: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class ApplicationListRecordsService {
  private readonly _state = createSignalState<recordsState>({
    rows: [],
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
    submitted: false,
  });

  readonly state = this._state.state;
  readonly vm = this._state.vm;
  readonly patch = this._state.patch;
}
