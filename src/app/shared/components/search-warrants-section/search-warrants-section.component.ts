import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';

@Component({
  selector: 'app-search-warrants-section',
  standalone: true,
  imports: [ReactiveFormsModule, ReportsSharedFormComponent],
  templateUrl: './search-warrants-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchWarrantsSectionComponent {
  /** Parent passes the nested reactive form group for this section */
  readonly group = input.required<FormGroup>();

  suggestions = input.required<SuggestionsFacade>();
  submitted = input(false);
}
