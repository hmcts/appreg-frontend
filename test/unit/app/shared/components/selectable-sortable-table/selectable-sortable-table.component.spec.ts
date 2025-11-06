import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  SelectableSortableTableComponent,
  TableColumn,
} from '../../../../../../src/app/shared/components/selectable-sortable-table/selectable-sortable-table.component';

type Row = Record<string, unknown>;

/* -------------------- Typed mocks for @ministryofjustice/frontend -------------------- */

type MojInstance = { init: jest.Mock<void, []>; destroy: jest.Mock<void, []> };

const makeInstance = (): MojInstance => ({
  init: jest.fn(),
  destroy: jest.fn(),
});

const SortableTableMock: jest.Mock<MojInstance, [HTMLElement]> = jest.fn(
  (_el: HTMLElement) => {
    void _el;
    return makeInstance();
  },
);

const MultiSelectMock: jest.Mock<
  MojInstance,
  [HTMLElement, { idPrefix?: string }?]
> = jest.fn((_el: HTMLElement, _opts?: { idPrefix?: string }) => {
  void _el;
  void _opts;
  return makeInstance();
});

// Mock module so the component's dynamic import resolves (supports root + default)
jest.mock('@ministryofjustice/frontend', () => ({
  SortableTable: SortableTableMock,
  MultiSelect: MultiSelectMock,
  default: { SortableTable: SortableTableMock, MultiSelect: MultiSelectMock },
}));

/* ------------------------------------------------------------------------------------- */

describe('SelectableSortableTableComponent (original template)', () => {
  let fixture: ComponentFixture<SelectableSortableTableComponent>;
  let comp: SelectableSortableTableComponent;

  async function create(platform: 'browser' | 'server' = 'browser') {
    await TestBed.configureTestingModule({
      imports: [SelectableSortableTableComponent], // standalone component
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectableSortableTableComponent);
    comp = fixture.componentInstance;

    // Provide realistic inputs so the original template renders rows + checkbox column
    const columns: TableColumn[] = [
      { header: 'Name', field: 'name' },
      { header: 'Elevation', field: 'elevation', numeric: true },
      { header: 'Actions', field: 'actions', sortable: false },
    ];
    const data: Row[] = [{ id: 'abc', name: 'Everest', elevation: 8848 }];

    comp.caption = 'Lists';
    comp.columns = columns;
    comp.data = data;
    comp.idField = 'id';
    comp.idPrefix = 'row-';
  }

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = ''; // isolate DOM between tests
  });

  it('creates with the real template', async () => {
    await create('browser');
    fixture.detectChanges();
    expect(comp).toBeTruthy();

    // real DOM from the original template should be present (thead/tbody/rows)
    const table = fixture.debugElement.query(By.css('table.govuk-table'));
    expect(table).toBeTruthy();
  });

  describe('getSortValue (template uses this for data-sort-value)', () => {
    const col = (overrides: Partial<TableColumn> = {}): TableColumn => ({
      header: 'H',
      field: 'f',
      ...overrides,
    });

    it('coerces supported values', async () => {
      await create();
      const d = new Date('2025-09-30T10:20:30.000Z');

      expect(comp.getSortValue({ f: 42 } as Row, col())).toBe('42');
      expect(comp.getSortValue({ f: 'hello' } as Row, col())).toBe('hello');
      expect(comp.getSortValue({ f: d } as Row, col())).toBe(d.toISOString());
      expect(comp.getSortValue({ f: true } as Row, col())).toBe('1');
      expect(comp.getSortValue({ f: false } as Row, col())).toBe('0');
      expect(comp.getSortValue({ f: null } as Row, col())).toBeNull();
      expect(comp.getSortValue({} as Row, col())).toBeNull();
    });

    it('uses col.sortValue(row) when provided', async () => {
      await create();
      const c = col({
        sortValue: (r: Row) => (r as Record<string, unknown>)['raw'] as number,
      });
      expect(comp.getSortValue({ raw: 123 } as Row, c)).toBe('123');
    });
  });

  describe('selection (real checkbox column)', () => {
    it('toggleOne emits and updates selectedIds', async () => {
      await create('browser');
      fixture.detectChanges();

      const emitted: Set<string>[] = [];
      comp.selectedIdsChange.subscribe((s) => emitted.push(new Set(s)));

      comp.selectedIds = new Set(['x']);
      comp.toggleOne({ id: 'abc' } as Row, true);
      expect(Array.from(comp.selectedIds)).toEqual(['x', 'abc']);
      expect(Array.from(emitted[0])).toEqual(['x', 'abc']);

      comp.toggleOne({ id: 'abc' } as Row, false);
      expect(Array.from(comp.selectedIds)).toEqual(['x']);
      expect(Array.from(emitted[1])).toEqual(['x']);
    });

    it('listens to DOM change events (checkbox → selection sync)', async () => {
      await create('browser');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((r) => setTimeout(r, 0)); // allow dynamic import to resolve

      // The original template renders a checkbox per row; it has the GOV.UK class
      // and id based on idPrefix + row id.
      const tableEl = fixture.debugElement.query(By.css('table'))
        .nativeElement as HTMLTableElement;

      const input = tableEl.querySelector('#row-abc') as HTMLInputElement;
      expect(input).toBeTruthy();

      // Ensure the class MoJ change-listener looks for is present
      input.classList.add('govuk-checkboxes__input');
      input.checked = true;

      // Dispatch a bubbling change event to the table
      const ev = new Event('change', { bubbles: true });
      Object.defineProperty(ev, 'target', { value: input, writable: false });
      tableEl.dispatchEvent(ev);

      expect(comp.selectedIds.has('abc')).toBe(true);
    });
  });

  describe('ngAfterViewInit (MoJ JS init)', () => {
    it('does nothing on the server', async () => {
      await create('server');
      fixture.detectChanges();
      expect(SortableTableMock).not.toHaveBeenCalled();
      expect(MultiSelectMock).not.toHaveBeenCalled();
    });

    it('instantiates SortableTable and MultiSelect in the browser using the real template', async () => {
      await create('browser');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((r) => setTimeout(r, 0)); // wait for dynamic import

      // SortableTable is initialised with the <table #mojTable> element
      const tableEl = fixture.debugElement.query(By.css('table'))
        .nativeElement as HTMLTableElement;
      expect(SortableTableMock).toHaveBeenCalledWith(tableEl);

      // MultiSelect is initialised with the same element and idPrefix
      const [, opts] = MultiSelectMock.mock.calls[0];
      expect(opts).toEqual({ idPrefix: 'row-' });
    });
  });
});
