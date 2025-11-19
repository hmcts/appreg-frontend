import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ActivityAuditSectionComponent } from '../../../../../../src/app/shared/components/activity-audit-section/activity-audit-section.component';

describe('ActivityAuditSectionComponent (with template)', () => {
  let component: ActivityAuditSectionComponent;
  let fixture: ComponentFixture<ActivityAuditSectionComponent>;
  let group: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ActivityAuditSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityAuditSectionComponent);
    component = fixture.componentInstance;

    group = new FormGroup({
      dateFrom: new FormControl(null),
      dateTo: new FormControl(null),
      username: new FormControl(''),
      activity: new FormControl(''),
    });

    component.group = group;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the provided FormGroup via the "group" input', () => {
    expect(component.group).toBe(group);
  });

  it('renders the "Activity audit" heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1.govuk-heading-l');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Activity audit');
  });

  it('binds the provided FormGroup to the div.govuk-grid-row via [formGroup]', () => {
    const gridRowDebug = fixture.debugElement.query(
      By.css('div.govuk-grid-row'),
    );
    expect(gridRowDebug).toBeTruthy();

    const formGroupDirective = gridRowDebug.injector.get(FormGroupDirective);
    expect(formGroupDirective.form).toBe(group);
  });

  it('renders two app-date-input components and two app-text-input components', () => {
    const dateInputs = fixture.debugElement.queryAll(By.css('app-date-input'));
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));

    expect(dateInputs).toHaveLength(2);
    expect(textInputs).toHaveLength(2);
  });
});
