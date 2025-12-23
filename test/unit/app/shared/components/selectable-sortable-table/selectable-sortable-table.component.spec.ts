import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SelectableSortableTableComponent } from '@components/selectable-sortable-table/selectable-sortable-table.component';
import { TableColumn } from '@components/sortable-table/sortable-table.component';

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

type MojDefault = {
  SortableTable?: typeof SortableTableMock;
  MultiSelect?: typeof MultiSelectMock;
};

type MojModule = {
  __esModule: true;
  SortableTable?: typeof SortableTableMock;
  MultiSelect?: typeof MultiSelectMock;
  default: MojDefault;
};

const mojDefault: MojDefault = {
  SortableTable: SortableTableMock,
  MultiSelect: MultiSelectMock,
};

const mojModule: MojModule = {
  __esModule: true,
  SortableTable: SortableTableMock,
  MultiSelect: MultiSelectMock,
  default: mojDefault,
};

jest.mock('@ministryofjustice/frontend', () => mojModule);

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
    document.body.innerHTML = '';

    mojModule.SortableTable = SortableTableMock;
    mojModule.MultiSelect = MultiSelectMock;

    mojModule.default.SortableTable = SortableTableMock;
    mojModule.default.MultiSelect = MultiSelectMock;
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

      expect(comp.getSortValue({ f: 42 } as Row, col())).toBe(42);
      expect(comp.getSortValue({ f: 'hello' } as Row, col())).toBe('hello');
      expect(comp.getSortValue({ f: d } as Row, col())).toBe(d.toISOString());
      expect(comp.getSortValue({ f: true } as Row, col())).toBe(1);
      expect(comp.getSortValue({ f: false } as Row, col())).toBe(0);
      expect(comp.getSortValue({ f: null } as Row, col())).toBeNull();
      expect(comp.getSortValue({} as Row, col())).toBeNull();
    });

    it('uses col.sortValue(row) when provided', async () => {
      await create();
      const c = col({
        sortValue: (r: Row) => (r as Record<string, unknown>)['raw'] as number,
      });
      expect(comp.getSortValue({ raw: 123 } as Row, c)).toBe(123);
    });
  });

  describe('selection (real checkbox column)', () => {
    it('toggleOne emits and updates selectedIds', async () => {
      await create('browser');
      fixture.detectChanges();

      const emitted: Set<string>[] = [];
      comp.selectedIdsChange.subscribe((s) => emitted.push(new Set(s)));
      const rowsSpy = jest.spyOn(comp.selectedRowsChange, 'emit');

      comp.selectedIds = new Set(['x']);
      comp.toggleOne({ id: 'abc' } as Row, true);
      expect(Array.from(comp.selectedIds)).toEqual(['x', 'abc']);
      expect(Array.from(emitted[0])).toEqual(['x', 'abc']);
      expect(rowsSpy).toHaveBeenCalledTimes(1);
      expect(rowsSpy).toHaveBeenCalledWith([
        { id: 'abc', name: 'Everest', elevation: 8848 },
      ]);

      comp.toggleOne({ id: 'abc' } as Row, false);
      expect(Array.from(comp.selectedIds)).toEqual(['x']);
      expect(Array.from(emitted[1])).toEqual(['x']);
      expect(rowsSpy).toHaveBeenCalledTimes(2);
      expect(rowsSpy.mock.calls[1][0]).toEqual([]);
    });

    it('listens to DOM change events (checkbox → selection sync)', async () => {
      await create('browser');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((r) => setTimeout(r, 0)); // allow dynamic import to resolve

      // The real template renders a checkbox with idPrefix + row id (e.g. #row-abc)
      const input = fixture.debugElement.query(By.css('#row-abc'))
        .nativeElement as HTMLInputElement;
      expect(input).toBeTruthy();

      // Dispatch the change on the checkbox itself (Angular template handles it)
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      fixture.detectChanges();
      await fixture.whenStable();

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

    it('instantiates SortableTable (no MultiSelect) in the browser using the real template', async () => {
      await create('browser');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((r) => setTimeout(r, 0)); // wait for dynamic import

      // SortableTable is initialised with the <table> element
      const tableEl = fixture.debugElement.query(By.css('table'))
        .nativeElement as HTMLTableElement;
      expect(SortableTableMock).toHaveBeenCalledWith(tableEl);

      // MultiSelect is no longer initialised in the refactored component
      expect(MultiSelectMock).not.toHaveBeenCalled();
    });
  });

  describe('getRowId / visibleIds / selection computed flags', () => {
    it('coerces row ids (string, number, date, boolean) and filters empty ids from visibleIds', async () => {
      await create('browser');

      const d = new Date('2025-09-30T10:20:30.000Z');
      comp.idField = 'id';
      comp.data = [
        { id: 's' },
        { id: 12 },
        { id: d },
        { id: true },
        { id: false },
        {}, // -> ''
      ] as Row[];

      expect(comp.getRowId({ id: 'x' } as Row)).toBe('x');
      expect(comp.getRowId({ id: 12 } as Row)).toBe('12');
      expect(comp.getRowId({ id: d } as Row)).toBe(d.toISOString());
      expect(comp.getRowId({ id: true } as Row)).toBe('1');
      expect(comp.getRowId({ id: false } as Row)).toBe('0');
      expect(comp.getRowId({} as Row)).toBe('');

      // visibleIds should drop ''
      expect(comp.visibleIds).toEqual(['s', '12', d.toISOString(), '1', '0']);
    });

    it('computes allVisibleSelected / someVisibleSelected', async () => {
      await create('browser');
      comp.idField = 'id';
      comp.data = [{ id: 'a' }, { id: 'b' }] as Row[];

      comp.selectedIds = new Set<string>();
      expect(comp.allVisibleSelected).toBe(false);
      expect(comp.someVisibleSelected).toBe(false);

      comp.selectedIds = new Set<string>(['a']);
      expect(comp.allVisibleSelected).toBe(false);
      expect(comp.someVisibleSelected).toBe(true);

      comp.selectedIds = new Set<string>(['a', 'b']);
      expect(comp.allVisibleSelected).toBe(true);
      expect(comp.someVisibleSelected).toBe(true);
    });

    it('isSelected returns false for empty id and true when selected', async () => {
      await create('browser');
      comp.idField = 'id';
      comp.selectedIds = new Set<string>(['a']);

      expect(comp.isSelected({} as Row)).toBe(false);
      expect(comp.isSelected({ id: 'a' } as Row)).toBe(true);
      expect(comp.isSelected({ id: 'b' } as Row)).toBe(false);
    });

    it('firstColField returns empty string when no columns', async () => {
      await create('browser');
      comp.columns = [];
      expect(comp.firstColField).toBe('');

      comp.columns = [{ header: 'H', field: 'f' }];
      expect(comp.firstColField).toBe('f');
    });
  });

  describe('toggleSelectAllVisible', () => {
    it('does nothing when singleSelect is true', async () => {
      await create('browser');
      comp.singleSelect = true;
      comp.idField = 'id';
      comp.data = [{ id: 'a' }, { id: 'b' }] as Row[];
      comp.selectedIds = new Set<string>(['a']);

      const emitSpy = jest.spyOn(comp.selectedIdsChange, 'emit');
      comp.toggleSelectAllVisible(true);

      expect(Array.from(comp.selectedIds)).toEqual(['a']);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('selects and deselects all visible ids when singleSelect is false', async () => {
      await create('browser');
      comp.singleSelect = false;
      comp.idField = 'id';
      comp.data = [{ id: 'a' }, { id: 'b' }] as Row[];
      comp.selectedIds = new Set<string>(['x']);

      const rowsSpy = jest.spyOn(comp.selectedRowsChange, 'emit');

      const emitted: Set<string>[] = [];
      comp.selectedIdsChange.subscribe((s) => emitted.push(new Set(s)));

      comp.toggleSelectAllVisible(true);
      expect(new Set(comp.selectedIds)).toEqual(new Set(['x', 'a', 'b']));
      expect(new Set(emitted[0])).toEqual(new Set(['x', 'a', 'b']));

      expect(rowsSpy).toHaveBeenCalledWith(
        expect.arrayContaining([{ id: 'a' }, { id: 'b' }]),
      );

      comp.toggleSelectAllVisible(false);
      expect(new Set(comp.selectedIds)).toEqual(new Set(['x']));
      expect(new Set(emitted[1])).toEqual(new Set(['x']));
      expect(rowsSpy.mock.calls[1][0]).toEqual([]);
    });
  });

  describe('toggleOne additional branches', () => {
    it('returns early when row id is empty (no emit)', async () => {
      await create('browser');
      comp.idField = 'id';

      const emitSpy = jest.spyOn(comp.selectedIdsChange, 'emit');
      comp.toggleOne({} as Row, true);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('singleSelect clears existing selection and keeps only the clicked row when checked', async () => {
      await create('browser');
      comp.idField = 'id';
      comp.singleSelect = true;
      comp.selectedIds = new Set<string>(['x']);

      const emitted: Set<string>[] = [];
      comp.selectedIdsChange.subscribe((s) => emitted.push(new Set(s)));

      comp.toggleOne({ id: 'a' } as Row, true);
      expect(new Set(comp.selectedIds)).toEqual(new Set(['a']));
      expect(new Set(emitted[0])).toEqual(new Set(['a']));

      comp.toggleOne({ id: 'a' } as Row, false);
      expect(new Set(comp.selectedIds)).toEqual(new Set());
      expect(new Set(emitted[1])).toEqual(new Set());
    });
  });

  describe('getSortValue additional branches', () => {
    const col = (overrides: Partial<TableColumn> = {}): TableColumn => ({
      header: 'H',
      field: 'f',
      ...overrides,
    });

    it('coerces bigint, invalid date, and non-finite number', async () => {
      await create();

      expect(comp.getSortValue({ f: 10n } as Row, col())).toBe('10');

      const invalid = new Date('not-a-date');
      expect(comp.getSortValue({ f: invalid } as Row, col())).toBeNull();

      expect(
        comp.getSortValue({ f: Number.POSITIVE_INFINITY } as Row, col()),
      ).toBeNull();
    });

    it('returns null when col.sortValue throws', async () => {
      await create();

      const c = col({
        sortValue: () => {
          throw new Error('boom');
        },
      });

      expect(comp.getSortValue({ f: 'x' } as Row, c)).toBeNull();
    });
  });

  describe('ngAfterViewInit getCtor default/undefined + ngOnDestroy swallow', () => {
    it('uses default export constructor when root export is missing', async () => {
      mojModule.SortableTable = undefined;
      mojModule.default.SortableTable = SortableTableMock;

      await create('browser');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((r) => setTimeout(r, 0));

      const tableEl = fixture.debugElement.query(By.css('table'))
        .nativeElement as HTMLTableElement;

      expect(SortableTableMock).toHaveBeenCalledWith(tableEl);
    });

    it('does nothing when constructor is missing from both root and default', async () => {
      mojModule.SortableTable = undefined;
      delete mojModule.default.SortableTable;

      await create('browser');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((r) => setTimeout(r, 0));

      expect(SortableTableMock).not.toHaveBeenCalled();
    });

    it('ngOnDestroy swallows destroy errors and also swallows errors from queued destroy fns', async () => {
      // SortableTable.destroy throw to hit the try/catch inside the queued destroy fn
      SortableTableMock.mockImplementationOnce((_el: HTMLElement) => {
        void _el;
        return {
          init: jest.fn(),
          destroy: jest.fn(() => {
            throw new Error('x');
          }),
        };
      });

      await create('browser');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((r) => setTimeout(r, 0));

      // push a failing destroy fn to hit ngOnDestroy catch
      type PrivateApi = { destroyFns: Array<() => void> };
      (comp as unknown as PrivateApi).destroyFns.push(() => {
        throw new Error('y');
      });

      expect(() => comp.ngOnDestroy()).not.toThrow();
    });
  });

  describe('getSelectedRows()', () => {
    it('returns the currently selected rows', () => {
      // selectedIds order: 'b' then 'a'
      comp['selectedIds'] = new Set(['b', 'a']);
      comp['data'] = [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ];

      const result = comp.getSelectedRows() as Row[];

      expect(result).toEqual([
        { id: 'b', label: 'B' },
        { id: 'a', label: 'A' },
      ]);
    });
  });
});
