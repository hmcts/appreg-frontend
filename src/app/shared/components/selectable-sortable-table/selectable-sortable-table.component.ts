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
} from '@angular/core';

type Row = Record<string, unknown>;

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
})
export class SelectableSortableTableComponent
  implements AfterViewInit, OnDestroy
{
  @ContentChild('actionsTemplate', { read: TemplateRef })
  actionsTpl?: TemplateRef<unknown>;

  @Input() caption = '';
  @Input() columns: TableColumn[] = [];
  @Input() data: Row[] = [];

  @Input({ required: true }) idField!: string;

  @Input() selectedIds: Set<string> = new Set<string>();
  @Output() selectedIdsChange = new EventEmitter<Set<string>>();

  @Input() idPrefix = 'row-';

  @ViewChild('mojTable', { static: true })
  tableRef!: ElementRef<HTMLTableElement>;

  private destroyFns: (() => void)[] = [];
  private rowObserver?: MutationObserver;
  private multiSelectInited = false;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Safe helper for grabbing Ctors from either root or default export
    const getCtor = <T>(mdl: unknown, key: string): T | undefined => {
      const root = (mdl ?? {}) as Record<string, unknown>;
      const def = (root['default'] ?? {}) as Record<string, unknown>;
      const candidate = root[key] ?? def[key];
      return typeof candidate === 'function' ? (candidate as T) : undefined;
    };

    // Always set up Sortable immediately (works with empty body)
    void import('@ministryofjustice/frontend').then((mod) => {
      const SortableCtor = getCtor<
        new (el: HTMLElement) => {
          init?: () => void;
          destroy?: () => void;
        }
      >(mod, 'SortableTable');
      if (SortableCtor) {
        const s = new SortableCtor(this.tableRef.nativeElement);
        s.init?.();
        this.destroyFns.push(() => {
          try {
            s.destroy?.();
          } catch {
            /* empty */
          }
        });
      }
    });

    // Defer MultiSelect until a row checkbox actually exists
    const ensureMultiSelect = async () => {
      if (this.multiSelectInited) {
        return;
      }
      const hasRowBox = !!this.tableRef.nativeElement.querySelector(
        '.moj-multi-select__checkbox .govuk-checkboxes__input',
      );
      if (!hasRowBox) {
        return;
      }

      const mod = await import('@ministryofjustice/frontend');
      const root = (mod ?? {}) as Record<string, unknown>;
      const def = (root['default'] ?? {}) as Record<string, unknown>;
      const MultiSelectCtor = (root['MultiSelect'] ?? def['MultiSelect']) as
        | (new (
            el: HTMLElement,
            opts?: { idPrefix?: string },
          ) => { init?: () => void; destroy?: () => void })
        | undefined;

      if (!MultiSelectCtor) {
        return;
      }

      const m = new MultiSelectCtor(this.tableRef.nativeElement, {
        idPrefix: this.idPrefix,
      });
      m.init?.();
      this.multiSelectInited = true;

      // Keep App state in sync with DOM after MOJ toggles select-all/rows
      const syncSelectedFromDOM = () => {
        const boxes =
          this.tableRef.nativeElement.querySelectorAll<HTMLInputElement>(
            'tbody input.govuk-checkboxes__input',
          );
        const next = new Set<string>();
        boxes.forEach((box) => {
          if (box.checked) {
            const idAttr = box.id || '';
            if (idAttr.startsWith(this.idPrefix)) {
              next.add(idAttr.slice(this.idPrefix.length));
            }
          }
        });
        const changed =
          next.size !== this.selectedIds.size ||
          [...next].some((id) => !this.selectedIds.has(id));
        if (changed) {
          this.selectedIds = next;
          this.selectedIdsChange.emit(next);
        }
      };
      const onAnyChange = () => queueMicrotask(syncSelectedFromDOM);
      this.tableRef.nativeElement.addEventListener('change', onAnyChange);
      this.tableRef.nativeElement.addEventListener('click', onAnyChange);

      this.destroyFns.push(() => {
        try {
          this.tableRef.nativeElement.removeEventListener(
            'change',
            onAnyChange,
          );
          this.tableRef.nativeElement.removeEventListener('click', onAnyChange);
          m.destroy?.();
        } catch {
          /* empty */
        }
      });
    };

    // Observe rows; as soon as a checkbox appears, init MultiSelect once
    const tbody =
      this.tableRef.nativeElement.tBodies[0] ?? this.tableRef.nativeElement;
    this.rowObserver = new MutationObserver(() => {
      void ensureMultiSelect();
    });
    this.rowObserver.observe(tbody, { childList: true, subtree: true });

    // Try immediately too (covers SSR / fast API cases)
    void ensureMultiSelect();
  }

  ngOnDestroy(): void {
    this.rowObserver?.disconnect();
    while (this.destroyFns.length) {
      const fn = this.destroyFns.pop();
      try {
        fn?.();
      } catch {
        /* empty */
      }
    }
  }

  /** Narrow row value to a safe string id */
  private coerceRowId(row: Row): string | null {
    const v = row[this.idField];
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
    const id = this.coerceRowId(row);
    return !!id && this.selectedIds.has(id);
  }

  get firstColField(): string {
    return this.columns[0]?.field ?? '';
  }

  getRowId(row: Row): string {
    return this.coerceRowId(row) ?? '';
  }

  toggleOne(row: Row, checked: boolean): void {
    const id = this.getRowId(row);
    if (!id) {
      return;
    }
    const next = new Set(this.selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.selectedIds = next;
    this.selectedIdsChange.emit(next);
  }

  private coerceSortValue(raw: unknown): string | number | null {
    if (raw === null) {
      return null;
    }

    // primitives
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

    // well-known objects
    if (raw instanceof Date) {
      return isNaN(raw.getTime()) ? null : raw.toISOString();
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
}
