import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';

type Row = Record<string, unknown>;

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

jest.mock('@ministryofjustice/frontend', () => ({
  SortableTable: SortableTableMock,
  default: { SortableTable: SortableTableMock },
}));

@Component({
  standalone: true,
  imports: [SortableTableComponent],
  template: `
    <app-sortable-table [columns]="columns" [data]="data">
      <caption class="govuk-table__caption">
        Projected caption
      </caption>
    </app-sortable-table>
  `,
})
class HostWithProjectedCaptionComponent {
  columns: TableColumn[] = [{ header: 'Name', field: 'name' }];
  data: Row[] = [{ name: 'Everest' }];
}

describe('SortableTableComponent', () => {
  let fixture: ComponentFixture<SortableTableComponent>;
  let comp: SortableTableComponent;

  const getSelectedIdsState = (): Set<string> =>
    (
      comp as unknown as {
        selectedIdsState: () => Set<string>;
      }
    ).selectedIdsState();

  const setInput = (name: string, value: unknown, detectChanges = true) => {
    fixture.componentRef.setInput(name, value);
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

  async function create(
    platform: 'browser' | 'server' = 'browser',
    initialData: Row[] = [{ id: 'abc', name: 'Everest', elevation: 8848 }],
  ) {
    await TestBed.configureTestingModule({
      imports: [SortableTableComponent],
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    }).compileComponents();

    fixture = TestBed.createComponent(SortableTableComponent);
    comp = fixture.componentInstance;

    const columns: TableColumn[] = [
      { header: 'Name', field: 'name' },
      { header: 'Elevation', field: 'elevation', numeric: true },
      { header: 'Actions', field: 'actions', sortable: false },
    ];
    setInput('caption', 'Lists', false);
    setInput('columns', columns, false);
    setInput('data', initialData, false);
    setInput('idField', 'id', false);
    setInput('idPrefix', 'row-', false);
    fixture.detectChanges();
  }

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('creates with the real template', async () => {
    await create('browser');
    expect(comp).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css('table.govuk-table')),
    ).toBeTruthy();
  });

  it('renders no-data message and no table when data is empty', async () => {
    await create('browser', []);

    expect(fixture.debugElement.query(By.css('table.govuk-table'))).toBeNull();
    expect(fixture.debugElement.query(By.css('thead'))).toBeNull();
    expect(fixture.debugElement.query(By.css('#no-data-message'))).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css('#no-data-message')).nativeElement
        .textContent,
    ).toContain('No results found.');
  });

  describe('trackRow', () => {
    it('uses provided trackBy when present', async () => {
      await create('browser');
      setInput('trackBy', (i: number, r: Record<string, unknown>) =>
        'key' in r ? r['key'] : i,
      );
      expect(comp.trackRow(2, { key: 'abc' })).toBe('abc');
    });

    it('falls back to idField when provided', async () => {
      await create('browser');
      setInput('idField', 'id');
      expect(comp.trackRow(3, { id: 99 })).toBe(99);
    });

    it('falls back to index otherwise', async () => {
      await create('browser');
      expect(comp.trackRow(5, { anything: true })).toBe(5);
    });
  });

  describe('getSortValue', () => {
    const col = (overrides: Partial<TableColumn> = {}): TableColumn => ({
      header: 'H',
      field: 'f',
      ...overrides,
    });

    it('coerces supported values', async () => {
      await create('browser');
      const d = new Date('2025-09-30T10:20:30.000Z');

      expect(comp.getSortValue({ f: 42 }, col())).toBe('42');
      expect(comp.getSortValue({ f: 'hello' }, col())).toBe('hello');
      expect(comp.getSortValue({ f: d }, col())).toBe(d.toISOString());
      expect(comp.getSortValue({ f: true }, col())).toBe('1');
      expect(comp.getSortValue({ f: false }, col())).toBe('0');
      expect(comp.getSortValue({ f: null }, col())).toBeNull();
      expect(comp.getSortValue({}, col())).toBeNull();
    });

    it('uses sortValue(row) when provided', async () => {
      await create('browser');
      const c = col({
        sortValue: (r) => r['raw'] as number | string | null | undefined,
      });
      expect(comp.getSortValue({ raw: 123 }, c)).toBe('123');
    });

    it('returns null for objects and arrays', async () => {
      await create('browser');
      expect(comp.getSortValue({ f: { a: 1 } }, col())).toBeNull();
      expect(comp.getSortValue({ f: [1, 2] }, col())).toBeNull();
    });
  });

  describe('selection', () => {
    it('renders checkbox column when selectable is enabled', async () => {
      await create('browser');
      setInput('selectable', true);

      expect(
        fixture.debugElement.query(By.css('#row-select-all')),
      ).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#row-abc'))).toBeTruthy();
    });

    it('toggleOne emits and updates selectedIds', async () => {
      await create('browser');
      setInput('selectable', true);

      const emitted: Set<string>[] = [];
      comp.selectedIdsChange.subscribe((s) => emitted.push(new Set(s)));
      const rowsSpy = jest.spyOn(comp.selectedRowsChange, 'emit');

      setInput('selectedIds', new Set(['x']));
      comp.toggleOne({ id: 'abc' }, true);

      expect(Array.from(getSelectedIdsState())).toEqual(['x', 'abc']);
      expect(Array.from(emitted[0])).toEqual(['x', 'abc']);
      expect(rowsSpy).toHaveBeenCalledWith([
        { id: 'abc', name: 'Everest', elevation: 8848 },
      ]);
    });

    it('listens to row checkbox change events', async () => {
      await create('browser');
      setInput('selectable', true);
      await fixture.whenStable();
      await new Promise<void>((r) => setTimeout(r, 0));

      const input = fixture.debugElement.query(By.css('#row-abc'))
        .nativeElement as HTMLInputElement;

      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(getSelectedIdsState().has('abc')).toBe(true);
    });

    it('supports singleSelect mode', async () => {
      await create('browser');
      setInput('selectable', true);
      setInput('singleSelect', true);
      setInput('selectedIds', new Set<string>(['x']));

      const emitted: Set<string>[] = [];
      comp.selectedIdsChange.subscribe((s) => emitted.push(new Set(s)));

      comp.toggleOne({ id: 'a' }, true);
      expect(new Set(getSelectedIdsState())).toEqual(new Set(['a']));
      expect(new Set(emitted[0])).toEqual(new Set(['a']));
    });

    it('toggleSelectAllVisible selects and deselects visible ids', async () => {
      await create('browser');
      setInput('selectable', true);
      setInput('data', [{ id: 'a' }, { id: 'b' }] as Row[]);
      setInput('selectedIds', new Set<string>(['x']));

      comp.toggleSelectAllVisible(true);
      expect(new Set(getSelectedIdsState())).toEqual(new Set(['x', 'a', 'b']));

      comp.toggleSelectAllVisible(false);
      expect(new Set(getSelectedIdsState())).toEqual(new Set(['x']));
    });

    it('toggleSelectAllVisible emits external select-all without mutating ids when configured', async () => {
      await create('browser');
      setInput('selectable', true);
      setInput('selectAllScope', 'external');
      setInput('selectedIds', new Set<string>(['x']));

      const selectAllSpy = jest.spyOn(comp.selectAllChange, 'emit');
      const selectedIdsSpy = jest.spyOn(comp.selectedIdsChange, 'emit');

      comp.toggleSelectAllVisible(true);

      expect(selectAllSpy).toHaveBeenCalledWith(true);
      expect(selectedIdsSpy).not.toHaveBeenCalled();
      expect(new Set(getSelectedIdsState())).toEqual(new Set(['x']));
    });
  });

  describe('caption rendering', () => {
    it('renders the fallback caption input when no caption is projected', async () => {
      await create('browser');

      const caption = fixture.debugElement.query(By.css('caption'))
        .nativeElement as HTMLTableCaptionElement;
      expect(caption.textContent?.trim()).toBe('Lists');
    });

    it('supports projected caption content', async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithProjectedCaptionComponent],
      }).compileComponents();

      const hostFixture = TestBed.createComponent(
        HostWithProjectedCaptionComponent,
      );
      hostFixture.detectChanges();

      const captions = hostFixture.debugElement.queryAll(By.css('caption'));
      expect(captions).toHaveLength(1);
      expect(captions[0].nativeElement.textContent.trim()).toBe(
        'Projected caption',
      );
    });
  });

  describe('ngAfterViewInit', () => {
    it('does nothing on the server', async () => {
      await create('server');
      fixture.detectChanges();
      expect(SortableTableMock).not.toHaveBeenCalled();
    });

    it('instantiates MoJ SortableTable once in the browser', async () => {
      await create('browser');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const tableEl = fixture.debugElement.query(By.css('table'))
        .nativeElement as HTMLTableElement;

      expect(SortableTableMock).toHaveBeenCalledTimes(1);
      expect(SortableTableMock).toHaveBeenCalledWith(tableEl);
    });

    it('does not instantiate MoJ SortableTable when there is no table rendered', async () => {
      await create('browser', []);
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(fixture.debugElement.query(By.css('table'))).toBeNull();
      expect(SortableTableMock).not.toHaveBeenCalled();
    });
  });
});
