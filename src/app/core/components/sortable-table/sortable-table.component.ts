/**
 * Depends on `@ministryofjustice/frontend` `SortableTable` for sortable header UI/interactions
 * Sorting mode is controlled by `clientOrServerSort`:
 * client sorts in-browser via `data-sort-value` from `getSortValue()`
 * server keeps the same UI but emits `sortChange` for parent-side fetch/sort.
 */

import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  contentChild,
  inject,
  input,
  output,
  signal,
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

  readonly dateTpl = contentChild<TemplateRef<unknown>>('dateTemplate');

  caption = input('');
  captionSize = input<'s' | 'm' | 'l'>('m');
  hiddenCaption = input(false);
  columns = input<TableColumn[]>([]);
  data = input<Row[]>([]);

  dateFieldIdentifier = input<string>();

  // Table sort: server side
  // Make sure to set default key and direction in page component
  sortKey = input<string>('');
  sortDirection = input<'desc' | 'asc'>('desc');
  clientOrServerSort = input<'server' | 'client'>('client');

  sortChange = output<{
    key: string;
    direction: 'desc' | 'asc';
  }>();

  /** Optional id field / custom trackBy, kept from your original component */
  idField = input<string | undefined>(undefined);
  trackBy = input<((index: number, row: Row) => unknown) | undefined>(
    undefined,
  );
  @ViewChild('mojTable', { static: true })
  tableRef!: ElementRef<HTMLTableElement>;

  private sortableInstance?: { init?: () => void; destroy?: () => void };
  private serverSortClickHandler?: (event: Event) => void;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly sortKeyState = signal<string>('');
  private readonly sortDirectionState = signal<'desc' | 'asc'>('desc');

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

  /** Value for data-sort-value (used by MoJ Sortable table)
   * Client side sorting
   */
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
      { key: this.sortKeyState(), direction: this.sortDirectionState() },
      key,
    );

    this.sortKeyState.set(next.key);
    this.sortDirectionState.set(next.direction);

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
      { key: this.sortKeyState(), direction: this.sortDirectionState() },
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
        const column = this.columns()[heading.cellIndex];
        if (!column || column.sortable === false) {
          return;
        }

        const next: { key: string; direction: 'asc' | 'desc' } = {
          key: column.field,
          direction: direction === 'ascending' ? 'asc' : 'desc',
        };
        this.sortKeyState.set(next.key);
        this.sortDirectionState.set(next.direction);
        this.sortChange.emit(next);
      });
    };

    this.tableRef.nativeElement.addEventListener(
      'click',
      this.serverSortClickHandler,
    );
  }
}
