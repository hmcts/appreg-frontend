import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  input,
  output,
} from '@angular/core';

import { SummaryListCardAction } from '@core-types/summary-list-card-action/summary-list-card.type';

@Component({
  selector: 'app-summary-list-card-action',
  imports: [CommonModule],
  templateUrl: './summary-list-card-action.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './summary-list-card-action.component.scss',
})
export class SummaryListCardActionComponent {
  summaryLists = input.required<SummaryListCardAction[]>();
  actionText = input<string>('Remove');
  compact = input(true);

  cardBodyTemplate = input<TemplateRef<{
    $implicit: SummaryListCardAction;
  }> | null>(null);

  cardClick = output<SummaryListCardAction>();

  onActionClick(action: SummaryListCardAction): void {
    this.cardClick.emit(action);
  }

  getStatusTag(
    status: SummaryListCardAction['status'],
  ): { text: string; className?: string } | null {
    if (!status) {
      return null;
    }

    if (status === 'pending') {
      return { text: 'Pending', className: 'govuk-tag--grey' };
    }

    return { text: 'Existing' };
  }

  // NEEDS TO INTEGRATE WITH WORDING-PARSER
}
