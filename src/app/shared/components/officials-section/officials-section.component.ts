import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

@Component({
  selector: 'app-officials-section',
  imports: [TextInputComponent, SelectInputComponent, ReactiveFormsModule],
  templateUrl: './officials-section.component.html',
})
export class OfficialsSectionComponent {
  readonly titleOptions = input.required<{ value: string; label: string }[]>();
  readonly group = input.required<FormGroup>();

  readonly saveOfficialsClicked = output<void>();

  onSaveOfficials(): void {
    this.saveOfficialsClicked.emit();
  }
}
