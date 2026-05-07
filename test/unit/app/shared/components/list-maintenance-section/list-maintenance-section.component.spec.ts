import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { ListMaintenanceSectionComponent } from '@components/list-maintenance-section/list-maintenance-section.component';

describe('ListMaintenanceSectionComponent', () => {
  let component: ListMaintenanceSectionComponent;
  let fixture: ComponentFixture<ListMaintenanceSectionComponent>;
  let group: FormGroup;
  let suggestions: SuggestionsFacade;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ListMaintenanceSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListMaintenanceSectionComponent);
    component = fixture.componentInstance;

    group = new FormGroup({
      dateFrom: new FormControl(null),
      dateTo: new FormControl(null),
      description: new FormControl(''),
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

  it('renders the "List maintenance" heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1.govuk-heading-l');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('List maintenance');
  });

  it('binds the provided FormGroup to the shared and section fields', () => {
    const formGroups = fixture.debugElement
      .queryAll(By.directive(FormGroupDirective))
      .map((el) => el.injector.get(FormGroupDirective).form)
      .filter((form) => form === group);

    expect(formGroups).toHaveLength(2);
  });

  it('renders two app-date-input components', () => {
    const dateInputs = fixture.debugElement.queryAll(By.css('app-date-input'));
    expect(dateInputs).toHaveLength(2);
  });

  it('renders two app-text-input components', () => {
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs).toHaveLength(2);
  });

  it('has a text input bound to the "description" control', () => {
    const descInput = fixture.debugElement.query(
      By.css('app-text-input[formControlName="description"]'),
    );
    expect(descInput).toBeTruthy();
  });

  it('has a suggestion input bound to the "court" control', () => {
    const courtInput = fixture.debugElement.query(
      By.css('app-suggestions[formControlName="court"]'),
    );
    expect(courtInput).toBeTruthy();
  });
});
