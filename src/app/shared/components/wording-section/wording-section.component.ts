import { Component, computed, input, output, signal } from '@angular/core';

import {
  Token,
  WordingParserComponent,
} from '@components/wording-parser/wording-parser.component';
import { TemplateDetail } from '@openapi';

@Component({
  selector: 'app-wording-section',
  imports: [WordingParserComponent],
  templateUrl: './wording-section.component.html',
})
export class WordingSectionComponent {
  wordingObject = input.required<TemplateDetail>();
  tokens = signal<Token[]>([]);

  saveWording = output<void>();

  isSaveDisabled = computed(() =>
    this.tokens().some((token) => token.type === 'input'),
  );

  onTokensChange(tokens: Token[]): void {
    this.tokens.set(tokens);
  }
}
