/**
 * Reports page shared form fields:
 *
 * Form: Date from, Date to, Court, Other location, CJA
 */

import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

@Component({
  selector: 'app-reports-shared-form',
  imports: [
    DateInputComponent,
    TextInputComponent,
    ReactiveFormsModule,
    SuggestionsComponent,
  ],
  templateUrl: './reports-shared-form.component.html',
})
export class ReportsSharedFormComponent {
  group = input.required<FormGroup>();
  suggestions = input.required<SuggestionsFacade>();

  submitted = input(false);
  getError = input<((id: string) => ErrorItem | undefined) | null>(null);

  showError = (id: string): boolean =>
    this.submitted() && !!this.getError()?.(id);
  errorText = (id: string): string => this.getError()?.(id)?.text ?? '';
}
