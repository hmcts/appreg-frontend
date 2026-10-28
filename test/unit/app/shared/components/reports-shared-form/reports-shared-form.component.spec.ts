import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';
import { REPORTS_FORM_ERROR_MESSAGES } from '@constants/reports/report-err';
import { dateToOnOrAfterDateFromValidator } from '@validators/date-range.validator';

const createReportsGroup = (): FormGroup =>
  new FormGroup({
    dateFrom: new FormControl(null),
    dateTo: new FormControl(null),
    court: new FormControl(''),
    otherLocation: new FormControl(''),
    cja: new FormControl(''),
  });

const createSuggestionsFacade = (): SuggestionsFacade => ({
  courthouseSearch: jest.fn(() => ''),
  setCourthouseSearch: jest.fn(),
  filteredCourthouses: jest.fn(() => []),
  onCourthouseInputChange: jest.fn(),
  selectCourthouse: jest.fn(),
  cjaSearch: jest.fn(() => ''),
  setCjaSearch: jest.fn(),
  filteredCja: jest.fn(() => []),
  onCjaInputChange: jest.fn(),
  selectCja: jest.fn(),
});

@Component({
  standalone: true,
  imports: [ReportsSharedFormComponent],
  template: `
    <app-reports-shared-form
      [group]="group"
      [suggestions]="suggestions"
      [errorMap]="errorMap"
    >
      <div id="projected-before-court" reportsAfterDateBeforeCourt>
        Projected field
      </div>
    </app-reports-shared-form>
  `,
})
class ReportsSharedFormHostComponent {
  group = createReportsGroup();
  suggestions = createSuggestionsFacade();
  errorMap = REPORTS_FORM_ERROR_MESSAGES;
}

