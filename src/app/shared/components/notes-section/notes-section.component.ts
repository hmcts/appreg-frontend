import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import type { ErrorItem } from '@components/error-summary/error-summary.component';
import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';
import { HelpDetailsComponent } from '@components/help-details/help-details.component';
import { NOTES_ERROR_MESSAGES } from '@constants/application-list-entry/error-messages';
import {
  buildFormErrorSummary,
  getControlErrorItem,
} from '@util/error-summary';

export type ApplicationNotesForm = FormGroup<{
  notes: FormControl<string | null>;
  caseReference: FormControl<string | null>;
  accountReference: FormControl<string | null>;
}>;
@Component({
  selector: 'app-notes-section',
  imports: [GovukTextareaComponent, ReactiveFormsModule, HelpDetailsComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './notes-section.component.html',
})
export class NotesSectionComponent {
  form = input.required<ApplicationNotesForm>();
  // signal output
  notesErrors = output<ErrorItem[]>();

  readonly errorMap = NOTES_ERROR_MESSAGES;

  getControlError(
    controlName: keyof ApplicationNotesForm['controls'],
  ): ErrorItem | undefined {
    return getControlErrorItem(
      this.form().controls[controlName],
      controlName,
      this.errorMap,
    );
  }

  showControlError(
    controlName: keyof ApplicationNotesForm['controls'],
  ): boolean {
    const ctrl = this.form().controls[controlName];
    return !!this.getControlError(controlName) && (ctrl.dirty || ctrl.touched);
  }

  emitNotesErrors(): void {
    this.notesErrors.emit(buildFormErrorSummary(this.form(), this.errorMap));
  }
}
