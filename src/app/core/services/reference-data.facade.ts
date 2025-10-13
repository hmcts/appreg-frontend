import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import {
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
} from '../../../generated/openapi';

@Injectable({ providedIn: 'root' })
export class ReferenceDataFacade {
  readonly cja$: Observable<CriminalJusticeAreaGetDto[]>;
  readonly courtLocations$: Observable<CourtLocationGetSummaryDto[]>;

  constructor(
    private cjaApi: CriminalJusticeAreasApi,
    private courtApi: CourtLocationsApi,
  ) {
    this.cja$ = this.cjaApi.getCriminalJusticeAreas().pipe(
      map((p) => p?.content ?? []),
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.courtLocations$ = this.courtApi.getCourtLocations().pipe(
      map((p) => p?.content ?? []),
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }
}
