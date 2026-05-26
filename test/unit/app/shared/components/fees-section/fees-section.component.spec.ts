import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { FeesSectionComponent } from '@components/fees-section/fees-section.component';
import { JobStatus2, JobType, ReportsApi } from '@openapi';

describe('FeesSectionComponent', () => {
  let component: FeesSectionComponent;
  let fixture: ComponentFixture<FeesSectionComponent>;
  let group: FormGroup;
  let suggestions: SuggestionsFacade;
  let createFeesReport: jest.Mock;

  beforeEach(async () => {
    createFeesReport = jest.fn(() =>
      of({
        id: 'job-id',
        type: JobType.FEES_REPORT,
        status: JobStatus2.RECEIVED,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FeesSectionComponent],
      providers: [{ provide: ReportsApi, useValue: { createFeesReport } }],
    }).compileComponents();

    fixture = TestBed.createComponent(FeesSectionComponent);
    component = fixture.componentInstance;

    group = new FormGroup({
      dateFrom: new FormControl(null),
      dateTo: new FormControl(null),
      standardApplicantCode: new FormControl(''),
      surnameOrOrg: new FormControl(''),
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

  it('renders the "Fees" heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1.govuk-heading-l');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Fees');
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

  it('renders three app-text-input components', () => {
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs).toHaveLength(3);
  });

  it('has a text input bound to the "standardApplicantCode" control', () => {
    const applicantCodeInput = fixture.debugElement.query(
      By.css('app-text-input[formControlName="standardApplicantCode"]'),
    );
    expect(applicantCodeInput).toBeTruthy();
  });

  it('renders fee-specific fields after dates and before court', () => {
    const details = fixture.nativeElement.querySelector(
      'details.govuk-details',
    ) as HTMLDetailsElement;
    const dateInputs = fixture.nativeElement.querySelectorAll(
      'app-date-input',
    ) as NodeListOf<HTMLElement>;
    const applicantCode = fixture.nativeElement.querySelector(
      'app-text-input[formControlName="standardApplicantCode"]',
    ) as HTMLElement;
    const surnameOrOrg = fixture.nativeElement.querySelector(
      'app-text-input[formControlName="surnameOrOrg"]',
    ) as HTMLElement;
    const court = fixture.nativeElement.querySelector(
      'app-suggestions[formControlName="court"]',
    ) as HTMLElement;

    expect(details).toBeTruthy();
    expect(dateInputs).toHaveLength(2);
    expect(applicantCode).toBeTruthy();
    expect(surnameOrOrg).toBeTruthy();
    expect(court).toBeTruthy();
    expect(details.contains(applicantCode)).toBe(false);
    expect(details.contains(surnameOrOrg)).toBe(false);
    expect(
      Boolean(
        dateInputs[1].compareDocumentPosition(applicantCode) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
    expect(
      Boolean(
        surnameOrOrg.compareDocumentPosition(court) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
  });

  it('has a suggestion input bound to the "cja" control', () => {
    const cjaInput = fixture.debugElement.query(
      By.css('app-suggestions[formControlName="cja"]'),
    );
    expect(cjaInput).toBeTruthy();
  });
});
