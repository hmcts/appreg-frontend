import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

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
  getError = input<((id: string) => ErrorItem | undefined) | null>(null);

  feeJobId = output<string>();
  errors = output<HttpErrorResponse>();
}
