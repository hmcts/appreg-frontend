/**
 * Shared base for place/location form fields.
 * Uses signal-backed state and auto-cleanup via DestroyRef/takeUntilDestroyed.
 *
 * Uses reference-data.facade.ts to GET ALL CJA and Court locations
 *
 * This file is used in applications-list.ts, applications-list-create.ts, applications-list-detail.ts,
 * applications.ts
 */

import { DestroyRef, Directive, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormGroup } from '@angular/forms';
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
  private placeForm!: FormGroup;
  protected ref!: PlaceRefFacade;
  protected locationDisabler?: { unsubscribe: () => void };

  // Signals
  protected readonly signalState = createSignalState<PlaceFieldsState>(
    initialPlaceFieldsState,
  );
  protected readonly state = this.signalState.state;

  readonly placeState = (): PlaceFieldsState => this.state();

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
    this.placeForm = form;
    if (!this.form) {
      this.form = form;
    }
    this.ref = ref;

    this.patch({ courthouseSearch: '', cjaSearch: '' });

    this.ref.courtLocations$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        const code = String(
          this.placeForm.controls['court'].value ?? '',
        ).trim();
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
        const code = String(this.placeForm.controls['cja'].value ?? '').trim();
        const match = code ? items.find((x) => x.code === code) : undefined;

        this.patch({
          cja: items,
          ...(match
            ? { cjaSearch: `${match.code} - ${match.description}` }
            : {}),
        });
      });

    this.locationDisabler = attachLocationDisabler({
      court: this.placeForm.controls['court'],
      location: this.locationControl,
      cja: this.placeForm.controls['cja'],
    });

    if (this.locationDisabler) {
      this.destroyRef.onDestroy(() => this.locationDisabler?.unsubscribe());
    }
  }

  onCourthouseInputChange(): void {
    const { courthouseSearch, courtLocations } = this.state();

    this.patch({
      filteredCourthouses: filterCourts(
        this.placeForm,
        courthouseSearch,
        courtLocations,
      ),
    });
  }

  onCjaInputChange(): void {
    const { cjaSearch, cja } = this.state();
    this.patch({ filteredCja: filterCja(this.placeForm, cjaSearch, cja) });
  }

  selectCourthouse(c: unknown): void {
    const next = selectCourthouse(
      this.placeForm,
      c as { locationCode?: string } | CourtLocationGetSummaryDto,
    );
    this.patch({
      courthouseSearch: next.courthouseSearch,
      filteredCourthouses: next.filteredCourthouses,
    });
  }

  selectCja(c: unknown): void {
    const next = selectCja(
      this.placeForm,
      c as { code?: string } | CriminalJusticeAreaGetDto,
    );
    this.patch({ cjaSearch: next.cjaSearch, filteredCja: next.filteredCja });
  }

  private get locationControl(): AbstractControl {
    return (
      this.placeForm.controls['location'] ??
      this.placeForm.controls['otherLocation']
    );
  }
}
