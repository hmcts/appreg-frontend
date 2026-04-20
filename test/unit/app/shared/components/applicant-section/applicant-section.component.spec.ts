import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ApplicantSectionComponent } from '@components/applicant-section/applicant-section.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { ApplicantType } from '@shared-types/applications-list-entry-create/application-list-entry-form';

@Component({ selector: 'app-person-section', standalone: true, template: '' })
class MockPersonSectionComponent {
  readonly group = input.required<FormGroup>();
  readonly scopeId = input<string>();
  readonly titleOptions = input<unknown[]>();
  readonly submitted = input(false);
  readonly errors = input<unknown[]>();
}

@Component({
  selector: 'app-organisation-section',
  standalone: true,
  template: '',
})
class MockOrganisationSectionComponent {
  readonly group = input.required<FormGroup>();
  readonly scopeId = input<string>();
  readonly submitted = input(false);
  readonly errors = input<unknown[]>();
}

@Component({
  selector: 'app-standard-applicant-select',
  standalone: true,
  template: '',
})
class MockStandardApplicantSelectComponent {
  readonly selectedCode = input<string | null>(null);
  readonly selectedCodeChange = output<string | null>();
  readonly searchErrorsChange = output<unknown[]>();
}

describe('ApplicantSectionComponent', () => {
  let component: ApplicantSectionComponent;
  let fixture: ComponentFixture<ApplicantSectionComponent>;
  let fb: FormBuilder;

  const buildForm = (fb: FormBuilder) =>
    fb.group({
      applicantType: fb.control<ApplicantType>('person'),
      standardApplicantCode: fb.control<string | null>(null),
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ApplicantSectionComponent],
    })
      .overrideComponent(ApplicantSectionComponent, {
        set: {
          imports: [
            ReactiveFormsModule,
            SelectInputComponent,
            MockPersonSectionComponent,
            MockOrganisationSectionComponent,
            MockStandardApplicantSelectComponent,
          ],
        },
      })
      .compileComponents();

    fb = TestBed.inject(FormBuilder);

    fixture = TestBed.createComponent(ApplicantSectionComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('form', buildForm(fb));
    fixture.componentRef.setInput('personGroup', fb.group({}));
    fixture.componentRef.setInput('organisationGroup', fb.group({}));
    fixture.componentRef.setInput('applicantType', 'person' as ApplicantType);

    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders the applicant type select wrapper', () => {
    expect(fixture.debugElement.query(By.css('app-select-input'))).toBeTruthy();
  });

  it('shows person section when applicantType is person', () => {
    fixture.componentRef.setInput('applicantType', 'person' as ApplicantType);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('app-person-section')),
    ).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css('app-organisation-section')),
    ).toBeNull();
    expect(
      fixture.debugElement.query(By.css('app-standard-applicant-select')),
    ).toBeNull();
  });

  it('shows organisation section when applicantType is org', () => {
    fixture.componentRef.setInput('applicantType', 'org' as ApplicantType);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('app-organisation-section')),
    ).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-person-section'))).toBeNull();
    expect(
      fixture.debugElement.query(By.css('app-standard-applicant-select')),
    ).toBeNull();
  });

  it('shows standard applicant select when applicantType is standard', () => {
    fixture.componentRef.setInput('applicantType', 'standard' as ApplicantType);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('app-standard-applicant-select')),
    ).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-person-section'))).toBeNull();
    expect(
      fixture.debugElement.query(By.css('app-organisation-section')),
    ).toBeNull();
  });

  it('emits updateClicked when the update button is clicked', () => {
    const spy = jest.fn();
    component.updateClicked.subscribe(spy);

    const btn = fixture.debugElement.query(By.css('#btn-update-applicant'));
    expect(btn).toBeTruthy();

    btn.nativeElement.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not render update button when showUpdateButton is false', () => {
    fixture.componentRef.setInput('showUpdateButton', false);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('#btn-update-applicant')),
    ).toBeNull();
  });

  it('renders custom update button text', () => {
    fixture.componentRef.setInput('updateButtonText', 'Save applicant');
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('#btn-update-applicant'));
    expect(btn.nativeElement.textContent).toContain('Save applicant');
  });

  it('emits standardApplicantCodeChange when onStandardChanged is called', () => {
    const spy = jest.fn();
    component.standardApplicantCodeChange.subscribe(spy);

    component.onStandardChanged('ABC123');
    expect(spy).toHaveBeenCalledWith('ABC123');
  });

  it('emits applicantErrorsChange when standard applicant errors are relayed', () => {
    const spy = jest.fn();
    const errors = [{ id: 'code', text: 'Bad code', href: '#code' }];

    component.applicantErrorsChange.subscribe(spy);

    component.onStandardApplicantErrorsChanged(errors);
    expect(spy).toHaveBeenCalledWith(errors);
  });

  it('disables update button when isUpdateDisabled is true', () => {
    fixture.componentRef.setInput('isUpdateDisabled', true);
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('#btn-update-applicant'));
    expect(btn.nativeElement.disabled).toBe(true);
  });
});
