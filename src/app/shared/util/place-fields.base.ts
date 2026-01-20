/**
 * Shared base for place/location form fields.
 * Uses signal-backed state and auto-cleanup via DestroyRef/takeUntilDestroyed.
 */

import { DestroyRef, Directive, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

import {
  attachLocationDisabler,
  onCjaInputChange as filterCja,
  onCourthouseInputChange as filterCourts,
  selectCja,
  selectCourthouse,
} from './location-suggestion-helpers';
import { createSignalState } from './signal-state-helpers';

import {
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '@openapi';

interface PlaceRefFacade {
  courtLocations$: Observable<CourtLocationGetSummaryDto[]>;
  cja$: Observable<CriminalJusticeAreaGetDto[]>;
}

export interface PlaceFieldsState {
  courthouseSearch: string;
  cjaSearch: string;
  courtLocations: CourtLocationGetSummaryDto[];
  cja: CriminalJusticeAreaGetDto[];
  filteredCourthouses: CourtLocationGetSummaryDto[];
  filteredCja: CriminalJusticeAreaGetDto[];
}

const initialPlaceFieldsState: PlaceFieldsState = {
  courthouseSearch: '',
  cjaSearch: '',
  courtLocations: [],
  cja: [],
  filteredCourthouses: [],
  filteredCja: [],
};

@Directive()
export abstract class PlaceFieldsBase {
  private readonly destroyRef = inject(DestroyRef);

  protected form!: FormGroup;
  protected ref!: PlaceRefFacade;
  protected locationDisabler?: { unsubscribe: () => void };

  // Signals
  protected readonly signalState = createSignalState<PlaceFieldsState>(
    initialPlaceFieldsState,
  );
  protected readonly state = this.signalState.state;

  protected patch(patch: Partial<PlaceFieldsState>): void {
    this.signalState.patch(patch);
  }

  setCourthouseSearch(value: string): void {
    this.patch({ courthouseSearch: value ?? '' });
  }

  setCjaSearch(value: string): void {
    this.patch({ cjaSearch: value ?? '' });
  }

  protected initPlaceFields(form: FormGroup, ref: PlaceRefFacade): void {
    this.form = form;
    this.ref = ref;

    this.patch({ courthouseSearch: '', cjaSearch: '' });

    this.ref.courtLocations$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        const code = String(this.form.controls['court'].value ?? '').trim();
        const match = code
          ? items.find((x) => x.locationCode === code)
          : undefined;

        this.patch({
          courtLocations: items,
          ...(match
            ? { courthouseSearch: `${match.locationCode} - ${match.name}` }
            : {}),
        });
      });

    this.ref.cja$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        const code = String(this.form.controls['cja'].value ?? '').trim();
        const match = code ? items.find((x) => x.code === code) : undefined;

        this.patch({
          cja: items,
          ...(match
            ? { cjaSearch: `${match.code} - ${match.description}` }
            : {}),
        });
      });

    this.locationDisabler = attachLocationDisabler({
      court: this.form.controls['court'],
      location: this.form.controls['location'],
      cja: this.form.controls['cja'],
    });

    if (this.locationDisabler) {
      this.destroyRef.onDestroy(() => this.locationDisabler?.unsubscribe());
    }
  }

  onCourthouseInputChange(): void {
    const { courthouseSearch, courtLocations } = this.state();

    this.patch({
      filteredCourthouses: filterCourts(
        this.form,
        courthouseSearch,
        courtLocations,
      ),
    });
  }

  onCjaInputChange(): void {
    const { cjaSearch, cja } = this.state();
    this.patch({ filteredCja: filterCja(this.form, cjaSearch, cja) });
  }

  selectCourthouse(c: unknown): void {
    const next = selectCourthouse(
      this.form,
      c as { locationCode?: string } | CourtLocationGetSummaryDto,
    );
    this.patch({
      courthouseSearch: next.courthouseSearch,
      filteredCourthouses: next.filteredCourthouses,
    });
  }

  selectCja(c: unknown): void {
    const next = selectCja(
      this.form,
      c as { code?: string } | CriminalJusticeAreaGetDto,
    );
    this.patch({ cjaSearch: next.cjaSearch, filteredCja: next.filteredCja });
  }
}
