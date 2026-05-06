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
});
