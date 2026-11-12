/**
 * Which AI features the current user can use, from GET /ai/capabilities.
 *
 * Pages call refresh() in ngOnInit, so a change on the server (the admin
 * kill switch or the ai-pilot role) takes effect on the next page visit.
 * Requests are made in the browser only.
 *
 * Fails closed, so the manual forms are used instead:
 * - both features are off on the server, before the first refresh and while
 *   a request is in flight;
 * - an error turns both features off;
 * - a flag that is missing, null or not a boolean counts as off.
 *
 * When refresh() is called again before an earlier request finishes, the
 * earlier request is cancelled and only the newest response is used.
 */

import { isPlatformBrowser } from '@angular/common';
import {
  EnvironmentInjector,
  Injectable,
  PLATFORM_ID,
  type Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { map } from 'rxjs/operators';

import { AiApi, AiCapabilitiesDto } from '@openapi';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';

interface AiCapabilitiesState {
  searchInterpretation: boolean;
  codeSuggestions: boolean;
}

const allFeaturesOff: AiCapabilitiesState = {
  searchInterpretation: false,
  codeSuggestions: false,
};

interface AiCapabilitiesResponse {
  requestId: number;
  capabilities: AiCapabilitiesDto | null | undefined;
}

@Injectable({ providedIn: 'root' })
export class AiCapabilitiesFacade {
  // API
  private readonly aiApi = inject(AiApi);

  private readonly envInjector = inject(EnvironmentInjector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Signal state
  private readonly signalState =
    createSignalState<AiCapabilitiesState>(allFeaturesOff);
  private readonly state = this.signalState.state;

  readonly searchInterpretationEnabled: Signal<boolean> = computed(
    () => this.state().searchInterpretation,
  );
  readonly codeSuggestionsEnabled: Signal<boolean> = computed(
    () => this.state().codeSuggestions,
  );

  // Request signal: each refresh gets a new id, so the load effect runs again
  // (cancelling any request in flight) even while an earlier one is loading.
  private latestRequestId = 0;
  private readonly capabilitiesRequest = signal<number | null>(null);

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    this.setupEffects();
  }

  // Requests the capabilities again; both features are off until it answers.
  refresh(): void {
    if (!this.isBrowser) {
      return;
    }

    this.latestRequestId += 1;
    this.signalState.patch(allFeaturesOff);
    this.capabilitiesRequest.set(this.latestRequestId);
  }

  private setupEffects(): void {
    setupLoadEffect(
      {
        request: () => this.capabilitiesRequest(),
        load: (requestId) =>
          this.aiApi
            .getAiCapabilities('body', false, { transferCache: false })
            .pipe(
              map(
                (capabilities): AiCapabilitiesResponse => ({
                  requestId,
                  capabilities,
                }),
              ),
            ),
        onSuccess: ({ requestId, capabilities }) => {
          // A response to an older refresh must not turn a feature back on.
          if (requestId !== this.latestRequestId) {
            return;
          }

          this.signalState.patch({
            searchInterpretation: isOn(capabilities, 'searchInterpretation'),
            codeSuggestions: isOn(capabilities, 'codeSuggestions'),
          });
        },
        onError: () => {
          this.signalState.patch(allFeaturesOff);
        },
      },
      this.envInjector,
    );
  }
}

function isOn(
  capabilities: AiCapabilitiesDto | null | undefined,
  flag: keyof AiCapabilitiesDto,
): boolean {
  const value: unknown = capabilities?.[flag];
  return value === true;
}
