import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import type { ErrorItem } from '@components/error-summary/error-summary.component';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import type { ErrorMessageMap } from '@util/error-summary';

@Component({
  selector: 'app-fees-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TextInputComponent,
    ReportsSharedFormComponent,
  ],
  templateUrl: './fees-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeesSectionComponent {
  /** Parent passes the nested form group for the Fees section */
  readonly group = input.required<FormGroup>();

  suggestions = input.required<SuggestionsFacade>();
  submitted = input(false);
  readonly errorMap = input.required<ErrorMessageMap>();
  readonly externalErrors = input<readonly ErrorItem[]>([]);
}
