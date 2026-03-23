import { Component, ViewChild, input, output, signal } from '@angular/core';

import { AlertComponent } from '@components/alert/alert.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { WordingParserComponent } from '@components/wording-parser/wording-parser.component';
import { TemplateDetail, TemplateSubstitution } from '@openapi';

@Component({
  selector: 'app-wording-section',
  imports: [WordingParserComponent, AlertComponent],
  templateUrl: './wording-section.component.html',
})
export class WordingSectionComponent {
  @ViewChild(WordingParserComponent)
  private readonly wordingParser?: WordingParserComponent;

  saveSuccessful = signal(false);

  wordingObject = input.required<TemplateDetail>();
  wordingObjectValues = input<TemplateDetail>();
  wordingSubmitAttempt = input.required<number>();

  wordingFieldErrors = output<ErrorItem[]>();
  wordingFieldsDTO = output<{ wordingFields: TemplateSubstitution[] }>();

  onWordingFieldsDTO(dto: { wordingFields: TemplateSubstitution[] }): void {
    this.wordingFieldsDTO.emit(dto);
    this.saveSuccessful.set(true);
  }

  onWordingFieldErrors(errors: ErrorItem[]): void {
    this.wordingFieldErrors.emit(errors);
    this.saveSuccessful.set(false);
  }

  validateForSubmit(): ErrorItem[] {
    return this.wordingParser?.validateForSubmit() ?? [];
  }
}
