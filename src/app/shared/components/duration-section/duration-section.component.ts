import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import type { ErrorItem } from '@components/error-summary/error-summary.component';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';
import type { ErrorMessageMap } from '@util/error-summary';

/**
 * DurationSectionComponent
 *
 * Functionality:
 * - Displays duration form fields.
 * - Shows validation errors for duration details.
 * - Uses the parent form and external errors for duration fields.
 */
@Component({
  selector: 'app-duration-section',
  standalone: true,
  imports: [ReactiveFormsModule, ReportsSharedFormComponent],
  templateUrl: './duration-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DurationSectionComponent {
  /** Parent passes the nested reactive form group for this section */
  readonly group = input.required<FormGroup>();

  suggestions = input.required<SuggestionsFacade>();
  submitted = input(false);
  readonly errorMap = input.required<ErrorMessageMap>();
  readonly externalErrors = input<readonly ErrorItem[]>([]);
}
