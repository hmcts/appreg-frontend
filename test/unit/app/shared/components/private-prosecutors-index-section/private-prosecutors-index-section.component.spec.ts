import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { PrivateProsecutorsIndexSectionComponent } from '@components/private-prosecutors-index-section/private-prosecutors-index-section.component';

describe('PrivateProsecutorsIndexSectionComponent', () => {
  let component: PrivateProsecutorsIndexSectionComponent;
  let fixture: ComponentFixture<PrivateProsecutorsIndexSectionComponent>;
  let group: FormGroup;
  let suggestions: SuggestionsFacade;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, PrivateProsecutorsIndexSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivateProsecutorsIndexSectionComponent);
    component = fixture.componentInstance;

    group = new FormGroup({
      dateFrom: new FormControl(null),
      dateTo: new FormControl(null),
      applicantSurnameOrOrg: new FormControl(''),
      applicantFirst: new FormControl(''),
      standardApplicantName: new FormControl(''),
      respondentFirst: new FormControl(''),
      respondentSurname: new FormControl(''),
      respondentOrg: new FormControl(''),
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

  it('renders the "Private prosecutors index" heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1.govuk-heading-l');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Private prosecutors index');
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

  it('renders all expected app-text-input components', () => {
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs).toHaveLength(7);
  });

  it('wires specific formControlName bindings (e.g. court)', () => {
    const courtInput = fixture.debugElement.query(
      By.css('app-suggestions[formControlName="court"]'),
    );
    expect(courtInput).toBeTruthy();
  });
});
