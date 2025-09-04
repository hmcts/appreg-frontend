import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChild,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';

type SortDirection = 'asc' | 'desc';
type RowLike = Record<string, unknown>;

@Component({
  selector: 'app-sortable-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sortable-table.component.html',
})
export class SortableTableComponent implements OnChanges {
  @ContentChild('actionsTemplate', { read: TemplateRef })
  actionsTpl?: TemplateRef<unknown>;

  /** Table caption */
  @Input() caption = '';

  /** Column definitions */
  @Input() columns: {
    header: string;
    field: string;
    sortable?: boolean;
    numeric?: boolean;
  }[] = [];

  /** Row data (generic objects, not `never[]`) */
  @Input() data: RowLike[] = [];

  /** Internal copy that we sort */
  sortedData: RowLike[] = [];

  /** Which field are we sorting on? */
  sortField?: string;

  /** Current direction */
  sortDir: SortDirection = 'asc';

  /** Optional key name to use for tracking rows */
  @Input() idField?: string;

  /** Optional custom trackBy callback (index, row) => key */
  @Input() trackBy?: (index: number, row: RowLike) => unknown;

  /**
   * Helper for `@for (...; track trackRow($index, row))`.
   * Prefers `trackBy`, then `idField`, then `$index`.
   */
  trackRow = (index: number, row: RowLike): unknown => {
    if (this.trackBy) {
      return this.trackBy(index, row);
    }
    if (this.idField && this.idField in row) {
      return row[this.idField];
    }
    return index;
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.sortedData = [...this.data];
      if (this.sortField) {
        this.applySort();
      }
    }
  }

  onHeaderClick(col: { field: string; sortable?: boolean }): void {
    if (!col.sortable) {
      return; // braces added to satisfy `curly`
    }

    if (this.sortField === col.field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = col.field;
      this.sortDir = 'asc';
    }
    this.applySort();
  }

  private applySort(): void {
    const field = this.sortField;
    if (!field) {
      return; // guard instead of using non-null assertion
    }

    const dir = this.sortDir === 'asc' ? 1 : -1;

    this.sortedData.sort((a: RowLike, b: RowLike) => {
      const x = a[field];
      const y = b[field];

      const xNull = x === null || x === undefined;
      const yNull = y === null || y === undefined;
      if (xNull && !yNull) {
        return -1 * dir;
      }
      if (!xNull && yNull) {
        return 1 * dir;
      }
      if (xNull && yNull) {
        return 0;
      }

      if (typeof x === 'number' && typeof y === 'number') {
        return (x - y) * dir;
      }

      return String(x).localeCompare(String(y)) * dir;
    });
  }
}
