import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { DurationSectionComponent } from '@components/duration-section/duration-section.component';

describe('DurationSectionComponent', () => {
  let component: DurationSectionComponent;
  let fixture: ComponentFixture<DurationSectionComponent>;
  let group: FormGroup;
  let suggestions: SuggestionsFacade;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, DurationSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DurationSectionComponent);
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

  it('renders the "Duration" heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1.govuk-heading-l');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Duration');
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

  it('keeps dates and court outside advanced filters', () => {
    const details = fixture.nativeElement.querySelector(
      'details.govuk-details',
    ) as HTMLDetailsElement;
    const dateInputs = fixture.nativeElement.querySelectorAll(
      'app-date-input',
    ) as NodeListOf<HTMLElement>;
    const court = fixture.nativeElement.querySelector(
      'app-suggestions[formControlName="court"]',
    ) as HTMLElement;

    expect(details).toBeTruthy();
    expect(dateInputs).toHaveLength(2);
    expect(court).toBeTruthy();
    expect(details.contains(dateInputs[0])).toBe(false);
    expect(details.contains(dateInputs[1])).toBe(false);
    expect(details.contains(court)).toBe(false);
    expect(details.textContent).toContain('Advanced filters');
  });

  it('renders CJA and other location inside advanced filters', () => {
    const details = fixture.nativeElement.querySelector(
      'details.govuk-details',
    ) as HTMLDetailsElement;
    const cja = fixture.nativeElement.querySelector(
      'app-suggestions[formControlName="cja"]',
    ) as HTMLElement;
    const otherLocation = fixture.nativeElement.querySelector(
      'app-text-input[formControlName="otherLocation"]',
    ) as HTMLElement;

    expect(details).toBeTruthy();
    expect(cja).toBeTruthy();
    expect(otherLocation).toBeTruthy();
    expect(details.contains(cja)).toBe(true);
    expect(details.contains(otherLocation)).toBe(true);
  });
});
