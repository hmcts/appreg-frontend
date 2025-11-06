import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TextInputComponent } from '../text-input/text-input.component';

@Component({
  selector: 'app-organisation-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent],
  templateUrl: './organisation-section.component.html',
})
export class OrganisationSectionComponent {
  @Input({ required: true }) group!: FormGroup;
}
