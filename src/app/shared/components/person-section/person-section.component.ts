import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { buildErrorTextByDomId, errorTextForDomId } from '@util/error-items';

@Component({
  selector: 'app-person-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectInputComponent,
    TextInputComponent,
  ],
  templateUrl: './person-section.component.html',
})
export class PersonSectionComponent {
  titleOptions = input.required<{ value: string; label: string }[]>();
  readonly group = input.required<FormGroup>();
  readonly scopeId = input.required<string>();

  readonly submitted = input(false);

  readonly errors = input<readonly ErrorItem[]>([]);

  readonly errorByDomId = computed(() => buildErrorTextByDomId(this.errors()));

  errorFor(domId: string): string | null {
    return errorTextForDomId(this.errorByDomId(), domId);
  }
}
