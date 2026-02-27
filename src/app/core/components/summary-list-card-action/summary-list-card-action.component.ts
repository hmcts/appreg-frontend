import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

export type SummaryListCardActionContent = {
  key: string;
  value: string;
};

export type SummaryListCardAction = {
  id?: string;
  title: string;
  status?: 'pending' | 'existing';
  content: SummaryListCardActionContent[];
};

@Component({
  selector: 'app-summary-list-card-action',
  imports: [CommonModule],
  templateUrl: './summary-list-card-action.component.html',
  styleUrl: './summary-list-card-action.component.scss',
})
export class SummaryListCardActionComponent {
  summaryLists = input.required<SummaryListCardAction[]>();
  actionText = input<string>('Remove');
  compact = input(true);

  onClick = output<SummaryListCardAction>();

  onActionClick(action: SummaryListCardAction): void {
    this.onClick.emit(action);
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
