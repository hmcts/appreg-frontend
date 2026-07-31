import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import type { ErrorItem } from '@components/error-summary/error-summary.component';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import type { ErrorMessageMap } from '@util/error-summary';

@Component({
  selector: 'app-list-maintenance-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TextInputComponent,
    ReportsSharedFormComponent,
  ],
  templateUrl: './list-maintenance-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListMaintenanceSectionComponent {
  /** Parent passes the nested reactive form group for this section */
  readonly group = input.required<FormGroup>();

  suggestions = input.required<SuggestionsFacade>();
  submitted = input(false);
  readonly errorMap = input.required<ErrorMessageMap>();
  readonly externalErrors = input<readonly ErrorItem[]>([]);
}
