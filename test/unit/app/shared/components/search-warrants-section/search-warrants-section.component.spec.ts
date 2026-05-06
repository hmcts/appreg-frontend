import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';
import { SearchWarrantsSectionComponent } from '@components/search-warrants-section/search-warrants-section.component';

describe('SearchWarrantsSectionComponent', () => {
  let component: SearchWarrantsSectionComponent;
  let fixture: ComponentFixture<SearchWarrantsSectionComponent>;
  let group: FormGroup;
  let suggestions: SuggestionsFacade;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, SearchWarrantsSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchWarrantsSectionComponent);
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

  it('should expose the provided FormGroup via the "group" input', () => {
    expect(component.group()).toBe(group);
  });

  it('renders the "Search warrants" heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1.govuk-heading-l');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Search warrants');
  });

  it('passes inputs through to the shared reports form', () => {
    const sharedForm = fixture.debugElement.query(
      By.directive(ReportsSharedFormComponent),
    ).componentInstance as ReportsSharedFormComponent;

    expect(sharedForm.group()).toBe(group);
    expect(sharedForm.suggestions()).toBe(suggestions);
  });

  it('binds the provided FormGroup in the shared form', () => {
    const formGroup = fixture.debugElement
      .query(By.directive(FormGroupDirective))
      .injector.get(FormGroupDirective);

    expect(formGroup.form).toBe(group);
  });
});
