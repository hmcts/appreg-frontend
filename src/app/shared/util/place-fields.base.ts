/**
 * Shared base for place/location form fields.
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

// Signals
interface PlaceFieldsState {
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

  private readonly signalState = createSignalState<PlaceFieldsState>(
    initialPlaceFieldsState,
  );
  private readonly state = this.signalState.state;

  get courthouseSearch(): string {
    return this.state().courthouseSearch;
  }
  set courthouseSearch(v: string) {
    this.signalState.patch({ courthouseSearch: v ?? '' });
  }

  get cjaSearch(): string {
    return this.state().cjaSearch;
  }
  set cjaSearch(v: string) {
    this.signalState.patch({ cjaSearch: v ?? '' });
  }

  get courtLocations(): CourtLocationGetSummaryDto[] {
    return this.state().courtLocations;
  }
  set courtLocations(v: CourtLocationGetSummaryDto[]) {
    this.signalState.patch({ courtLocations: v ?? [] });
  }

  get cja(): CriminalJusticeAreaGetDto[] {
    return this.state().cja;
  }
  set cja(v: CriminalJusticeAreaGetDto[]) {
    this.signalState.patch({ cja: v ?? [] });
  }

  get filteredCourthouses(): CourtLocationGetSummaryDto[] {
    return this.state().filteredCourthouses;
  }
  set filteredCourthouses(v: CourtLocationGetSummaryDto[]) {
    this.signalState.patch({ filteredCourthouses: v ?? [] });
  }

  get filteredCja(): CriminalJusticeAreaGetDto[] {
    return this.state().filteredCja;
  }
  set filteredCja(v: CriminalJusticeAreaGetDto[]) {
    this.signalState.patch({ filteredCja: v ?? [] });
  }

  protected initPlaceFields(form: FormGroup, ref: PlaceRefFacade): void {
    this.form = form;
    this.ref = ref;

    this.courthouseSearch = '';
    this.cjaSearch = '';

    this.ref.courtLocations$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.courtLocations = items;

        const code = String(this.form.controls['court'].value ?? '').trim();
        if (!code) {
          return;
        }

        const match = items.find((x) => x.locationCode === code);
        if (match) {
          this.courthouseSearch = `${match.locationCode} - ${match.name}`;
        }
      });

    this.ref.cja$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.cja = items;

        const code = String(this.form.controls['cja'].value ?? '').trim();
        if (!code) {
          return;
        }

        const match = items.find((x) => x.code === code);
        if (match) {
          this.cjaSearch = `${match.code} - ${match.description}`;
        }
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
    this.filteredCourthouses = filterCourts(
      this.form,
      this.courthouseSearch,
      this.courtLocations,
    );
  }

  onCjaInputChange(): void {
    this.filteredCja = filterCja(this.form, this.cjaSearch, this.cja);
  }

  selectCourthouse(
    c: { locationCode?: string } | CourtLocationGetSummaryDto,
  ): void {
    const { courthouseSearch, filteredCourthouses } = selectCourthouse(
      this.form,
      c,
    );
    this.courthouseSearch = courthouseSearch;
    this.filteredCourthouses = filteredCourthouses;
  }

  selectCja(c: { code?: string } | CriminalJusticeAreaGetDto): void {
    const { cjaSearch, filteredCja } = selectCja(this.form, c);
    this.cjaSearch = cjaSearch;
    this.filteredCja = filteredCja;
  }
}
