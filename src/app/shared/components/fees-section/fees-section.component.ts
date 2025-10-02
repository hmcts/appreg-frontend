import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DateInputComponent } from '../date-input/date-input.component';
import { TextInputComponent } from '../text-input/text-input.component';

@Component({
  selector: 'app-fees-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateInputComponent,
    TextInputComponent,
  ],
  templateUrl: './fees-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeesSectionComponent {
  /** Parent passes the nested form group for the Fees section */
  @Input({ required: true }) group!: FormGroup;
}
