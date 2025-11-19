import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ListMaintenanceSectionComponent } from '../../../../../../src/app/shared/components/list-maintenance-section/list-maintenance-section.component';

describe('ListMaintenanceSectionComponent', () => {
  let component: ListMaintenanceSectionComponent;
  let fixture: ComponentFixture<ListMaintenanceSectionComponent>;
  let group: FormGroup;

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

    component.group = group;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the provided FormGroup via the "group" input', () => {
    expect(component.group).toBe(group);
  });

  it('renders the "List maintenance" heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1.govuk-heading-l');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('List maintenance');
  });

  it('binds the provided FormGroup to the grid rows via [formGroup]', () => {
    const gridRows = fixture.debugElement.queryAll(
      By.css('div.govuk-grid-row'),
    );
    expect(gridRows.length).toBe(2);

    const firstRowFormGroup = gridRows[0].injector.get(FormGroupDirective);
    const secondRowFormGroup = gridRows[1].injector.get(FormGroupDirective);

    expect(firstRowFormGroup.form).toBe(group);
    expect(secondRowFormGroup.form).toBe(group);
  });

  it('renders two app-date-input components', () => {
    const dateInputs = fixture.debugElement.queryAll(By.css('app-date-input'));
    expect(dateInputs.length).toBe(2);
  });

  it('renders four app-text-input components', () => {
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    expect(textInputs.length).toBe(4);
  });

  it('has a text input bound to the "description" control', () => {
    const descInput = fixture.debugElement.query(
      By.css('app-text-input[formControlName="description"]'),
    );
    expect(descInput).toBeTruthy();
  });

  it('has a text input bound to the "court" control', () => {
    const courtInput = fixture.debugElement.query(
      By.css('app-text-input[formControlName="court"]'),
    );
    expect(courtInput).toBeTruthy();
  });
});
