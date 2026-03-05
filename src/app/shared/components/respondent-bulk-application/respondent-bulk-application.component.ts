import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { buildErrorTextByDomId, errorTextForDomId } from '@util/error-items';

@Component({
  selector: 'app-respondent-bulk-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent],
  templateUrl: './respondent-bulk-application.component.html',
})
export class RespondentBulkApplicationComponent {
  readonly form = input.required<FormGroup>();
  readonly submitted = input(false);
  readonly errors = input<readonly ErrorItem[]>([]);

  readonly errorByDomId = computed(() => buildErrorTextByDomId(this.errors()));

  errorFor(domId: string): string | null {
    return errorTextForDomId(this.errorByDomId(), domId);
  }
}
