import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  /** Zero‑based or one‑based? We’ll assume 1-based pages. */
  @Input() currentPage = 1;
  @Input() totalPages = 1;

  /** If you want a custom list of pages (e.g. [1,2,3,4,5]), pass it in; otherwise we generate [1..totalPages] */
  @Input() pages: number[] | null = null;

  /** Emitted when the user clicks a new page */
  @Output() pageChange = new EventEmitter<number>();

  get pageList(): number[] {
    if (this.pages?.length) {
      return this.pages;
    }
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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
