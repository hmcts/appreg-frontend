import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DateInputComponent } from '@components/date-input/date-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

@Component({
  selector: 'app-private-prosecutors-index-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateInputComponent,
    TextInputComponent,
  ],
  templateUrl: './private-prosecutors-index-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateProsecutorsIndexSectionComponent {
  /** Parent passes the nested reactive form group for this section */
  @Input({ required: true }) group!: FormGroup;
}
