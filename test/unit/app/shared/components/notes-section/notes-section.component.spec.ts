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

  describe('getControlError', () => {
    it('returns undefined when there are no errors', () => {
      expect(component.getControlError('caseReference')).toBeUndefined();
    });

    it('returns the mapped error item for a known error key', () => {
      form.controls.caseReference.setErrors({ maxlength: true });

      expect(component.getControlError('caseReference')).toEqual({
        id: 'caseReference',
        href: '#caseReference',
        text: component.errorMap.caseReference['maxlength'],
      });
    });

    it('ignores unknown error keys', () => {
      form.controls.caseReference.setErrors({ unknownRule: true });

      expect(component.getControlError('caseReference')).toBeUndefined();
    });
  });

  describe('showControlError', () => {
    it('returns false when control is valid', () => {
      const result = component.showControlError('notes');
      expect(result).toBe(false);
    });

    it('returns false when control has errors but is neither dirty nor touched', () => {
      form.controls.notes.setErrors({ maxlength: true });

      const result = component.showControlError('notes');
      expect(result).toBe(false);
    });

    it('returns true when control has errors and is touched', () => {
      form.controls.notes.setErrors({ maxlength: true });
      form.controls.notes.markAsTouched();

      const result = component.showControlError('notes');
      expect(result).toBe(true);
    });

    it('returns true when control has errors and is dirty', () => {
      form.controls.notes.setErrors({ maxlength: true });
      form.controls.notes.markAsDirty();

      const result = component.showControlError('notes');
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

    it('emits the mapped error for each notes control', () => {
      const emitSpy = jest.spyOn(component.notesErrors, 'emit');

      form.controls.notes.setErrors({ maxlength: true });
      form.controls.caseReference.setErrors({ maxlength: true });
      form.controls.accountReference.setErrors({ maxlength: true });

      component.emitNotesErrors();

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const emitted = emitSpy.mock.calls[0][0];

      expect(emitted).toEqual(
        expect.arrayContaining<ErrorItem>([
          {
            id: 'notes',
            href: '#notes',
            text: component.errorMap.notes['maxlength'],
          },
          {
            id: 'caseReference',
            href: '#caseReference',
            text: component.errorMap.caseReference['maxlength'],
          },
          {
            id: 'accountReference',
            href: '#accountReference',
            text: component.errorMap.accountReference['maxlength'],
          },
        ]),
      );
      expect(emitted).toHaveLength(3);
    });
  });
});
