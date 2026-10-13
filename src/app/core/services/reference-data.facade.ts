/**
 * GET ALL request for CJA and Court locations used in place-fields.base.ts
 */

import { isPlatformBrowser } from '@angular/common';
import {
  EnvironmentInjector,
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, expand, map, reduce } from 'rxjs/operators';

import {
  ApplicationCodesApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
} from '@openapi';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';

interface ReferenceDataState {
  cja: CriminalJusticeAreaGetDto[];
  courtLocations: CourtLocationGetSummaryDto[];
  applicationCodeTitles: string[];
  cjaLoading: boolean;
  courtsLoading: boolean;
  appCodeLoading: boolean;
  cjaLoadError: boolean;
  courtsLoadError: boolean;
  appCodeLoadError: boolean;
}

const initialReferenceDataState: ReferenceDataState = {
  cja: [],
  courtLocations: [],
  applicationCodeTitles: [],
  cjaLoading: false,
  courtsLoading: false,
  appCodeLoading: false,
  cjaLoadError: false,
  courtsLoadError: false,
  appCodeLoadError: false,
};

@Injectable({ providedIn: 'root' })
export class ReferenceDataFacade {
  // API
  private readonly cjaApi = inject(CriminalJusticeAreasApi);
  private readonly courtApi = inject(CourtLocationsApi);
  private readonly appcodeApi = inject(ApplicationCodesApi);

  private readonly envInjector = inject(EnvironmentInjector);
  private readonly pageSize = 100;

  // Signal state
  private readonly signalState = createSignalState<ReferenceDataState>(
    initialReferenceDataState,
  );
  private readonly state = this.signalState.state;

  readonly cja = computed(() => this.state().cja);
  readonly courtLocations = computed(() => this.state().courtLocations);
  readonly applicationCodeTitles = computed(
    () => this.state().applicationCodeTitles,
  );
  readonly cja$: Observable<CriminalJusticeAreaGetDto[]> = toObservable(
    this.cja,
    { injector: this.envInjector },
  );
  readonly courtLocations$: Observable<CourtLocationGetSummaryDto[]> =
    toObservable(this.courtLocations, { injector: this.envInjector });

  // Request signals
  private readonly loadCjaRequest = signal<boolean | null>(true);
  private readonly loadCourtsRequest = signal<boolean | null>(true);
  private readonly loadAllAppCodeTitlesRequest = signal<boolean | null>(true);

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.setupEffects();

    // Trigger initial loads
    this.signalState.patch({
      cjaLoading: true,
      courtsLoading: true,
      appCodeLoading: true,
    });
    this.loadCjaRequest.set(true);
    this.loadCourtsRequest.set(true);
    this.loadAllAppCodeTitlesRequest.set(true);
  }

  // Manual refresh
  refresh(): void {
    this.signalState.patch({
      cjaLoading: true,
      courtsLoading: true,
      appCodeLoading: true,
      cjaLoadError: false,
      courtsLoadError: false,
      appCodeLoadError: false,
    });
    this.loadCjaRequest.set(true);
    this.loadCourtsRequest.set(true);
    this.loadAllAppCodeTitlesRequest.set(true);
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

    setupLoadEffect(
      {
        request: () => this.loadAllAppCodeTitlesRequest(),
        load: () =>
          this.loadAllAppCodeTitles().pipe(
            catchError(() => of([] as string[])),
          ),
        onSuccess: (items) => {
          this.signalState.patch({
            applicationCodeTitles: items,
            appCodeLoading: false,
            appCodeLoadError: false,
          });
          this.loadAllAppCodeTitlesRequest.set(null);
        },
        onError: () => {
          this.signalState.patch({
            applicationCodeTitles: [],
            appCodeLoading: false,
            appCodeLoadError: true,
          });
          this.loadAllAppCodeTitlesRequest.set(null);
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

  private loadAllAppCodeTitles(): Observable<string[]> {
    const first$ = this.appcodeApi.getApplicationCodes({
      pageNumber: 0,
      pageSize: this.pageSize,
    });

    return first$.pipe(
      expand((page) =>
        page.last
          ? EMPTY
          : this.appcodeApi.getApplicationCodes({
              pageNumber: page.pageNumber + 1,
              pageSize: this.pageSize,
            }),
      ),
      map((page) => page.content.map((code) => code.title)),
      reduce((all, content) => all.concat(content)),
    );
  }
}
