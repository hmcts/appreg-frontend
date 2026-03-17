import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { PERSON_TITLE_OPTIONS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

@Component({
  selector: 'app-officials-section',
  imports: [TextInputComponent, SelectInputComponent, ReactiveFormsModule],
  templateUrl: './officials-section.component.html',
})
export class OfficialsSectionComponent {
  readonly titleOptions = PERSON_TITLE_OPTIONS;
  readonly group = input.required<FormGroup>();

  readonly saveOfficialsClicked = output<void>();

  onSaveOfficials(): void {
    this.saveOfficialsClicked.emit();
  }
}
