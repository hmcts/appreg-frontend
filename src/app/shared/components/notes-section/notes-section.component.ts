import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';
import { NOTES_ERROR_MESSAGES } from '@constants/application-list-entry/error-messages';

export type ApplicationNotesForm = FormGroup<{
  notes: FormControl<string | null>;
  caseReference: FormControl<string | null>;
  accountReference: FormControl<string | null>;
}>;
@Component({
  selector: 'app-notes-section',
  imports: [GovukTextareaComponent, ReactiveFormsModule],
  templateUrl: './notes-section.component.html',
})
export class NotesSectionComponent {
  form = input.required<ApplicationNotesForm>();
  // signal output
  notesErrors = output<ErrorItem[]>();

  NOTES_FIELD_MESSAGES = NOTES_ERROR_MESSAGES;

  getControlErrorMessages(
    controlName: keyof ApplicationNotesForm['controls'],
  ): string[] {
    const ctrl = this.form().controls[controlName];
    const errors = ctrl.errors;
    if (!errors) {
      return [];
    }

    const map = this.NOTES_FIELD_MESSAGES[controlName] ?? {};
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
