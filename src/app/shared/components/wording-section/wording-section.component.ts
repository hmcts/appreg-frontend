import { Component, ViewChild, input, output } from '@angular/core';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { WordingParserComponent } from '@components/wording-parser/wording-parser.component';
import { TemplateDetail, TemplateSubstitution } from '@openapi';

@Component({
  selector: 'app-wording-section',
  imports: [WordingParserComponent],
  templateUrl: './wording-section.component.html',
})
export class WordingSectionComponent {
  @ViewChild(WordingParserComponent)
  private wordingParser?: WordingParserComponent;

  wordingObject = input.required<TemplateDetail>();
  wordingSubmitAttempt = input.required<number>();

  wordingFieldErrors = output<ErrorItem[]>();
  wordingFieldsDTO = output<{ wordingFields: TemplateSubstitution[] }>();

  onWordingFieldsDTO(dto: { wordingFields: TemplateSubstitution[] }): void {
    this.wordingFieldsDTO.emit(dto);
  }

  onWordingFieldErrors(errors: ErrorItem[]): void {
    this.wordingFieldErrors.emit(errors);
  }

  validateForSubmit(): ErrorItem[] {
    return this.wordingParser?.validateForSubmit() ?? [];
  }
}
