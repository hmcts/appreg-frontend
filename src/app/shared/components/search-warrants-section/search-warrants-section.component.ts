import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DateInputComponent } from '@components/date-input/date-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

@Component({
  selector: 'app-search-warrants-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateInputComponent,
    TextInputComponent,
  ],
  templateUrl: './search-warrants-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchWarrantsSectionComponent {
  /** Parent passes the nested reactive form group for this section */
  readonly group = input.required<FormGroup>();
}
