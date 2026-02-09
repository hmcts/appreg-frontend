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
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { Row } from '@core-types/table/row.types';

export interface TableColumn {
  header: string;
  field: string;
  sortable?: boolean;
  numeric?: boolean;
  defaultSort?: 'none' | 'ascending' | 'descending';
  sortValue?: (row: Row) => string | number | null | undefined;
}

@Component({
  selector: 'app-selectable-sortable-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selectable-sortable-table.component.html',
  styleUrl: './selectable-sortable-table.component.scss',
})
export class SelectableSortableTableComponent
  implements AfterViewInit, OnDestroy
{
  @ContentChild('actionsTemplate', { read: TemplateRef })
  actionsTpl?: TemplateRef<unknown>;

  caption = input('');
  columns = input<TableColumn[]>([]);
  data = input<Row[]>([]);

  idField = input.required<string>();

  selectedIds = input<Set<string>>(new Set<string>());
  selectedIdsChange = output<Set<string>>();

  selectedRowsChange = output<Row[]>();

  /** Keep stable across pagination so row checkbox ids are unique */
  idPrefix = input('apps-');

  singleSelect = input(false);

  @ViewChild('mojTable', { static: true })
  tableRef!: ElementRef<HTMLTableElement>;

  private readonly selectedIdsState = signal<Set<string>>(new Set<string>());
  private readonly destroyFns: (() => void)[] = [];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly selectedIdsSync = effect(() => {
    this.selectedIdsState.set(this.selectedIds() ?? new Set<string>());
  });

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Helper to safely grab constructors from either root or default export
    const getCtor = <T>(mdl: unknown, key: string): T | undefined => {
      const root = (mdl ?? {}) as Record<string, unknown>;
      const def = (root['default'] ?? {}) as Record<string, unknown>;
      const candidate = root[key] ?? def[key];
      return typeof candidate === 'function' ? (candidate as T) : undefined;
    };

    // Initialise MOJ SortableTable (OK to keep with Fix B)
    void import('@ministryofjustice/frontend').then((mod) => {
      const SortableCtor = getCtor<
        new (el: HTMLElement) => { init?: () => void; destroy?: () => void }
      >(mod, 'SortableTable');

      if (SortableCtor) {
        const s = new SortableCtor(this.tableRef.nativeElement);
        s.init?.();
        this.destroyFns.push(() => {
          try {
            s.destroy?.();
          } catch {
            /* noop */
          }
        });
      }
    });

    // IMPORTANT: No MultiSelect initialisation, no MutationObserver, no re-init.
  }

  ngOnDestroy(): void {
    while (this.destroyFns.length) {
      const fn = this.destroyFns.pop();
      try {
        fn?.();
      } catch {
        /* noop */
      }
    }
  }

  /** -------- Pure-Angular selection logic (Fix B) -------- */

  /** Ids for the currently rendered (visible) rows */
  get visibleIds(): string[] {
    return (this.data() ?? [])
      .map((row) => this.getRowId(row))
      .filter((id): id is string => !!id);
  }

  /** Are all visible rows selected? */
  get allVisibleSelected(): boolean {
    const ids = this.visibleIds;
    const selected = this.selectedIdsState();
    return ids.length > 0 && ids.every((id) => selected.has(id));
  }

  /** Are some (but not all) visible rows selected? */
  get someVisibleSelected(): boolean {
    const ids = this.visibleIds;
    const selected = this.selectedIdsState();
    return ids.some((id) => selected.has(id));
  }

  /** Toggle selection for every row currently visible on this page */

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
    this.selectedIdsState.set(next);
    this.selectedIdsChange.emit(next);

    this.selectedRowsChange.emit(this.getSelectedRows());

    this.cdr.markForCheck();
  }

  /** Narrow row value to a safe string id */
  private coerceRowId(row: Row): string | null {
    const v = row[this.idField()];
    if (typeof v === 'string') {
      return v;
    }
    if (typeof v === 'number') {
      return String(v);
    }
    if (v instanceof Date) {
      return v.toISOString();
    }
    if (typeof v === 'boolean') {
      return v ? '1' : '0';
    }
    return null;
  }

  isSelected(row: Row): boolean {
    const id = this.getRowId(row);
    return !!id && this.selectedIdsState().has(id);
  }

  get firstColField(): string {
    return this.columns()[0]?.field ?? '';
  }

  getRowId(row: Row): string {
    return this.coerceRowId(row) ?? '';
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

    this.selectedIdsState.set(next);
    this.selectedIdsChange.emit(next);

    this.selectedRowsChange.emit(this.getSelectedRows());

    this.cdr.markForCheck();
  }

  /** Sorting helpers kept for SortableTable */
  private coerceSortValue(raw: unknown): string | number | null {
    if (raw === null) {
      return null;
    }

    if (typeof raw === 'string') {
      return raw;
    }
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : null;
    }
    if (typeof raw === 'boolean') {
      return raw ? 1 : 0;
    }
    if (typeof raw === 'bigint') {
      return raw.toString();
    }
    if (raw instanceof Date) {
      return Number.isNaN(raw.getTime()) ? null : raw.toISOString();
    }

    return null;
  }

  getSortValue(row: Row, col: TableColumn): string | number | null {
    try {
      const raw = col.sortValue
        ? col.sortValue(row)
        : (row as Record<string, unknown>)[col.field];
      return this.coerceSortValue(raw);
    } catch {
      return null;
    }
  }

  getSelectedRows(): Row[] {
    const ids = Array.from(this.selectedIdsState());
    return ids
      .map((id) => (this.data() ?? []).find((r) => this.getRowId(r) === id))
      .filter((r): r is Row => !!r);
  }
}
