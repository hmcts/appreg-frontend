import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { Reports } from '@components/reports/reports.component';
import { SearchWarrantsSectionComponent } from '@components/search-warrants-section/search-warrants-section.component';
import {
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';

const refFacadeStub: Pick<ReferenceDataFacade, 'courtLocations$' | 'cja$'> = {
  courtLocations$: of<CourtLocationGetSummaryDto[]>([
    { name: 'Alpha Court', locationCode: 'A1' } as CourtLocationGetSummaryDto,
  ]),
  cja$: of<CriminalJusticeAreaGetDto[]>([
    { code: 'C1', description: 'Area One' } as CriminalJusticeAreaGetDto,
  ]),
};

describe('ReportsComponent', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [{ provide: ReferenceDataFacade, useValue: refFacadeStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters search warrant court suggestions via the facade', () => {
    component.suggestionsFacade.setCourthouseSearch('alpha');
    component.suggestionsFacade.onCourthouseInputChange();

    expect(component.suggestionsFacade.filteredCourthouses()).toEqual([
      expect.objectContaining({
        label: 'A1 - Alpha Court',
        locationCode: 'A1',
        value: 'A1',
      }),
    ]);
  });

  it('passes the search warrants group and suggestions facade to the section', () => {
    component.form.controls.report.setValue('search-warrants');
    fixture.detectChanges();

    const section = fixture.debugElement.query(
      By.directive(SearchWarrantsSectionComponent),
    ).componentInstance as SearchWarrantsSectionComponent;

    expect(section.group()).toBe(component.searchWarrantsGroup);
    expect(section.suggestions()).toBe(component.suggestionsFacade);
  });
});
