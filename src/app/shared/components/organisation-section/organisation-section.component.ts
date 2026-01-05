import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TextInputComponent } from '../text-input/text-input.component';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { buildErrorTextByDomId, errorTextForDomId } from '@util/error-items';

@Component({
  selector: 'app-organisation-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent],
  templateUrl: './organisation-section.component.html',
})
export class OrganisationSectionComponent {
  readonly group = input.required<FormGroup>();
  readonly scopeId = input.required<string>();

  readonly submitted = input(false);

  readonly errors = input<readonly ErrorItem[]>([]);

  readonly errorByDomId = computed(() => buildErrorTextByDomId(this.errors()));

  errorFor(domId: string): string | null {
    return errorTextForDomId(this.errorByDomId(), domId);
  }
}
