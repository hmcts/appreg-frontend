import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

export type ApplicationNotesForm = FormGroup<{
  notes: FormControl<string | null>;
  caseReference: FormControl<string | null>;
  accountReference: FormControl<string | null>;
}>;

@Component({
  selector: 'app-notes-section',
  imports: [TextInputComponent, GovukTextareaComponent, ReactiveFormsModule],
  templateUrl: './notes-section.component.html',
  styleUrl: './notes-section.component.scss',
})
export class NotesSectionComponent {
  form = input.required<ApplicationNotesForm>();
}
