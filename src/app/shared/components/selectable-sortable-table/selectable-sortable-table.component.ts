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

export type TableColumn = {
  header: string;
  field: string;
  numeric?: boolean;
  sortable?: boolean;
  sortValue?: (row: Row) => string | number | null | undefined;
  defaultSort?: 'ascending' | 'descending' | 'none';
};

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

  /** required so we can key the checkboxes and selection state */
  @Input({ required: true }) idField!: string;

  /** preselected ids and change output */
  @Input() selectedIds: Set<string> = new Set<string>();
  @Output() selectedIdsChange = new EventEmitter<Set<string>>();

  /** optional: customise id prefix used by MoJ MultiSelect */
  @Input() idPrefix = 'row-';

  @ViewChild('mojTable', { static: true })
  tableRef!: ElementRef<HTMLTableElement>;

  private destroyFns: (() => void)[] = [];

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  /** Narrow row value to a safe string id (avoid no-base-to-string) */
  private coerceRowId(row: Row): string | null {
    const v = row[this.idField];
    if (typeof v === 'string') {
      return v;
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      return String(v);
    }
    return null;
  }

  getSortValue(row: Row, col: TableColumn): string | null {
    const v = col.sortValue ? col.sortValue(row) : row[col.field];
    if (v === null || v === undefined) {
      return null;
    }
    if (typeof v === 'number') {
      return String(v);
    }
    if (typeof v === 'string') {
      return v;
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
    return id ? this.selectedIds.has(id) : false;
  }

  toggleOne(row: Row, checked: boolean): void {
    const id = this.coerceRowId(row);
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

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Helper: safely pluck a constructor from either the module root or its default export
    const getCtor = <T>(mdl: unknown, key: string): T | undefined => {
      const root = (mdl ?? {}) as Record<string, unknown>;
      const def = (root['default'] ?? {}) as Record<string, unknown>;
      const candidate = root[key] ?? def[key];
      return typeof candidate === 'function' ? (candidate as T) : undefined;
    };

    void import('@ministryofjustice/frontend')
      .then((mod) => {
        // Works regardless of whether the lib exports on root or default
        const SortableCtor = getCtor<
          new (el: HTMLElement) => { init?: () => void; destroy?: () => void }
        >(mod, 'SortableTable');
        const MultiSelectCtor = getCtor<
          new (
            el: HTMLElement,
            opts?: { idPrefix?: string },
          ) => { init?: () => void; destroy?: () => void }
        >(mod, 'MultiSelect');

        // initialise sorting
        if (SortableCtor) {
          const s = new SortableCtor(this.tableRef.nativeElement);
          if (s.init) {
            s.init();
          }
          this.destroyFns.push(() => {
            if (s.destroy) {
              s.destroy();
            }
          });
        }

        // initialise multi-select (select all, row highlighting)
        if (MultiSelectCtor) {
          const m = new MultiSelectCtor(this.tableRef.nativeElement, {
            idPrefix: this.idPrefix,
          });
          if (m.init) {
            m.init();
          }

          // Keep Angular selection state in sync if user clicks "Select all"
          const onChange = (e: Event) => {
            const target = e.target as HTMLInputElement | null;
            if (
              !target ||
              !target.classList.contains('govuk-checkboxes__input')
            ) {
              return;
            }

            // infer id from checkbox id attribute
            const idAttr = target.id || '';
            // only sync our row checkboxes (skip the header select-all control)
            if (!idAttr.startsWith(this.idPrefix)) {
              return;
            }

            const id = idAttr.replace(this.idPrefix, '');
            const next = new Set(this.selectedIds);
            if (target.checked) {
              next.add(id);
            } else {
              next.delete(id);
            }
            this.selectedIds = next;
            this.selectedIdsChange.emit(next);
          };

          this.tableRef.nativeElement.addEventListener('change', onChange);
          this.destroyFns.push(() => {
            this.tableRef.nativeElement.removeEventListener('change', onChange);
            if (m.destroy) {
              m.destroy();
            }
          });
        }
      })
      .catch(() => {
        /* swallow module load errors; component stays functional without JS */
      });
  }

  ngOnDestroy(): void {
    // Drain and run cleanups
    for (const fn of this.destroyFns.splice(0)) {
      try {
        fn();
      } catch {
        // ignore individual cleanup errors
      }
    }
  }

  get firstColField(): string {
    return this.columns[0]?.field ?? '';
  }

  getRowId(row: Row): string {
    return this.coerceRowId(row) ?? '';
  }
}
