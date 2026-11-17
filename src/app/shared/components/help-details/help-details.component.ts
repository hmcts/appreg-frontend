import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * HelpDetailsComponent
 *
 * Functionality:
 * - Displays expandable help content.
 * - Provides reusable help details for form sections.
 * - Renders a supplied summary and projected help content in a details element.
 */
@Component({
  selector: 'app-help-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
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
