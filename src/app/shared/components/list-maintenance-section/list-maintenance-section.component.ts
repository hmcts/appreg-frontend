import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DateInputComponent } from '../date-input/date-input.component';
import { TextInputComponent } from '../text-input/text-input.component';

@Component({
  selector: 'app-list-maintenance-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateInputComponent,
    TextInputComponent,
  ],
  templateUrl: './list-maintenance-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListMaintenanceSectionComponent {
  /** Parent passes the nested reactive form group for this section */
  @Input({ required: true }) group!: FormGroup;
}
