import { Directive, computed, signal } from '@angular/core';

import { sortRows } from '@util/table-sort';

@Directive()
export abstract class ResultSelectedTableBase<
  T extends Record<string, unknown>,
> {
  private readonly rowsState = signal<T[]>([]);

  get rows(): T[] {
    return this.rowsState();
  }

  set rows(rows: T[]) {
    this.rowsState.set(rows);
  }

  readonly pageSize = 10;
  readonly currentPage = signal(0);
  readonly resultSort = signal<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc',
  });
  readonly totalPages = computed(() =>
    Math.ceil(this.rowsState().length / this.pageSize),
  );
  readonly sortedRows = computed(() => {
    const { key, direction } = this.resultSort();
    const rows = this.rowsState();

    return key ? sortRows(rows, { key, direction }) : rows;
  });
  readonly paginatedRows = computed(() => {
    const start = this.currentPage() * this.pageSize;

    return this.sortedRows().slice(start, start + this.pageSize);
  });

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.resultSort.set(sort);
    this.currentPage.set(0);
  }
}
