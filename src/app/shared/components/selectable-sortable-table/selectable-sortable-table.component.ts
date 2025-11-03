import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
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
export class SelectableSortableTableComponent implements AfterViewInit {
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
  private destroyFns: Array<() => void> = [];

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  getSortValue(row: Row, col: TableColumn): string | null {
    const v = col.sortValue ? col.sortValue(row) : row[col.field];
    if (v === null) return null;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return v;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'boolean') return v ? '1' : '0';
    return null;
  }

  isSelected(row: Row): boolean {
    const id = String(row[this.idField] ?? '');
    return this.selectedIds.has(id);
  }

  toggleOne(row: Row, checked: boolean): void {
    const id = String(row[this.idField] ?? '');
    if (!id) return;
    const next = new Set(this.selectedIds);
    checked ? next.add(id) : next.delete(id);
    this.selectedIds = next;
    this.selectedIdsChange.emit(next);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    void import('@ministryofjustice/frontend')
      .then((mod) => {
        const SortableCtor =
          (mod as any).SortableTable ?? (mod as any).default?.SortableTable;
        const MultiSelectCtor =
          (mod as any).MultiSelect ?? (mod as any).default?.MultiSelect;

        // initialise sorting
        if (SortableCtor) {
          const s = new SortableCtor(this.tableRef.nativeElement);
          s.init?.();
          this.destroyFns.push(() => s.destroy?.());
        }

        // initialise multi-select (select all, row highlighting)
        if (MultiSelectCtor) {
          const m = new MultiSelectCtor(this.tableRef.nativeElement, {
            idPrefix: this.idPrefix,
          });
          m.init?.();
          // Keep Angular selection state in sync if user clicks "Select all"
          const onChange = (e: Event) => {
            const target = e.target as HTMLInputElement | null;
            if (
              !target ||
              !target.classList.contains('govuk-checkboxes__input')
            )
              return;
            // infer id from checkbox id attribute
            const idAttr = target.id || '';
            // only sync our row checkboxes (skip the header select-all control)
            if (!idAttr.startsWith(this.idPrefix)) return;

            const id = idAttr.replace(this.idPrefix, '');
            const next = new Set(this.selectedIds);
            target.checked ? next.add(id) : next.delete(id);
            this.selectedIds = next;
            this.selectedIdsChange.emit(next);
          };
          this.tableRef.nativeElement.addEventListener('change', onChange);
          this.destroyFns.push(() =>
            this.tableRef.nativeElement.removeEventListener('change', onChange),
          );
        }
      })
      .catch(() => {});
  }

  get firstColField(): string {
    return this.columns[0]?.field ?? '';
  }

  getRowId(row: Row): string {
    return String(row[this.idField] ?? '');
  }
}
