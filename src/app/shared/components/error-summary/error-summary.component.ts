import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

export type ErrorItem = { text: string; href?: string; id?: string };

@Component({
  selector: 'app-error-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'error-summary.component.html',
})
export class ErrorSummaryComponent implements AfterViewInit {
  /** Heading text (defaults to GOV.UK copy) */
  @Input() title = 'There is a problem';
  /** List of error items; if an item has no href and targetId is provided, a hash link is used */
  @Input() items: ErrorItem[] = [];
  /** Optional element ID to scroll to/focus when any link is clicked (e.g. 'sortable-table') */
  @Input() targetId?: string;
  /** Auto-focus the summary on render (recommended for a11y) */
  @Input() autoFocus = true;
  /** If you want to run custom logic (e.g. focus a form field), listen to this */
  //TODO: We should be able to simplify this by using fragment in the template, just ensure targetId matches component IDs
  @Output() itemSelect = new EventEmitter<ErrorItem>();

  @ViewChild('summaryEl')
  private readonly summaryEl?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      setTimeout(() => this.summaryEl?.nativeElement.focus(), 0);
    }
  }

  linkHrefFor(err: ErrorItem): string {
    if (err.href) {
      return err.href;
    }
    return this.targetId ? `#${this.targetId}` : '#';
  }

  onLinkClick(e: Event, err: ErrorItem): void {
    const href = this.linkHrefFor(err);

    // Resolve the actual element id from href like "#standard-applicant"
    const idFromHref =
      href.startsWith('#') && href.length > 1 ? href.slice(1) : undefined;

    // Prefer per-item href target, else fall back to targetId
    const targetId = idFromHref ?? this.targetId;

    const shouldHandleScroll = !!targetId || this.itemSelect.observed;

    if (shouldHandleScroll) {
      e.preventDefault();
    }

    if (this.itemSelect.observed) {
      this.itemSelect.emit(err);
    }

    if (!targetId) {
      return;
    }

    const el = document.getElementById(targetId);
    if (!el) {
      return;
    }

    // Ensure focusable for a11y
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
    }

    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      el.scrollIntoView(true);
    }

    // Focus after scroll
    setTimeout(() => el.focus?.({ preventScroll: true }), 50);
  }
}
