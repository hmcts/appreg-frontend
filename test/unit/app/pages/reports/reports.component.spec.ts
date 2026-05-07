import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DateInputComponent } from '@components/date-input/date-input.component';
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
      providers: [
        provideRouter([]),
        { provide: ReferenceDataFacade, useValue: refFacadeStub },
      ],
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
    expect(section.getError()).toEqual(expect.any(Function));
  });

  it('calls onDownload when the download button is clicked', () => {
    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    const onDownload = jest.spyOn(component, 'onDownload');
    const button = fixture.debugElement.query(By.css('button.govuk-button'));

    button.triggerEventHandler('click');

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('shows date errors for the selected report on download', () => {
    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      { id: 'dateFrom', href: '#date-from', text: 'Enter day, month and year' },
      { id: 'dateTo', href: '#date-to', text: 'Enter day, month and year' },
    ]);
    expect(
      fixture.nativeElement.querySelector('app-error-summary'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement
        .querySelector('#date-from-day')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });

  it('uses date input validation text for partially entered dates', () => {
    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    const dateFrom = fixture.debugElement.queryAll(
      By.directive(DateInputComponent),
    )[0].componentInstance as DateInputComponent;

    dateFrom.dateForm.setValue({ day: '1', month: '', year: '2026' });
    fixture.detectChanges();

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([
      { id: 'dateFrom', href: '#date-from', text: 'Enter month' },
      { id: 'dateTo', href: '#date-to', text: 'Enter day, month and year' },
    ]);
  });

  it('clears previous errors when the selected report is valid', () => {
    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    component.onDownload();
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([]);
  });

  it('shows a search warrants court suggestion error on download', () => {
    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.suggestionsFacade.setCourthouseSearch('Missing Court');
    component.suggestionsFacade.onCourthouseInputChange();

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([
      { id: 'court', href: '#court', text: 'Court location not found' },
    ]);
  });

  it('does not require search warrants court, other location, or CJA', () => {
    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([]);
  });

  it('highlights the search warrants court suggestion when it has an error', () => {
    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.suggestionsFacade.setCourthouseSearch('Missing Court');
    component.suggestionsFacade.onCourthouseInputChange();

    component.onDownload();
    fixture.detectChanges();

    expect(component.fieldError('court')?.text).toBe(
      'Court location not found',
    );
    expect(
      fixture.nativeElement
        .querySelector('input#court')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });

  it('highlights the search warrants CJA suggestion when it has an error', () => {
    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      otherLocation: 'Somewhere',
    });
    fixture.detectChanges();

    component.suggestionsFacade.setCjaSearch('Missing CJA');
    component.suggestionsFacade.onCjaInputChange();

    component.onDownload();
    fixture.detectChanges();

    expect(component.fieldError('cja')?.text).toBe(
      'Criminal justice area not found',
    );
    expect(
      fixture.nativeElement
        .querySelector('input#cja')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });
});
