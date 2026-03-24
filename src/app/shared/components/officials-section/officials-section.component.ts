import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { PERSON_TITLE_OPTIONS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { buildErrorTextByDomId, errorTextForDomId } from '@util/error-items';

@Component({
  selector: 'app-officials-section',
  imports: [
    CommonModule,
    TextInputComponent,
    SelectInputComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './officials-section.component.html',
})
export class OfficialsSectionComponent {
  readonly titleOptions = PERSON_TITLE_OPTIONS;
  readonly group = input.required<FormGroup>();
  readonly errors = input<readonly ErrorItem[]>([]);

  readonly errorByDomId = computed(() => buildErrorTextByDomId(this.errors()));

  readonly saveOfficialsClicked = output<void>();

  errorFor(domId: string): string | null {
    return errorTextForDomId(this.errorByDomId(), domId);
  }

  onSaveOfficials(): void {
    this.saveOfficialsClicked.emit();
  }
}
