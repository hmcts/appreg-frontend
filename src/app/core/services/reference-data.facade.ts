/**
 * Root store for reference data used across the search and place fields.
 *
 * - CJAs, court locations and application codes are fully paged GET ALL
 *   requests that start when the facade is created in the browser
 *   (place-fields.base.ts and the Applications page use them).
 * - Result codes are loaded lazily and fully paged: nothing is requested until
 *   a page calls ensureResultCodes().
 * - Nothing is requested during server-side rendering.
 */

import { isPlatformBrowser } from '@angular/common';
import {
  EnvironmentInjector,
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, Observable } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';

import {
  ApplicationCodeGetSummaryDto,
  ApplicationCodesApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
  ResultCodeGetSummaryDto,
  ResultCodesApi,
} from '@openapi';
import { loadAllResultCodes$ } from '@util/result-code-helpers';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';

interface ReferenceDataState {
  cja: CriminalJusticeAreaGetDto[];
  courtLocations: CourtLocationGetSummaryDto[];
  applicationCodes: ApplicationCodeGetSummaryDto[];
  resultCodes: ResultCodeGetSummaryDto[];
  cjaLoading: boolean;
  courtsLoading: boolean;
  appCodeLoading: boolean;
  resultCodesLoading: boolean;
  resultCodesLoaded: boolean;
  cjaLoadError: boolean;
  courtsLoadError: boolean;
  appCodeLoadError: boolean;
  resultCodesLoadError: boolean;
}

const initialReferenceDataState: ReferenceDataState = {
  cja: [],
  courtLocations: [],
  applicationCodes: [],
  resultCodes: [],
  cjaLoading: false,
  courtsLoading: false,
  appCodeLoading: false,
  resultCodesLoading: false,
  resultCodesLoaded: false,
  cjaLoadError: false,
  courtsLoadError: false,
  appCodeLoadError: false,
  resultCodesLoadError: false,
};

@Injectable({ providedIn: 'root' })
export class ReferenceDataFacade {
  // API
  private readonly cjaApi = inject(CriminalJusticeAreasApi);
  private readonly courtApi = inject(CourtLocationsApi);
  private readonly appcodeApi = inject(ApplicationCodesApi);
  private readonly resultCodeApi = inject(ResultCodesApi);

  private readonly envInjector = inject(EnvironmentInjector);
  private readonly pageSize = 100;

  // Signal state
  private readonly signalState = createSignalState<ReferenceDataState>(
    initialReferenceDataState,
  );
  private readonly state = this.signalState.state;

  // for Applications page only; result codes count once a page has asked for them
  readonly hasLoadError = computed(
    () =>
      this.state().cjaLoadError ||
      this.state().courtsLoadError ||
      this.state().appCodeLoadError ||
      this.state().resultCodesLoadError,
  );

  readonly hasPlaceLoadError = computed(
    () => this.state().cjaLoadError || this.state().courtsLoadError,
  );

  readonly cja = computed(() => this.state().cja);
  readonly courtLocations = computed(() => this.state().courtLocations);
  readonly applicationCodes = computed(() => this.state().applicationCodes);
  readonly applicationCodeTitles = computed(() =>
    this.applicationCodes().map((code) => code.title),
  );
  readonly resultCodes = computed(() => this.state().resultCodes);
  readonly resultCodesLoading = computed(() => this.state().resultCodesLoading);
  readonly resultCodesLoadError = computed(
    () => this.state().resultCodesLoadError,
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
  private readonly loadAllAppCodesRequest = signal<boolean | null>(true);
  private readonly loadResultCodesRequest = signal<boolean | null>(null);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Set by the first ensureResultCodes() call so refresh() only retries result codes a page uses
  private resultCodesRequested = false;

  constructor() {
    if (!this.isBrowser) {
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
    this.loadAllAppCodesRequest.set(true);
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
    this.loadAllAppCodesRequest.set(true);

    if (this.resultCodesRequested) {
      this.startResultCodesLoad();
    }
  }

  /**
   * Loads every result code the first time a page asks for them. Does nothing
   * while a load is in flight, after a successful load, or on the server. After
   * a failed load, calling it again retries.
   */
  ensureResultCodes(): void {
    // untracked: an effect or computed that calls this must not re-run on every state change
    const { resultCodesLoading, resultCodesLoaded } = untracked(this.state);
    if (!this.isBrowser || resultCodesLoading || resultCodesLoaded) {
      return;
    }

    this.resultCodesRequested = true;
    this.startResultCodesLoad();
  }

  private startResultCodesLoad(): void {
    this.signalState.patch({
      resultCodesLoading: true,
      resultCodesLoadError: false,
    });
    this.loadResultCodesRequest.set(true);
  }

  private setupEffects(): void {
    setupLoadEffect(
      {
        request: () => this.loadCjaRequest(),
        load: () => this.loadAllCja(),
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
        load: () => this.loadAllCourts(),
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
        request: () => this.loadAllAppCodesRequest(),
        load: () => this.loadAllAppCodes(),
        onSuccess: (items) => {
          this.signalState.patch({
            applicationCodes: items,
            appCodeLoading: false,
            appCodeLoadError: false,
          });
          this.loadAllAppCodesRequest.set(null);
        },
        onError: () => {
          this.signalState.patch({
            applicationCodes: [],
            appCodeLoading: false,
            appCodeLoadError: true,
          });
          this.loadAllAppCodesRequest.set(null);
        },
      },
      this.envInjector,
    );

    setupLoadEffect(
      {
        request: () => this.loadResultCodesRequest(),
        load: () => loadAllResultCodes$(this.resultCodeApi, this.pageSize),
        onSuccess: (items) => {
          this.signalState.patch({
            resultCodes: items,
            resultCodesLoading: false,
            resultCodesLoaded: true,
            resultCodesLoadError: false,
          });
          this.loadResultCodesRequest.set(null);
        },
        onError: () => {
          this.signalState.patch({
            resultCodes: [],
            resultCodesLoading: false,
            resultCodesLoaded: false,
            resultCodesLoadError: true,
          });
          this.loadResultCodesRequest.set(null);
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

  private loadAllAppCodes(): Observable<ApplicationCodeGetSummaryDto[]> {
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
      map((page) => page.content ?? []),
      reduce(
        (all, content) => all.concat(content),
        [] as ApplicationCodeGetSummaryDto[],
      ),
    );
  }
}
