/**
 * Depends on `@ministryofjustice/frontend` `SortableTable` for sortable header UI/interactions
 * Sorting mode is controlled by `clientOrServerSort`:
 * client sorts in-browser via `data-sort-value` from `getSortValue()`
 * server keeps the same UI but emits `sortChange` for parent-side fetch/sort.
 */

import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  computed,
  contentChild,
  effect,
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
  styleUrl: './sortable-table.component.scss',
})
export class SortableTableComponent implements AfterViewInit, OnDestroy {
  @ContentChild('actionsTemplate', { read: TemplateRef })
  actionsTpl?: TemplateRef<unknown>;

  readonly dateTpl = contentChild<TemplateRef<unknown>>('dateTemplate');

  caption = input('');
  captionId = computed(() => {
    const text = this.caption() ?? '';

    let s = text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '');

    while (s.endsWith('-')) {
      s = s.slice(0, -1);
    }

    if (s.length && s[0] >= '0' && s[0] <= '9') {
      s = `a${s}`;
    }

    return s;
  });
  captionSize = input<'s' | 'm' | 'l'>('m');
  hiddenCaption = input(false);
  columns = input<TableColumn[]>([]);
  data = input<Row[]>([]);

  dateFieldIdentifier = input<string>('date');

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
  selectable = input(false);
  selectedIds = input<Set<string>>(new Set<string>());
  selectedIdsChange = output<Set<string>>();
  selectedRowsChange = output<Row[]>();
  idPrefix = input('apps-');
  singleSelect = input(false);

  @ViewChild('mojTable', { static: true })
  tableRef!: ElementRef<HTMLTableElement>;

  private sortableInstance?: { init?: () => void; destroy?: () => void };
  private serverSortClickHandler?: (event: Event) => void;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sortKeyState = signal<string>('');
  private readonly sortDirectionState = signal<'desc' | 'asc'>('desc');
  private readonly selectedIdsState = signal<Set<string>>(new Set<string>());
  private readonly selectedIdsSync = effect(() => {
    this.selectedIdsState.set(this.selectedIds() ?? new Set<string>());
  });

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

  get visibleIds(): string[] {
    return (this.data() ?? [])
      .map((row) => this.getRowId(row))
      .filter((id): id is string => !!id);
  }

  get allVisibleSelected(): boolean {
    const ids = this.visibleIds;
    const selected = this.selectedIdsState();
    return ids.length > 0 && ids.every((id) => selected.has(id));
  }

  get someVisibleSelected(): boolean {
    const ids = this.visibleIds;
    const selected = this.selectedIdsState();
    return ids.some((id) => selected.has(id));
  }

  get firstColField(): string {
    return this.columns()[0]?.field ?? '';
  }

  isSelected(row: Row): boolean {
    const id = this.getRowId(row);
    return !!id && this.selectedIdsState().has(id);
  }

  getRowId(row: Row): string {
    return this.coerceRowId(row) ?? '';
  }

  toggleSelectAllVisible(checked: boolean): void {
    if (this.singleSelect()) {
      return;
    }
    const next = new Set(this.selectedIdsState());
    for (const id of this.visibleIds) {
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
    }
    this.updateSelection(next);
  }

  toggleOne(row: Row, checked: boolean): void {
    const id = this.getRowId(row);
    if (!id) {
      return;
    }

    let next: Set<string>;
    if (this.singleSelect()) {
      next = new Set<string>();
      if (checked) {
        next.add(id);
      }
    } else {
      next = new Set(this.selectedIdsState());
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
    }

    this.updateSelection(next);
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
        if (this.clientOrServerSort() === 'server') {
          // keep MoJ button UI but prevent in-browser row reordering for server mode
          if (typeof instance.sort === 'function') {
            instance.sort = (...args: unknown[]) => args[0];
          }
          if (typeof instance.addRows === 'function') {
            instance.addRows = () => undefined;
          }
          // use MoJ button clicks to emit server-side sort events
          this.attachServerSortListener();
        }
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
        const columnIndex = this.selectable()
          ? heading.cellIndex - 1
          : heading.cellIndex;
        const column = this.columns()[columnIndex];
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

  private coerceRowId(row: Row): string | null {
    const idField = this.idField();
    if (!idField) {
      return null;
    }

    const value = row[idField];
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }

    return null;
  }

  private updateSelection(next: Set<string>): void {
    this.selectedIdsState.set(next);
    this.selectedIdsChange.emit(next);
    this.selectedRowsChange.emit(this.getSelectedRows());
    this.cdr.markForCheck();
  }

  private getSelectedRows(): Row[] {
    const ids = Array.from(this.selectedIdsState());
    return ids
      .map((id) => (this.data() ?? []).find((row) => this.getRowId(row) === id))
      .filter((row): row is Row => !!row);
  }
}
