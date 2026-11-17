import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  input,
  output,
} from '@angular/core';

import { AlertComponent } from '@components/alert/alert.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  WordingParserComponent,
  WordingValidationOptions,
} from '@components/wording-parser/wording-parser.component';
import { TemplateDetail, TemplateSubstitution } from '@openapi';

/**
 * WordingSectionComponent
 *
 * Functionality:
 * - Displays and validates wording fields.
 * - Emits wording values, errors, and banner dismissal.
 * - Coordinates wording parsing with submission validation and applied-banner state.
 */
@Component({
  selector: 'app-wording-section',
  imports: [WordingParserComponent, AlertComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './wording-section.component.html',
})
export class WordingSectionComponent {
  @ViewChild(WordingParserComponent)
  private readonly wordingParser?: WordingParserComponent;

  hasUnchangedContent(): boolean {
    return this.wordingParser?.hasUnchangedContent() ?? true;
  }

  wordingObject = input.required<TemplateDetail>();
  wordingObjectValues = input<TemplateDetail>();
  wordingSubmitAttempt = input.required<number>();
  showAppliedBanner = input(false);

  wordingFieldErrors = output<ErrorItem[]>();
  wordingFieldsDTO = output<{ wordingFields: TemplateSubstitution[] }>();
  appliedBannerDismissed = output<void>();

  onWordingFieldsDTO(dto: { wordingFields: TemplateSubstitution[] }): void {
    this.wordingFieldsDTO.emit(dto);
  }

  onWordingFieldErrors(errors: ErrorItem[]): void {
    this.wordingFieldErrors.emit(errors);
  }

  onAppliedBannerDismissed(): void {
    this.appliedBannerDismissed.emit();
  }

  validateForSubmit(opts?: WordingValidationOptions): ErrorItem[] {
    return this.wordingParser?.validateForSubmit(opts) ?? [];
  }
}
