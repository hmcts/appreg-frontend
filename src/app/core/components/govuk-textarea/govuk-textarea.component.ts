import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-govuk-textarea',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
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
  errorMessage = input<string>('');
  label = input<string>('');

  get errorId(): string {
    return `${this.id()}-error`;
  }

  get describedBy(): string | null {
    const describedBy = [
      this.ariaDescribedBy(),
      this.isInvalid() && this.errorMessage() ? this.errorId : '',
    ]
      .filter(Boolean)
      .join(' ');

    return describedBy || null;
  }

  get remainingCharacterCount(): number {
    const ctrl = this.control();
    const value = ctrl?.value ?? '';
    return this.maxCharacterLimit() - value.length;
  }

  get charLimitText(): string {
    if (this.remainingCharacterCount < 0) {
      return `You have 0 characters remaining. Please remove ${Math.abs(this.remainingCharacterCount)} characters before submitting.`;
    }
    return `You have ${this.remainingCharacterCount} character${this.remainingCharacterCount === 1 ? '' : 's'} remaining`;
  }
}
