import { Directive, computed, signal } from '@angular/core';

import { UpdateOfficialsApplication } from './update-officials.types';

import { sortRows } from '@util/table-sort';

@Directive()
export abstract class UpdateOfficialsTableBase {
  protected abstract rows: UpdateOfficialsApplication[];
  protected readonly pageSize = 10;
  readonly currentPage = signal(0);
  readonly totalPages = computed(() =>
    Math.ceil(this.rows.length / this.pageSize),
  );
  readonly officialSort = signal<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc',
  });
  readonly showPagination = computed(() => this.rows.length > this.pageSize);
  readonly sortedRows = computed(() => {
    const { key, direction } = this.officialSort();
    return key ? sortRows(this.rows, { key, direction }) : this.rows;
  });
  readonly paginatedRows = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.sortedRows().slice(start, start + this.pageSize);
  });

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    this.officialSort.set(sort);
    this.currentPage.set(0);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
