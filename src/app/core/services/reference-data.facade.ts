/**
 * GET ALL request for CJA and Court locations used in place-fields.base.ts
 */

import {
  EnvironmentInjector,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, expand, map, reduce } from 'rxjs/operators';

import {
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
} from '@openapi';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';

interface ReferenceDataState {
  cja: CriminalJusticeAreaGetDto[];
  courtLocations: CourtLocationGetSummaryDto[];
  cjaLoading: boolean;
  courtsLoading: boolean;
  cjaLoadError: boolean;
  courtsLoadError: boolean;
}

const initialReferenceDataState: ReferenceDataState = {
  cja: [],
  courtLocations: [],
  cjaLoading: false,
  courtsLoading: false,
  cjaLoadError: false,
  courtsLoadError: false,
};

@Injectable({ providedIn: 'root' })
export class ReferenceDataFacade {
  // API
  private readonly cjaApi = inject(CriminalJusticeAreasApi);
  private readonly courtApi = inject(CourtLocationsApi);

  private readonly envInjector = inject(EnvironmentInjector);
  private readonly pageSize = 100;

  // Signal state
  private readonly signalState = createSignalState<ReferenceDataState>(
    initialReferenceDataState,
  );
  private readonly state = this.signalState.state;

  readonly cja = computed(() => this.state().cja);
  readonly courtLocations = computed(() => this.state().courtLocations);
  readonly cja$: Observable<CriminalJusticeAreaGetDto[]> = toObservable(
    this.cja,
    { injector: this.envInjector },
  );
  readonly courtLocations$: Observable<CourtLocationGetSummaryDto[]> =
    toObservable(this.courtLocations, { injector: this.envInjector });

  // Request signals
  private readonly loadCjaRequest = signal<boolean | null>(true);
  private readonly loadCourtsRequest = signal<boolean | null>(true);

  constructor() {
    this.setupEffects();

    // Trigger initial loads
    this.signalState.patch({ cjaLoading: true, courtsLoading: true });
    this.loadCjaRequest.set(true);
    this.loadCourtsRequest.set(true);
  }

  // Manual refresh
  refresh(): void {
    this.signalState.patch({
      cjaLoading: true,
      courtsLoading: true,
      cjaLoadError: false,
      courtsLoadError: false,
    });
    this.loadCjaRequest.set(true);
    this.loadCourtsRequest.set(true);
  }

  private setupEffects(): void {
    setupLoadEffect(
      {
        request: () => this.loadCjaRequest(),
        load: () =>
          this.loadAllCja().pipe(
            catchError(() => of([] as CriminalJusticeAreaGetDto[])),
          ),
        onSuccess: (items) => {
          this.signalState.patch({
            cja: items,
            cjaLoading: false,
            cjaLoadError: false,
          });
          this.loadCjaRequest.set(null);
        },
        onError: () => {
          this.signalState.patch({
            cja: [],
            cjaLoading: false,
            cjaLoadError: true,
          });
          this.loadCjaRequest.set(null);
        },
      },
      this.envInjector,
    );

    setupLoadEffect(
      {
        request: () => this.loadCourtsRequest(),
        load: () =>
          this.loadAllCourts().pipe(
            catchError(() => of([] as CourtLocationGetSummaryDto[])),
          ),
        onSuccess: (items) => {
          this.signalState.patch({
            courtLocations: items,
            courtsLoading: false,
            courtsLoadError: false,
          });
          this.loadCourtsRequest.set(null);
        },
        onError: () => {
          this.signalState.patch({
            courtLocations: [],
            courtsLoading: false,
            courtsLoadError: true,
          });
          this.loadCourtsRequest.set(null);
        },
      },
      this.envInjector,
    );
  }

  private loadAllCja(): Observable<CriminalJusticeAreaGetDto[]> {
    const first$ = this.cjaApi.getCriminalJusticeAreas({
      pageNumber: 0,
      pageSize: this.pageSize,
    });

    return first$.pipe(
      expand((page) =>
        page.last
          ? EMPTY
          : this.cjaApi.getCriminalJusticeAreas({
              pageNumber: page.pageNumber + 1,
              pageSize: this.pageSize,
            }),
      ),
      map((page) => page.content ?? []),
      reduce(
        (all, content) => all.concat(content),
        [] as CriminalJusticeAreaGetDto[],
      ),
    );
  }

  private loadAllCourts(): Observable<CourtLocationGetSummaryDto[]> {
    const first$ = this.courtApi.getCourtLocations({
      pageNumber: 0,
      pageSize: this.pageSize,
    });

    return first$.pipe(
      expand((page) =>
        page.last
          ? EMPTY
          : this.courtApi.getCourtLocations({
              pageNumber: page.pageNumber + 1,
              pageSize: this.pageSize,
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
