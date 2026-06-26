import { Component, input } from '@angular/core';

@Component({
  selector: 'app-help-details',
  standalone: true,
  template: `
    <details class="govuk-details">
      <summary class="govuk-details__summary">
        <span class="govuk-details__summary-text">{{ summary() }}</span>
      </summary>

      <div class="govuk-details__text">
        <ng-content />
      </div>
    </details>
  `,
})
export class HelpDetailsComponent {
  readonly summary = input.required<string>();
}