describe('ReportsSharedFormComponent', () => {
  let component: ReportsSharedFormComponent;
  let fixture: ComponentFixture<ReportsSharedFormComponent>;
  let group: FormGroup;
  let suggestions: SuggestionsFacade;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsSharedFormComponent, ReportsSharedFormHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsSharedFormComponent);
    component = fixture.componentInstance;
    group = createReportsGroup();
    suggestions = createSuggestionsFacade();

    fixture.componentRef.setInput('group', group);
    fixture.componentRef.setInput('suggestions', suggestions);
    fixture.componentRef.setInput('errorMap', REPORTS_FORM_ERROR_MESSAGES);
    fixture.detectChanges();
  });

  it.each(['dateFrom', 'dateTo'])(
    'clears the inline %s year error after correction despite a stale summary',
    (field) => {
      const dateInput = fixture.debugElement.query(
        By.css(`app-date-input[formControlName="${field}"]`),
      ).componentInstance as DateInputComponent;
      dateInput.dateForm.setValue({ day: '01', month: '01', year: '1899' });
      fixture.componentRef.setInput('submitted', true);
      fixture.componentRef.setInput('externalErrors', [
        { id: field, text: 'Date must be between 1900 and 3000' },
      ]);
      fixture.detectChanges();

      const fieldElement = fixture.debugElement.query(
        By.css(`app-date-input[formControlName="${field}"]`),
      ).nativeElement as HTMLElement;
      expect(
        fieldElement.querySelector('.govuk-error-message')?.textContent,
      ).toContain('Date must be between 1900 and 3000');

      dateInput.dateForm.controls.year.setValue('2001');
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      expect(group.get(field)?.valid).toBe(true);
      expect(fieldElement.querySelector('.govuk-error-message')).toBeNull();
      expect(fieldElement.querySelector('.govuk-form-group--error')).toBeNull();
      expect(fieldElement.querySelector('.govuk-input--error')).toBeNull();
    },
  );

  it.each([
    ['dateFrom', '2001-01-01'],
    ['dateTo', '2001-01-15'],
  ])('clears the date-range error when %s is corrected', (field, value) => {
    group.addValidators(dateToOnOrAfterDateFromValidator());
    group.patchValue({ dateFrom: '2001-01-10', dateTo: '2001-01-05' });
    const message = 'Date to must be on or after Date from';
    fixture.componentRef.setInput('externalErrors', [
      { id: 'dateTo', text: message },
    ]);
    fixture.detectChanges();

    const dateToElement = fixture.debugElement.query(
      By.css('app-date-input[formControlName="dateTo"]'),
    ).nativeElement as HTMLElement;
    expect(dateToElement.querySelector('.govuk-error-message')).toBeNull();

    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();
    expect(group.get('dateTo')?.hasError('dateRange')).toBe(true);
    expect(
      dateToElement.querySelector('.govuk-error-message')?.textContent,
    ).toContain(message);
    expect(dateToElement.querySelectorAll('.govuk-input--error')).toHaveLength(
      3,
    );

    group.get(field)?.setValue(value);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(group.get('dateTo')?.hasError('dateRange')).toBe(false);
    expect(dateToElement.querySelector('.govuk-error-message')).toBeNull();
    expect(dateToElement.querySelector('.govuk-input--error')).toBeNull();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders court and CJA suggestion fields', () => {
    const suggestionFields = fixture.debugElement.queryAll(
      By.css('app-suggestions'),
    );

    expect(suggestionFields).toHaveLength(2);
    expect(suggestionFields[0].attributes['formControlName']).toBe('court');
    expect(suggestionFields[1].attributes['formControlName']).toBe('cja');
  });

  it('projects marked content after the date fields and before court', () => {
    const hostFixture = TestBed.createComponent(ReportsSharedFormHostComponent);
    hostFixture.detectChanges();

    const dateInputs = hostFixture.nativeElement.querySelectorAll(
      'app-date-input',
    ) as NodeListOf<HTMLElement>;
    const projected = hostFixture.nativeElement.querySelector(
      '#projected-before-court',
    ) as HTMLElement;
    const court = hostFixture.nativeElement.querySelector(
      'app-suggestions[formControlName="court"]',
    ) as HTMLElement;

    expect(dateInputs).toHaveLength(2);
    expect(projected).toBeTruthy();
    expect(court).toBeTruthy();
    expect(
      Boolean(
        dateInputs[1].compareDocumentPosition(projected) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
    expect(
      Boolean(
        projected.compareDocumentPosition(court) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
  });

  it('uses the reports otherLocation control for the other location field', () => {
    const otherLocation = fixture.debugElement.query(
      By.css('app-text-input[formControlName="otherLocation"]'),
    );

    expect(otherLocation).toBeTruthy();
  });

  it('wraps CJA and other location in an advanced filters details block when enabled', () => {
    fixture.componentRef.setInput('advancedFilters', true);
    fixture.detectChanges();

    const details = fixture.debugElement.query(By.css('details.govuk-details'));
    const court = fixture.debugElement.query(
      By.css('app-suggestions[formControlName="court"]'),
    );
    const cja = fixture.debugElement.query(
      By.css('app-suggestions[formControlName="cja"]'),
    );
    const otherLocation = fixture.debugElement.query(
      By.css('app-text-input[formControlName="otherLocation"]'),
    );

    expect(details).toBeTruthy();
    expect(details.nativeElement.textContent).toContain('Advanced filters');
    expect(details.nativeElement.contains(cja.nativeElement)).toBe(true);
    expect(details.nativeElement.contains(otherLocation.nativeElement)).toBe(
      true,
    );
    expect(details.nativeElement.contains(court.nativeElement)).toBe(false);
  });

  it('wraps court in advanced filters when configured', () => {
    fixture.componentRef.setInput('advancedFilters', true);
    fixture.componentRef.setInput('courtInAdvancedFilters', true);
    fixture.detectChanges();

    const details = fixture.debugElement.query(By.css('details.govuk-details'));
    const court = fixture.debugElement.query(
      By.css('app-suggestions[formControlName="court"]'),
    );
    const cja = fixture.debugElement.query(
      By.css('app-suggestions[formControlName="cja"]'),
    );

    expect(details.nativeElement.contains(court.nativeElement)).toBe(true);
    expect(
      Boolean(
        court.nativeElement.compareDocumentPosition(cja.nativeElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
  });

  it('opens advanced filters when an advanced field has an error', () => {
    fixture.componentRef.setInput('advancedFilters', true);
    fixture.componentRef.setInput('submitted', true);
    fixture.componentRef.setInput('externalErrors', [
      { id: 'cja', text: 'Criminal justice area not found' },
    ]);
    fixture.detectChanges();

    const details = fixture.nativeElement.querySelector(
      'details.govuk-details',
    ) as HTMLDetailsElement;

    expect(details.open).toBe(true);
  });

  it('opens advanced filters when court is advanced and has an error', () => {
    fixture.componentRef.setInput('advancedFilters', true);
    fixture.componentRef.setInput('courtInAdvancedFilters', true);
    fixture.componentRef.setInput('submitted', true);
    fixture.componentRef.setInput('externalErrors', [
      { id: 'court', text: 'Court location not found' },
    ]);
    fixture.detectChanges();

    const details = fixture.nativeElement.querySelector(
      'details.govuk-details',
    ) as HTMLDetailsElement;

    expect(details.open).toBe(true);
  });

  it('shows mapped control errors and external errors after submit', () => {
    fixture.componentRef.setInput('submitted', true);
    group.controls.court.setErrors({ courtNotFound: true });
    group.controls.cja.setErrors({ cjaNotFound: true });
    fixture.componentRef.setInput('externalErrors', [
      {
        id: 'otherLocation',
        text: 'Other location has an error',
      },
    ]);
    fixture.detectChanges();

    expect(component.showError('court')).toBe(true);
    expect(component.errorText('court')).toBe('Court location not found');
    expect(component.showError('cja')).toBe(true);
    expect(component.errorText('cja')).toBe('Criminal justice area not found');
    expect(component.errorText('otherLocation')).toBe(
      'Other location has an error',
    );

    expect(
      fixture.nativeElement
        .querySelector('input#court')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
    expect(
      fixture.nativeElement
        .querySelector('input#cja')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
    expect(
      fixture.nativeElement
        .querySelector('#other-location')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });
});
