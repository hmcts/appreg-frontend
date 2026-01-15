import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  TemplateRef,
} from '@angular/core';

type AccessorFn<T> = (row: T, rowIndex: number) => unknown;
type KeyOf<T> = Extract<keyof T, string>;

export interface ColumnDef<T = unknown> {
  /** Column header text */
  header: string;
  /** How to get the cell value: a key, a dotted path ("person.name"), or a function */
  accessor?: KeyOf<T> | string | AccessorFn<T>;
  /** Optional custom cell template (receives value + row/col context) */
  cellTemplate?: TemplateRef<CellContext<T>>;
  headerClass?: string;
  cellClass?: string;
}

export interface CellContext<T = unknown> {
  $implicit: unknown; // the value
  row: T;
  col: ColumnDef<T>;
  rowIndex: number;
  colIndex: number;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T = unknown> {
  /** Table caption and classes */
  @Input() caption = '';
  @Input() captionClass = 'govuk-table__caption govuk-table__caption--m';

  /** GOV.UK table classes overridable if needed */
  @Input() tableClass = 'govuk-table';

  /** Column definitions (optional; will auto-generate from first row if omitted) */
  @Input() columns: ColumnDef<T>[] = [];

  /** Data rows */
  @Input() rows: T[] = [];

  /** Auto-generate columns using keys of the first row when no columns are provided */
  @Input() autoGenerateColumns = true;

  get cols(): ColumnDef<T>[] {
    if (this.columns?.length) {
      return this.columns;
    }
    if (!this.autoGenerateColumns || !this.rows?.length) {
      return [];
    }
    const first = this.rows[0] as Record<string, unknown>;
    return Object.keys(first).map((k) => ({
      header: this.humanize(k),
      accessor: k as KeyOf<T> | string,
    }));
  }

  valueOf(row: T, col: ColumnDef<T>, rowIndex: number): unknown {
    const acc = col.accessor;

    if (typeof acc === 'function') {
      return acc(row, rowIndex);
    }

    if (typeof acc === 'string') {
      // works for single keys and dotted paths
      return this.readPath(row, acc);
    }

    // No accessor: return the whole row
    return row;
  }

  private readPath(obj: unknown, path: string): unknown {
    if (obj === null || obj === undefined) {
      return undefined;
    }
    const parts = path.split('.');
    let current: unknown = obj;

    for (const key of parts) {
      if (
        current !== null &&
        typeof current === 'object' &&
        key in (current as Record<string, unknown>)
      ) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  private humanize(key: string): string {
    return key
      .replaceAll(/[_-]+/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim()
      .replaceAll(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
  }
}
