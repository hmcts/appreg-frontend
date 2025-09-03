import { CommonModule } from '@angular/common';
import { Component, ContentChild, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-sortable-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sortable-table.component.html',
})
export class SortableTableComponent implements OnChanges {
  @ContentChild('actionsTemplate', { read: TemplateRef }) actionsTpl?: TemplateRef<never>;

  /** Table caption */
  @Input() caption = '';

  /** Column definitions */
  @Input() columns: {
    header: string;
    field: string;
    sortable?: boolean;
    numeric?: boolean;
  }[] = [];

  /** Row data */
  @Input() data: never[] = [];

  /** Internal copy that we sort */
  sortedData: never[] = [];

  /** Which field are we sorting on? */
  sortField?: string;

  /** Current direction */
  sortDir: SortDirection = 'asc';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      // whenever the input data changes, reset our sortedData
      this.sortedData = [...this.data];
      if (this.sortField) {
        this.applySort();
      }
    }
  }

  onHeaderClick(col: { field: string; sortable?: boolean }): void {
    if (!col.sortable) {return;}
    if (this.sortField === col.field) {
      // flip direction
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      // new column → always start asc
      this.sortField = col.field;
      this.sortDir = 'asc';
    }
    this.applySort(); // your existing sort logic
  }

  private applySort() {
    const field = this.sortField!;
    const dir = this.sortDir === 'asc' ? 1 : -1;

    this.sortedData.sort((a, b) => {
      const x = a[field];
      const y = b[field];

      // null/undefined first
      if (x === null) {return -1 * dir;}
      if (y === null) {return 1 * dir;}

      // numeric sort if both are numbers
      if (typeof x === 'number' && typeof y === 'number') {
        return (x - y) * dir;
      }

      // fallback to string
      return String(x).localeCompare(String(y)) * dir;
    });
  }
}
