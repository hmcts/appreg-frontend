import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';

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
    <app-reports-shared-form [group]="group" [suggestions]="suggestions">
      <div id="projected-before-court" reportsAfterDateBeforeCourt>
        Projected field
      </div>
    </app-reports-shared-form>
  `,
})
class ReportsSharedFormHostComponent {
  group = createReportsGroup();
  suggestions = createSuggestionsFacade();
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
    fixture.detectChanges();
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

  it('opens advanced filters when an advanced field has an error', () => {
    fixture.componentRef.setInput('advancedFilters', true);
    fixture.componentRef.setInput('submitted', true);
    fixture.componentRef.setInput('getError', (id: string) =>
      id === 'cja'
        ? { id, text: 'Criminal justice area not found' }
        : undefined,
    );
    fixture.detectChanges();

    const details = fixture.nativeElement.querySelector(
      'details.govuk-details',
    ) as HTMLDetailsElement;

    expect(details.open).toBe(true);
  });

  it('shows field errors from the supplied getError callback after submit', () => {
    fixture.componentRef.setInput('submitted', true);
    fixture.componentRef.setInput('getError', (id: string) => {
      const errors = {
        court: 'Court location not found',
        cja: 'Criminal justice area not found',
        otherLocation: 'Other location has an error',
      } as const;

      return id in errors
        ? { id, text: errors[id as keyof typeof errors] }
        : undefined;
    });
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
