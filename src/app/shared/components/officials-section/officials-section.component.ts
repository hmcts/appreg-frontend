import { Component, input } from '@angular/core';

import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

@Component({
  selector: 'app-officials-section',
  imports: [TextInputComponent, SelectInputComponent],
  templateUrl: './officials-section.component.html',
})
export class OfficialsSectionComponent {
  titleOptions = input.required<{ value: string; label: string }[]>();
}
