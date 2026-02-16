import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  contentChild,
  inject,
  input,
} from '@angular/core';

import { Row } from '@core-types/table/row.types';

/** The column contract for this table */
export type TableColumn = {
  header: string;
  field: string;
  numeric?: boolean;
  sortable?: boolean;
  sortValue?: (
    row: Record<string, unknown>,
  ) => string | number | null | undefined;
  defaultSort?: 'ascending' | 'descending' | 'none';
};

@Component({
  selector: 'app-sortable-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sortable-table.component.html',
})
export class SortableTableComponent implements AfterViewInit {
  @ContentChild('actionsTemplate', { read: TemplateRef })
  actionsTpl?: TemplateRef<unknown>;

  readonly dateTpl = contentChild<TemplateRef<unknown>>('dateTemplate');

  caption = input('');
  hiddenCaption = input(false);
  columns = input<TableColumn[]>([]);
  data = input<Row[]>([]);

  /** Optional id field / custom trackBy, kept from your original component */
  idField = input<string | undefined>(undefined);
  trackBy = input<((index: number, row: Row) => unknown) | undefined>(
    undefined,
  );
  @ViewChild('mojTable', { static: true })
  tableRef!: ElementRef<HTMLTableElement>;

  private sortableInstance?: { init?: () => void; destroy?: () => void };

  private readonly platformId = inject(PLATFORM_ID);

  /** trackBy helper retained for performance */
  trackRow = (index: number, row: Row): unknown => {
    const trackBy = this.trackBy();
    if (trackBy) {
      return trackBy(index, row);
    }
    const idField = this.idField();
    if (idField && idField in row) {
      return row[idField];
    }
    return index;
    // same behaviour you had before
  };

  /** Value for data-sort-value (used by MoJ Sortable table) */
  getSortValue(row: Row, col: TableColumn): string | null {
    const candidate: unknown = col.sortValue
      ? col.sortValue(row)
      : row[col.field];

    if (candidate === null) {
      return null; // nothing to sort on
    }
    if (typeof candidate === 'number') {
      return String(candidate);
    }
    if (typeof candidate === 'string') {
      return candidate;
    }
    if (candidate instanceof Date) {
      return candidate.toISOString();
    }
    if (typeof candidate === 'boolean') {
      return candidate ? '1' : '0';
    }

    // Any other object/array -> don't emit a sort value (avoids [object Object])
    return null;
  }

  /** Initialise the MoJ SortableTable JS for this table only */
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    void import('@ministryofjustice/frontend')
      .then((mod) => {
        type SortableCtorT = new (el: HTMLElement) => {
          init?: () => void;
          destroy?: () => void;
        };

        // Support both export shapes (named vs default)
        const SortableCtor: SortableCtorT | undefined =
          (mod as { SortableTable?: SortableCtorT }).SortableTable ??
          (mod as { default?: { SortableTable?: SortableCtorT } }).default
            ?.SortableTable;

        if (!SortableCtor) {
          return;
        }

        const instance = new SortableCtor(this.tableRef.nativeElement);
        instance.init?.();
        this.sortableInstance = instance;
      })
      .catch(() => {
        // no-op for non-browser/test environments
      });
  }
}
