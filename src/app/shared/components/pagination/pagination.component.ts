import { Component, EventEmitter, Input, Output } from '@angular/core';

type PageItem = number | '…';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  @Input() currentPage = 1; // 1-based
  @Input() totalPages = 1;

  @Output() pageChange = new EventEmitter<number>();

  get pageList(): PageItem[] {
    const total = this.totalPages || 0;
    const current = this.currentPage || 1;

    if (total <= 0) {
      return [];
    }

    // Show all when number is small
    if (total <= 10) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const first = 1;
    const last = total;
    const windowSize = 5; // pages either side of current
    const items: PageItem[] = [];

    const windowStart = Math.max(first + 1, current - windowSize);
    const windowEnd = Math.min(last - 1, current + windowSize);

    items.push(first);

    if (windowStart > first + 1) {
      items.push('…');
    }

    for (let p = windowStart; p <= windowEnd; p++) {
      items.push(p);
    }

    if (windowEnd < last - 1) {
      items.push('…');
    }

    items.push(last); // always show last

    return items;
  }

  onPageClick(item: PageItem, event: MouseEvent): void {
    event.preventDefault();
    if (typeof item === 'number') {
      this.goTo(item);
    }
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.pageChange.emit(page);
  }

  prevEnabled(): boolean {
    return this.currentPage > 1;
  }

  nextEnabled(): boolean {
    return this.currentPage < this.totalPages;
  }
}
