import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  Inject,
  Input,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
} from '@angular/core';

type RowLike = Record<string, unknown>;

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

  @Input() caption = '';
  @Input() columns: TableColumn[] = [];
  @Input() data: RowLike[] = [];

  /** Optional id field / custom trackBy, kept from your original component */
  @Input() idField?: string;
  @Input() trackBy?: (index: number, row: RowLike) => unknown;

  @ViewChild('mojTable', { static: true })
  tableRef!: ElementRef<HTMLTableElement>;

  private sortableInstance?: { init?: () => void; destroy?: () => void };

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  /** trackBy helper retained for performance */
  trackRow = (index: number, row: RowLike): unknown => {
    if (this.trackBy) {
      return this.trackBy(index, row);
    }
    if (this.idField && this.idField in row) {
      return row[this.idField];
    }
    return index;
    // same behaviour you had before
  };

  /** Value for data-sort-value (used by MoJ Sortable table) */
  getSortValue(row: RowLike, col: TableColumn): string | null {
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
        type SortableCtorT = new (el: HTMLElement) => { init?: () => void; destroy?: () => void };

        // Support both export shapes (named vs default)
        const SortableCtor: SortableCtorT | undefined =
          (mod as { SortableTable?: SortableCtorT }).SortableTable ??
          (mod as { default?: { SortableTable?: SortableCtorT } }).default?.SortableTable;

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
