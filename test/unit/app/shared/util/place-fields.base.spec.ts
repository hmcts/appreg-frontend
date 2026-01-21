import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

import {
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '@openapi';
import { PlaceFieldsBase, PlaceFieldsState } from '@util/place-fields.base';

const COURTS: CourtLocationGetSummaryDto[] = [
  { name: 'Alpha Court', locationCode: 'A1' },
  { name: 'Beta Court', locationCode: 'B2' },
];

const CJAS: CriminalJusticeAreaGetDto[] = [
  { code: 'C1', description: 'Area One' },
  { code: 'C2', description: 'Area Two' },
];

type RefFacadeStub = {
  courtLocations$: BehaviorSubject<CourtLocationGetSummaryDto[]>;
  cja$: BehaviorSubject<CriminalJusticeAreaGetDto[]>;
};

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: '',
})
class PlaceFieldsHostComponent extends PlaceFieldsBase {
  override form = new FormGroup({
    court: new FormControl<string>('', { nonNullable: true }),
    location: new FormControl<string>('', { nonNullable: true }),
    cja: new FormControl<string>('', { nonNullable: true }),
  });

  private readonly refStub: RefFacadeStub = {
    courtLocations$: new BehaviorSubject<CourtLocationGetSummaryDto[]>([]),
    cja$: new BehaviorSubject<CriminalJusticeAreaGetDto[]>([]),
  };

  init(): void {
    this.initPlaceFields(this.form, {
      courtLocations$: this.refStub.courtLocations$.asObservable(),
      cja$: this.refStub.cja$.asObservable(),
    });
  }

  emitCourts(items: CourtLocationGetSummaryDto[]): void {
    this.refStub.courtLocations$.next(items);
  }

  emitCja(items: CriminalJusticeAreaGetDto[]): void {
    this.refStub.cja$.next(items);
  }

  setPlaceState(patch: Partial<PlaceFieldsState>): void {
    this.patch(patch);
  }

  getPlaceState(): PlaceFieldsState {
    return this.state();
  }
}

describe('PlaceFieldsBase', () => {
  let fixture: ComponentFixture<PlaceFieldsHostComponent>;
  let component: PlaceFieldsHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceFieldsHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaceFieldsHostComponent);
    component = fixture.componentInstance;
  });

  it('initPlaceFields loads reference data and back-fills search strings from existing form values', () => {
    // pre-seed form values before reference data arrives
    component.form.controls.court.setValue('B2');
    component.form.controls.cja.setValue('C2');

    component.init();

    component.emitCourts(COURTS);
    component.emitCja(CJAS);

    const st = component.getPlaceState();
    expect(st.courtLocations).toEqual(COURTS);
    expect(st.cja).toEqual(CJAS);

    expect(st.courthouseSearch).toBe('B2 - Beta Court');
    expect(st.cjaSearch).toBe('C2 - Area Two');
  });

  it('disables and enables related fields based on values', () => {
    component.init();

    // none -> all enabled
    component.form.controls.court.setValue('');
    component.form.controls.location.setValue('');
    component.form.controls.cja.setValue('');
    expect(component.form.controls.court.disabled).toBe(false);
    expect(component.form.controls.location.disabled).toBe(false);
    expect(component.form.controls.cja.disabled).toBe(false);

    // court set -> others disabled
    component.form.controls.court.setValue('A1');
    expect(component.form.controls.court.disabled).toBe(false);
    expect(component.form.controls.location.disabled).toBe(true);
    expect(component.form.controls.cja.disabled).toBe(true);

    // location set -> court disabled
    component.form.controls.court.setValue('');
    component.form.controls.location.setValue('Somewhere');
    expect(component.form.controls.court.disabled).toBe(true);
    expect(component.form.controls.location.disabled).toBe(false);
    expect(component.form.controls.cja.disabled).toBe(false);

    // cja set -> court disabled
    component.form.controls.location.setValue('');
    component.form.controls.cja.setValue('C1');
    expect(component.form.controls.court.disabled).toBe(true);
    expect(component.form.controls.location.disabled).toBe(false);
    expect(component.form.controls.cja.disabled).toBe(false);
  });

  it('filters courthouses by name or code via onCourthouseInputChange', () => {
    component.init();

    component.setPlaceState({ courtLocations: [...COURTS] });

    component.setCourthouseSearch('a1');
    component.onCourthouseInputChange();
    expect(
      component.getPlaceState().filteredCourthouses.map((c) => c.locationCode),
    ).toEqual(['A1']);

    component.setCourthouseSearch('beta');
    component.onCourthouseInputChange();
    expect(
      component.getPlaceState().filteredCourthouses.map((c) => c.name),
    ).toEqual(['Beta Court']);

    component.setCourthouseSearch('');
    component.onCourthouseInputChange();
    expect(component.getPlaceState().filteredCourthouses).toHaveLength(0);
  });

  it('selectCourthouse sets form value, updates search, and clears suggestions', () => {
    component.init();

    // seed suggestions so we can verify they are cleared
    component.setPlaceState({
      filteredCourthouses: [...COURTS],
    });

    const pick: CourtLocationGetSummaryDto = { name: 'X', locationCode: 'X1' };
    component.selectCourthouse(pick);

    const st = component.getPlaceState();
    expect(st.courthouseSearch).toBe('X1 - X');
    expect(component.form.controls.court.value).toBe('X1');
    expect(st.filteredCourthouses).toHaveLength(0);
  });

  it('filters and selects CJA via onCjaInputChange/selectCja', () => {
    component.init();

    component.setPlaceState({ cja: [...CJAS] });

    component.setCjaSearch('area two');
    component.onCjaInputChange();
    expect(component.getPlaceState().filteredCja.map((c) => c.code)).toEqual([
      'C2',
    ]);

    const pick: CriminalJusticeAreaGetDto = {
      code: 'C9',
      description: 'Ninth',
    };
    component.selectCja(pick);

    const st = component.getPlaceState();
    expect(st.cjaSearch).toBe('C9 - Ninth');
    expect(component.form.controls.cja.value).toBe('C9');
    expect(st.filteredCja).toHaveLength(0);
  });
});
