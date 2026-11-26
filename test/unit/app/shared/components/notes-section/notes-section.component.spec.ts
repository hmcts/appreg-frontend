import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  ApplicationNotesForm,
  NotesSectionComponent,
} from '@components/notes-section/notes-section.component';

// Host component to bind [form] input in a template
@Component({
  standalone: true,
  imports: [NotesSectionComponent],
  template:
    '<app-notes-section [form]="form" [submittedErrors]="submittedErrors()" />',
})
class HostComponent {
  readonly submittedErrors = signal<ErrorItem[]>([]);
  form: ApplicationNotesForm = new FormGroup({
    notes: new FormControl<string | null>(null),
    caseReference: new FormControl<string | null>(null),
    accountReference: new FormControl<string | null>(null),
  });
}

describe('NotesSectionComponent', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  let component: NotesSectionComponent;
  let form: ApplicationNotesForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();

    const debugEl = hostFixture.debugElement.query(
      By.directive(NotesSectionComponent),
    );
    component = debugEl.componentInstance;
    form = host.form;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps live validation errors hidden before submission', () => {
    const control = form.controls.caseReference;
    control.setErrors({ maxlength: true });
    control.markAsDirty();
    control.markAsTouched();
    hostFixture.detectChanges();

    const root: HTMLElement = hostFixture.nativeElement;
    expect(root.querySelector('#case-reference-error')).toBeNull();
    expect(
      root.querySelector('#caseReference')?.hasAttribute('aria-invalid'),
    ).toBe(false);
  });

  it('displays the submitted textarea message until the parent replaces it', () => {
    host.submittedErrors.set([
      {
        id: 'applicationNotes.notes',
        href: '#notes',
        text: 'Notes must be 3000 characters or fewer',
      },
    ]);
    form.controls.notes.setValue('Corrected notes');
    hostFixture.detectChanges();

    const root: HTMLElement = hostFixture.nativeElement;
    const notes = root.querySelector('textarea#notes');
    expect(notes?.getAttribute('aria-invalid')).toBe('true');
    expect(notes?.getAttribute('aria-describedby')).toContain('notes-error');
    expect(root.querySelector('#notes-error')?.textContent).toContain(
      'Notes must be 3000 characters or fewer',
    );

    host.submittedErrors.set([]);
    hostFixture.detectChanges();
    expect(notes?.hasAttribute('aria-invalid')).toBe(false);
    expect(root.querySelector('#notes-error')).toBeNull();
  });
});
