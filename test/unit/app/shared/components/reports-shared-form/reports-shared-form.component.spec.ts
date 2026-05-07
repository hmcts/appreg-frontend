import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';

describe('ReportsSharedFormComponent', () => {
  let component: ReportsSharedFormComponent;
  let fixture: ComponentFixture<ReportsSharedFormComponent>;
  let group: FormGroup;
  let suggestions: SuggestionsFacade;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsSharedFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsSharedFormComponent);
    component = fixture.componentInstance;
    group = new FormGroup({
      dateFrom: new FormControl(null),
      dateTo: new FormControl(null),
      court: new FormControl(''),
      otherLocation: new FormControl(''),
      cja: new FormControl(''),
    });
    suggestions = {
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
    };

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

  it('uses the reports otherLocation control for the other location field', () => {
    const otherLocation = fixture.debugElement.query(
      By.css('app-text-input[formControlName="otherLocation"]'),
    );

    expect(otherLocation).toBeTruthy();
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
