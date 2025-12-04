import { Directive, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import {
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '../../../generated/openapi';

import {
  attachLocationDisabler,
  onCjaInputChange as filterCja,
  onCourthouseInputChange as filterCourts,
  selectCja,
  selectCourthouse,
} from './location-suggestion-helpers';

export interface PlaceRefFacade {
  courtLocations$: Observable<CourtLocationGetSummaryDto[]>;
  cja$: Observable<CriminalJusticeAreaGetDto[]>;
}

@Directive()
export abstract class PlaceFieldsBase implements OnDestroy {
  protected form!: FormGroup;
  protected ref!: PlaceRefFacade;

  courthouseSearch = '';
  cjaSearch = '';

  courtLocations: CourtLocationGetSummaryDto[] = [];
  cja: CriminalJusticeAreaGetDto[] = [];

  filteredCourthouses: CourtLocationGetSummaryDto[] = [];
  filteredCja: CriminalJusticeAreaGetDto[] = [];

  private readonly subs = new Subscription();
  protected locationDisabler?: Subscription;

  protected initPlaceFields(form: FormGroup, ref: PlaceRefFacade): void {
    this.form = form;
    this.ref = ref;

    this.courthouseSearch = String(this.form.controls['court'].value ?? '');
    this.cjaSearch = String(this.form.controls['cja'].value ?? '');

    this.subs.add(
      this.ref.courtLocations$.subscribe(
        (items) => (this.courtLocations = items),
      ),
    );
    this.subs.add(this.ref.cja$.subscribe((items) => (this.cja = items)));

    this.locationDisabler = attachLocationDisabler({
      court: this.form.controls['court'],
      location: this.form.controls['location'],
      cja: this.form.controls['cja'],
    });
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

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.locationDisabler?.unsubscribe();
  }
}
