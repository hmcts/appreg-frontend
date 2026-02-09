import { Component, input, output } from '@angular/core';

type PageItem = number | '…';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  currentPage = input(1); // 1-based
  totalPages = input(1);
  paginationLimit = input(7); // Configurable pagination limit

  pageChange = output<number>();

  get pageList(): PageItem[] {
    const total = this.totalPages() || 0;
    const current = this.currentPage() || 1;

    if (total <= 0) {
      return [];
    }

    // For a small number of pages, just show them all.
    if (total <= this.paginationLimit()) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const first = 1;
    const last = total;

    // 1st case: first couple pages, ellipsis and then final number
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '…', last];
    }

    // 2nd case: first page, ellipsis and then final numbers
    if (current >= total - 3) {
      return [first, '…', last - 4, last - 3, last - 2, last - 1, last];
    }

    // 3rd case: ellipsis on either end
    return [first, '…', current - 1, current, current + 1, '…', last];
  }

  onPageClick(item: PageItem, event: MouseEvent): void {
    event.preventDefault();
    if (typeof item === 'number') {
      this.goTo(item);
    }
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.pageChange.emit(page);
  }

  prevEnabled(): boolean {
    return this.currentPage() > 1;
  }

  nextEnabled(): boolean {
    return this.currentPage() < this.totalPages();
  }
}
