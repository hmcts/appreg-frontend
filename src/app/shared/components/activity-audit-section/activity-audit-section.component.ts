import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DateInputComponent } from '../date-input/date-input.component';
import { TextInputComponent } from '../text-input/text-input.component';

@Component({
  selector: 'app-activity-audit-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateInputComponent,
    TextInputComponent,
  ],
  templateUrl: './activity-audit-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityAuditSectionComponent {
  /** Parent passes a nested FormGroup containing controls for this section. */
  @Input({ required: true }) group!: FormGroup;
}
