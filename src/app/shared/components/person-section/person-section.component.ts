import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SelectInputComponent } from '../select-input/select-input.component';
import { TextInputComponent } from '../text-input/text-input.component';

@Component({
  selector: 'app-person-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectInputComponent, TextInputComponent],
  templateUrl: './person-section.component.html',
})
export class PersonSectionComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) titleOptions!: { value: string; label: string }[];
}
