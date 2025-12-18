import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';

export type ApplicationNotesForm = FormGroup<{
  notes: FormControl<string | null>;
  caseReference: FormControl<string | null>;
  accountReference: FormControl<string | null>;
}>;

type NotesControlName = keyof ApplicationNotesForm['controls'];

type NotesErrorMap = Readonly<
  Record<NotesControlName, Readonly<Record<string, string>>>
>;

export const NOTES_FIELD_MESSAGES: NotesErrorMap = {
  accountReference: {
    maxlength: 'Account reference must be less than or equal to 20 characters',
    pattern: 'Account reference must only contain letters and numbers',
  },
  caseReference: {
    maxlength: 'Case reference must be less than or equal to 15 characters',
    pattern: 'Case reference must only contain letters and numbers',
  },
  notes: {
    maxlength: 'Notes must be less than or equal to 4000 characters',
  },
} as const;
@Component({
  selector: 'app-notes-section',
  imports: [GovukTextareaComponent, ReactiveFormsModule],
  templateUrl: './notes-section.component.html',
})
export class NotesSectionComponent {
  form = input.required<ApplicationNotesForm>();
  // signal output
  notesErrors = output<ErrorItem[]>();

  getControlErrorMessages(
    controlName: keyof ApplicationNotesForm['controls'],
  ): string[] {
    const ctrl = this.form().controls[controlName];
    const errors = ctrl.errors;
    if (!errors) {
      return [];
    }

    const map = NOTES_FIELD_MESSAGES[controlName] ?? {};
    return Object.keys(errors)
      .map((errorKey) => map[errorKey])
      .filter((msg): msg is string => !!msg);
  }

  isControlInvalid(
    controlName: keyof ApplicationNotesForm['controls'],
  ): boolean {
    const ctrl = this.form().controls[controlName];
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  emitNotesErrors(): void {
    const entries: ErrorItem[] = [];

    (['notes', 'caseReference', 'accountReference'] as const).forEach(
      (name) => {
        this.getControlErrorMessages(name).forEach((message) => {
          entries.push({
            id: name,
            text: message,
          });
        });
      },
    );

    this.notesErrors.emit(entries);
  }
}
