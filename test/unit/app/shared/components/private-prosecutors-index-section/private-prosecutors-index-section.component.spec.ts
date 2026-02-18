import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { PrivateProsecutorsIndexSectionComponent } from '@components/private-prosecutors-index-section/private-prosecutors-index-section.component';

describe('PrivateProsecutorsIndexSectionComponent', () => {
  let component: PrivateProsecutorsIndexSectionComponent;
  let fixture: ComponentFixture<PrivateProsecutorsIndexSectionComponent>;
  let group: FormGroup;

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

    fixture.componentRef.setInput('group', group);

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

  it('binds the provided FormGroup to the grid row via [formGroup]', () => {
    const gridRow = fixture.debugElement.query(By.css('div.govuk-grid-row'));
    expect(gridRow).toBeTruthy();

    const formGroupDirective = gridRow.injector.get(FormGroupDirective);
    expect(formGroupDirective.form).toBe(group);
  });

  it('renders two app-date-input components', () => {
    const dateInputs = fixture.debugElement.queryAll(By.css('app-date-input'));
    expect(dateInputs).toHaveLength(2);
  });

  it('renders all expected app-text-input components', () => {
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs).toHaveLength(9);
  });

  it('wires specific formControlName bindings (e.g. court)', () => {
    const courtInput = fixture.debugElement.query(
      By.css('app-text-input[formControlName="court"]'),
    );
    expect(courtInput).toBeTruthy();
  });
});
