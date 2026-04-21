import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { UK_POSTCODE_REGEX } from '@constants/regex';

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
  form = new FormGroup({
    sequenceNumber: new FormControl<string>(''),
    accountNumber: new FormControl<string>(''),
    applicant: new FormControl<string>(''),
    respondent: new FormControl<string>(''),
    postcode: new FormControl<string>('', {
      validators: [Validators.pattern(UK_POSTCODE_REGEX)],
    }),
    title: new FormControl<string>(''),
    fee: new FormControl<string>(''),
    resulted: new FormControl<string>(''),
  });

  clearSearch(): void {
    this.form.reset({
      sequenceNumber: '',
      accountNumber: '',
      applicant: '',
      respondent: '',
      postcode: '',
      title: '',
      fee: '',
      resulted: '',
    });
  }

  onSearch(): void {}
}
