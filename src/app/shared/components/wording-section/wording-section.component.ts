import { Component, computed, input, output, signal } from '@angular/core';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  Token,
  WordingParserComponent,
} from '@components/wording-parser/wording-parser.component';
import { TemplateDetail, TemplateSubstitution } from '@openapi';

@Component({
  selector: 'app-wording-section',
  imports: [WordingParserComponent],
  templateUrl: './wording-section.component.html',
})
export class WordingSectionComponent {
  wordingObject = input.required<TemplateDetail>();
  tokens = signal<Token[]>([]);
  submitAttempt = input.required<number>();

  wordingFieldErrors = output<ErrorItem[]>();

  wordingFields!: TemplateSubstitution[];
  wordingFieldsDTO = output<{ wordingFields: TemplateSubstitution[] }>();

  isSaveDisabled = computed(() =>
    this.tokens().some((token) => token.type === 'input'),
  );

  onTokensChange(tokens: Token[]): void {
    this.tokens.set(tokens);
  }

  onWordingFieldsDTO(dto: { wordingFields: TemplateSubstitution[] }): void {
    this.wordingFieldsDTO.emit(dto);
  }

  onWordingFieldErrors(errors: ErrorItem[]): void {
    this.wordingFieldErrors.emit(errors ?? []);
  }
}
