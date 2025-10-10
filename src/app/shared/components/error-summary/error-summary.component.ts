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
  @Output() itemSelect = new EventEmitter<ErrorItem>();

  @ViewChild('summaryEl') private summaryEl?: ElementRef<HTMLDivElement>;

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
    // If a consumer is listening OR a targetId is set, prevent default to handle smooth scroll/focus.
    if (this.itemSelect.observers.length || this.targetId) {
      e.preventDefault();
    }

    // 1) Emit to parent first (lets forms implement field focusing)
    if (this.itemSelect.observers.length) {
      this.itemSelect.emit(err);
    }

    // 2) If a target is specified, scroll/focus it (e.g. your sortable table section)
    if (this.targetId) {
      const el = document.getElementById(this.targetId);
      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {
          el.scrollIntoView(true);
        }
        setTimeout(() => el.focus?.({ preventScroll: true }), 50);
      }
    }
  }
}
