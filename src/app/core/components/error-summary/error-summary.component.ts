import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

export type ErrorItem = { text: string; href?: string; id?: string };

@Component({
  selector: 'app-error-summary',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: 'error-summary.component.html',
})
export class ErrorSummaryComponent implements AfterViewInit {
  /** Heading text (defaults to GOV.UK copy) */
  title = input('There is a problem');
  /** List of error items; if an item has no href and targetId is provided, a hash link is used */
  items = input<ErrorItem[]>([]);
  /** Optional element ID to scroll to/focus when any link is clicked (e.g. 'sortable-table') */
  targetId = input<string>();
  /** Auto-focus the summary on render (recommended for a11y) */
  autoFocus = input(true);
  /** If you want to run custom logic (e.g. focus a form field), listen to this */
  itemSelect = output<ErrorItem>();

  @ViewChild('summaryEl')
  private readonly summaryEl?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (this.autoFocus()) {
      setTimeout(() => this.summaryEl?.nativeElement.focus(), 0);
    }
  }
}
