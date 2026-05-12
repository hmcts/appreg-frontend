import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { WorkloadSectionComponent } from '@components/workload-section/workload-section.component';

describe('WorkloadSectionComponent', () => {
  let component: WorkloadSectionComponent;
  let fixture: ComponentFixture<WorkloadSectionComponent>;
  let group: FormGroup;
  let suggestions: SuggestionsFacade;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, WorkloadSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkloadSectionComponent);
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

  it('renders the "Workload" heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1.govuk-heading-l');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Workload');
  });

  it('binds the provided FormGroup in the shared form', () => {
    const formGroup = fixture.debugElement
      .query(By.directive(FormGroupDirective))
      .injector.get(FormGroupDirective);

    expect(formGroup.form).toBe(group);
  });

  it('renders two app-date-input components', () => {
    const dateInputs = fixture.debugElement.queryAll(By.css('app-date-input'));
    expect(dateInputs).toHaveLength(2);
  });

  it('renders one app-text-input component', () => {
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs).toHaveLength(1);
  });

  it('has a suggestion input bound to the "court" control', () => {
    const courtInput = fixture.debugElement.query(
      By.css('app-suggestions[formControlName="court"]'),
    );
    expect(courtInput).toBeTruthy();
  });

  it('has a suggestion input bound to the "cja" control', () => {
    const cjaInput = fixture.debugElement.query(
      By.css('app-suggestions[formControlName="cja"]'),
    );
    expect(cjaInput).toBeTruthy();
  });
});
