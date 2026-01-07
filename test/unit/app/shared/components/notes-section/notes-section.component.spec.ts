import { Component } from '@angular/core';
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
  template: '<app-notes-section [form]="form" />',
})
class HostComponent {
  form: ApplicationNotesForm = new FormGroup({
    notes: new FormControl<string | null>(null),
    caseReference: new FormControl<string | null>(null),
    accountReference: new FormControl<string | null>(null),
  }) as ApplicationNotesForm;
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

  describe('getControlErrorMessages', () => {
    it('returns an empty array when there are no errors', () => {
      const messages = component.getControlErrorMessages('caseReference');
      expect(messages).toEqual([]);
    });

    it('returns mapped messages for known error keys', () => {
      form.controls.caseReference.setErrors({ maxlength: true, pattern: true });

      const messages = component.getControlErrorMessages('caseReference');

      expect(messages).toContain(
        component.NOTES_FIELD_MESSAGES.caseReference['maxlength'],
      );
      expect(messages).toContain(
        component.NOTES_FIELD_MESSAGES.caseReference['pattern'],
      );
      expect(messages).toHaveLength(2);
    });

    it('ignores unknown error keys', () => {
      form.controls.caseReference.setErrors({ unknownRule: true } as never);

      const messages = component.getControlErrorMessages('caseReference');

      expect(messages).toEqual([]);
    });
  });

  describe('isControlInvalid', () => {
    it('returns false when control is valid', () => {
      const result = component.isControlInvalid('notes');
      expect(result).toBe(false);
    });

    it('returns false when control has errors but is neither dirty nor touched', () => {
      form.controls.notes.setErrors({ maxlength: true });

      const result = component.isControlInvalid('notes');
      expect(result).toBe(false);
    });

    it('returns true when control has errors and is touched', () => {
      form.controls.notes.setErrors({ maxlength: true });
      form.controls.notes.markAsTouched();

      const result = component.isControlInvalid('notes');
      expect(result).toBe(true);
    });

    it('returns true when control has errors and is dirty', () => {
      form.controls.notes.setErrors({ maxlength: true });
      form.controls.notes.markAsDirty();

      const result = component.isControlInvalid('notes');
      expect(result).toBe(true);
    });
  });

  describe('emitNotesErrors', () => {
    it('emits an empty array when there are no control errors', () => {
      const emitSpy = jest.spyOn(component.notesErrors, 'emit');

      component.emitNotesErrors();

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const arg = emitSpy.mock.calls[0][0];
      expect(arg).toEqual([]);
    });

    it('emits all mapped errors for notes, caseReference and accountReference', () => {
      const emitSpy = jest.spyOn(component.notesErrors, 'emit');

      form.controls.notes.setErrors({ maxlength: true });
      form.controls.caseReference.setErrors({ pattern: true });
      form.controls.accountReference.setErrors({ maxlength: true });

      component.emitNotesErrors();

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const emitted = emitSpy.mock.calls[0][0];

      expect(emitted).toEqual(
        expect.arrayContaining<ErrorItem>([
          {
            id: 'notes',
            text: component.NOTES_FIELD_MESSAGES.notes['maxlength'],
          },
          {
            id: 'caseReference',
            text: component.NOTES_FIELD_MESSAGES.caseReference['pattern'],
          },
          {
            id: 'accountReference',
            text: component.NOTES_FIELD_MESSAGES.accountReference['maxlength'],
          },
        ]),
      );
      expect(emitted).toHaveLength(3);
    });
  });
});
