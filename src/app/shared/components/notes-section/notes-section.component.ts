import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import type { ErrorItem } from '@components/error-summary/error-summary.component';
import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';
import { HelpDetailsComponent } from '@components/help-details/help-details.component';

export type ApplicationNotesForm = FormGroup<{
  notes: FormControl<string | null>;
  caseReference: FormControl<string | null>;
  accountReference: FormControl<string | null>;
}>;
/**
 * NotesSectionComponent
 *
 * Functionality:
 * - Displays notes form fields.
 * - Displays the validation errors from the most recent entry submission.
 */
@Component({
  selector: 'app-notes-section',
  imports: [GovukTextareaComponent, ReactiveFormsModule, HelpDetailsComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './notes-section.component.html',
})
export class NotesSectionComponent {
  form = input.required<ApplicationNotesForm>();
  submittedErrors = input<readonly ErrorItem[]>([]);

  getControlError(
    controlName: keyof ApplicationNotesForm['controls'],
  ): ErrorItem | undefined {
    return this.submittedErrors().find(
      ({ id }) => id === `applicationNotes.${controlName}`,
    );
  }

  showControlError(
    controlName: keyof ApplicationNotesForm['controls'],
  ): boolean {
    return !!this.getControlError(controlName);
  }
}
