import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-govuk-textarea',
  imports: [ReactiveFormsModule],
  templateUrl: './govuk-textarea.component.html',
})
export class GovukTextareaComponent {
  control = input.required<FormControl<string | null>>();
  maxCharacterLimit = input(2000);
  rows = input(5);
  id = input.required<string>();
  name = input.required<string>();
  ariaDescribedBy = input.required<string>();
  isInvalid = input(false);
  characterCountEnabled = input(true);

  get remainingCharacterCount(): number {
    const ctrl = this.control();
    const value = ctrl?.value ?? '';
    return this.maxCharacterLimit() - value.length;
  }
}
