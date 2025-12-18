import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';

describe('GovukTextareaComponent', () => {
  let component: GovukTextareaComponent;
  let fixture: ComponentFixture<GovukTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GovukTextareaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GovukTextareaComponent);
    component = fixture.componentInstance;

    // Set required inputs up-front
    fixture.componentRef.setInput(
      'control',
      new FormControl<string | null>(''),
    );
    fixture.componentRef.setInput('id', 'change-reason');
    fixture.componentRef.setInput('name', 'reason');
    fixture.componentRef.setInput('ariaDescribedBy', 'change-reason');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get the remaining character count', () => {
    fixture.componentRef.setInput(
      'control',
      new FormControl<string | null>('Rejected for late'),
    );
    fixture.detectChanges();

    const result = component.remainingCharacterCount;

    expect(result).toEqual(
      // default maxCharacterLimit is 2000
      2000 - 'Rejected for late'.length,
    );
  });

  it('should get the remaining character count with custom max character limit', () => {
    fixture.componentRef.setInput(
      'control',
      new FormControl<string | null>('Eagle'),
    );
    fixture.componentRef.setInput('maxCharacterLimit', 200);
    fixture.detectChanges();

    const result = component.remainingCharacterCount;

    expect(result).toEqual(195);
  });

  it('should get the remaining character count for an empty form control', () => {
    fixture.componentRef.setInput(
      'control',
      new FormControl<string | null>(null),
    );
    fixture.componentRef.setInput('maxCharacterLimit', 200);
    fixture.detectChanges();

    const result = component.remainingCharacterCount;

    expect(result).toEqual(200);
  });
});
