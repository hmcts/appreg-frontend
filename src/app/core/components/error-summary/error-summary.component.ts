import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

export type ErrorItem = { text: string; href?: string; id?: string };

@Component({
  selector: 'app-error-summary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: 'error-summary.component.html',
})
export class ErrorSummaryComponent {
  /** Heading text (defaults to GOV.UK copy) */
  title = input('There is a problem');
  /** List of error items; if an item has no href and targetId is provided, a hash link is used */
  items = input<ErrorItem[]>([]);
  /** Optional element ID to scroll to/focus when any link is clicked (e.g. 'sortable-table') */
  targetId = input<string>();
  /** Auto-focus the summary on render (recommended for a11y) */
  autoFocus = input(true);
  /** Optional submit/error cycle key to refocus even when items have not changed */
  focusKey = input<number>(0);
  /** If you want to run custom logic (e.g. focus a form field), listen to this */
  itemSelect = output<ErrorItem>();
  /** Prevent native/router hash scrolling when the parent handles focus/scroll manually. */
  preventFragmentNavigation = input(false);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly summaryEl =
    viewChild<ElementRef<HTMLDivElement>>('summaryEl');
  private lastFocusedItemsKey = '';
  private lastFocusedCycleKey = '';

  constructor() {
    effect(() => {
      const summaryEl = this.summaryEl()?.nativeElement;
      const items = this.items();
      const focusKey = this.focusKey();

      if (!items.length) {
        this.lastFocusedItemsKey = '';
        this.lastFocusedCycleKey = '';
        return;
      }

      if (
        !summaryEl ||
        !this.autoFocus() ||
        !isPlatformBrowser(this.platformId)
      ) {
        return;
      }

      const itemsKey = items
        .map(({ text, href, id }) => `${text}|${href ?? ''}|${id ?? ''}`)
        .join('||');
      const cycleKey =
        focusKey === undefined || focusKey === null ? '' : String(focusKey);

      if (
        itemsKey === this.lastFocusedItemsKey &&
        cycleKey === this.lastFocusedCycleKey
      ) {
        return;
      }

      this.lastFocusedItemsKey = itemsKey;
      this.lastFocusedCycleKey = cycleKey;
      setTimeout(() => {
        summaryEl.focus();
        summaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    });
  }

  onItemClick(event: MouseEvent, item: ErrorItem): void {
    const isFragmentLink = !!this.fragmentTarget(item);

    if (isFragmentLink && this.preventFragmentNavigation()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    this.itemSelect.emit(item);
  }

  fragmentTarget(item: ErrorItem): string | undefined {
    if (item.href) {
      return item.href.startsWith('#') ? item.href.slice(1) : undefined;
    }

    return item.id ? item.id : (this.targetId() ?? undefined);
  }

  fragmentHref(item: ErrorItem): string | undefined {
    const target = this.fragmentTarget(item);
    return target ? `#${target}` : undefined;
  }
}
