import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  input,
} from '@angular/core';

import { Row } from '@core-types/table/row.types';
import {
  ariaSortFor as ariaSortForUtil,
  getNextSortState,
  isSortActivationKey,
  suppressSortEvent,
} from '@util/table-sort';

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
export class SortableTableComponent implements AfterViewInit, OnDestroy {
  @ContentChild('actionsTemplate', { read: TemplateRef })
  actionsTpl?: TemplateRef<unknown>;

  @Input() caption = '';
  @Input() hiddenCaption = false;
  @Input() columns: TableColumn[] = [];
  @Input() data: Row[] = [];

  // Table sort
  @Input() sortKey: string = 'date';
  @Input() sortDirection: 'desc' | 'asc' = 'desc';
  clientOrServerSort = input<'server' | 'client'>('client');

  @Output() sortChange = new EventEmitter<{
    key: string;
    direction: 'desc' | 'asc';
  }>();

  /** Optional id field / custom trackBy, kept from your original component */
  @Input() idField?: string;
  @Input() trackBy?: (index: number, row: Row) => unknown;
  @ViewChild('mojTable', { static: true })
  tableRef!: ElementRef<HTMLTableElement>;

  private sortableInstance?: { init?: () => void; destroy?: () => void };
  private serverSortClickHandler?: (event: Event) => void;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  /** trackBy helper retained for performance */
  trackRow = (index: number, row: Row): unknown => {
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
    if (this.clientOrServerSort() !== 'server') {
      return;
    }

    void import('@ministryofjustice/frontend')
      .then((mod) => {
        type SortableCtorT = new (el: HTMLElement) => {
          init?: () => void;
          destroy?: () => void;
          sort?: (...args: unknown[]) => unknown;
          addRows?: (...args: unknown[]) => void;
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
        // keep moj UI but prevent client-side sorting
        if (typeof instance.sort === 'function') {
          instance.sort = (...args: unknown[]) => args[0];
        }
        if (typeof instance.addRows === 'function') {
          instance.addRows = () => undefined;
        }
        // moj button clicks for server side sorting
        this.attachServerSortListener();
        instance.init?.();
        this.sortableInstance = instance;
      })
      .catch(() => {
        // no-op for non-browser/test environments
      });
  }

  ngOnDestroy(): void {
    if (this.serverSortClickHandler) {
      // Remove delegated click handler
      this.tableRef.nativeElement.removeEventListener(
        'click',
        this.serverSortClickHandler,
      );
      this.serverSortClickHandler = undefined;
    }
    this.sortableInstance?.destroy?.();
  }

  onHeaderClick(
    event: Event | null,
    col: { field: string; sortable?: boolean },
  ): void {
    if (col.sortable === false) {
      return;
    }

    // Prevent native sort handler
    suppressSortEvent(event);

    const key = col.field;

    const next = getNextSortState(
      { key: this.sortKey, direction: this.sortDirection },
      key,
    );

    this.sortKey = next.key;
    this.sortDirection = next.direction;

    if (this.clientOrServerSort() === 'server') {
      this.sortChange.emit(next);
    }
  }

  // SQ complains about not having a keydown tag in template
  onHeaderKeydown(
    event: KeyboardEvent,
    col: { field: string; sortable?: boolean },
  ): void {
    if (col.sortable === false) {
      return;
    }

    if (!isSortActivationKey(event)) {
      return;
    }

    event.preventDefault();
    this.onHeaderClick(event, col);
  }

  ariaSortFor(key: string): 'ascending' | 'descending' | 'none' {
    return ariaSortForUtil(
      { key: this.sortKey, direction: this.sortDirection },
      key,
      'none',
    );
  }

  private attachServerSortListener(): void {
    if (this.serverSortClickHandler) {
      return;
    }

    this.serverSortClickHandler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const heading = target?.closest('th') as HTMLTableCellElement | null;
      if (!heading?.hasAttribute('aria-sort')) {
        return;
      }

      // moj updates aria-sort after handling the click
      queueMicrotask(() => {
        const direction = heading.getAttribute('aria-sort');
        if (direction !== 'ascending' && direction !== 'descending') {
          return;
        }
        const column = this.columns[heading.cellIndex];
        if (!column || column.sortable === false) {
          return;
        }

        const next: { key: string; direction: 'asc' | 'desc' } = {
          key: column.field,
          direction: direction === 'ascending' ? 'asc' : 'desc',
        };
        this.sortKey = next.key;
        this.sortDirection = next.direction;
        this.sortChange.emit(next);
      });
    };

    this.tableRef.nativeElement.addEventListener(
      'click',
      this.serverSortClickHandler,
    );
  }
}
