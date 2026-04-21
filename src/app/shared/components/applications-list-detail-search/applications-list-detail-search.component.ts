import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

@Component({
  selector: 'app-applications-list-detail-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextInputComponent,
    SelectInputComponent,
  ],
  templateUrl: './applications-list-detail-search.component.html',
  styleUrl: './applications-list-detail-search.component.scss',
})
export class ApplicationsListDetailSearchComponent {
  form = input<FormGroup>();
}
