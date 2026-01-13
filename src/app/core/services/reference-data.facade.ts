import { Injectable } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, expand, map, reduce, shareReplay } from 'rxjs/operators';

import {
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
} from '@openapi';

@Injectable({ providedIn: 'root' })
export class ReferenceDataFacade {
  readonly cja$: Observable<CriminalJusticeAreaGetDto[]>;
  readonly courtLocations$: Observable<CourtLocationGetSummaryDto[]>;

  private readonly pageSize = 100;

  constructor(
    private readonly cjaApi: CriminalJusticeAreasApi,
    private readonly courtApi: CourtLocationsApi,
  ) {
    this.cja$ = this.loadAllCja().pipe(
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.courtLocations$ = this.loadAllCourts().pipe(
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  private loadAllCja(): Observable<CriminalJusticeAreaGetDto[]> {
    const first$ = this.cjaApi.getCriminalJusticeAreas({
      page: 0,
      size: this.pageSize,
    });

    return first$.pipe(
      // Continue query until last
      expand((page) =>
        page.last
          ? EMPTY
          : this.cjaApi.getCriminalJusticeAreas({
              page: page.pageNumber + 1,
              size: this.pageSize,
            }),
      ),
      // Extract and concatenate content
      map((page) => page.content ?? []),
      reduce(
        (all, content) => all.concat(content),
        [] as CriminalJusticeAreaGetDto[],
      ),
    );
  }

  private loadAllCourts(): Observable<CourtLocationGetSummaryDto[]> {
    const first$ = this.courtApi.getCourtLocations({
      page: 0,
      size: this.pageSize,
    });

    return first$.pipe(
      expand((page) =>
        page.last
          ? EMPTY
          : this.courtApi.getCourtLocations({
              page: page.pageNumber + 1,
              size: this.pageSize,
            }),
      ),
      map((page) => page.content ?? []),
      reduce(
        (all, content) => all.concat(content),
        [] as CourtLocationGetSummaryDto[],
      ),
    );
  }
}
