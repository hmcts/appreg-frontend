import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';

// --- Mock the MoJ frontend module so dynamic import resolves safely ---
const SortableTableMock = jest.fn(function (this) {
  // no-op constructor
  this.init = jest.fn();
});
jest.mock('@ministryofjustice/frontend', () => {
  return {
    // support both shapes used by the component
    SortableTable: SortableTableMock,
    default: { SortableTable: SortableTableMock },
  };
});

describe('SortableTableComponent', () => {
  let fixture: ComponentFixture<SortableTableComponent>;
  let comp: SortableTableComponent;

  const setInput = (name: string, value: unknown, detectChanges = true) => {
    fixture.componentRef.setInput(name, value);
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

  async function create(platform: 'browser' | 'server' = 'browser') {
    await TestBed.configureTestingModule({
      imports: [SortableTableComponent], // standalone
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    })
      // Provide a minimal inline template so #mojTable exists
      .overrideComponent(SortableTableComponent, {
        set: {
          template: `
            <table #mojTable class="govuk-table" data-module="moj-sortable-table">
              <thead><tr>
                <th scope="col" class="govuk-table__header" aria-sort="none">Col A</th>
              </tr></thead>
              <tbody>
                <tr class="govuk-table__row">
                  <td class="govuk-table__cell">Value</td>
                </tr>
              </tbody>
            </table>
          `,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SortableTableComponent);
    comp = fixture.componentInstance;
  }

  beforeEach(() => {
    SortableTableMock.mockClear();
    document.body.innerHTML = ''; // isolate DOM between tests
  });

  it('creates the component', async () => {
    await create('browser');
    fixture.detectChanges();
    expect(comp).toBeTruthy();
  });

  describe('trackRow', () => {
    it('uses provided trackBy when present', async () => {
      await create('browser');
      setInput('trackBy', (i: number, r: Record<string, unknown>) =>
        'key' in r ? r['key'] : i,
      );
      const key = comp.trackRow(2, { key: 'abc' });
      expect(key).toBe('abc');
    });

    it('falls back to idField when provided', async () => {
      await create('browser');
      setInput('idField', 'id');
      const key = comp.trackRow(3, { id: 99 });
      expect(key).toBe(99);
    });

    it('falls back to index otherwise', async () => {
      await create('browser');
      const key = comp.trackRow(5, { anything: true });
      expect(key).toBe(5);
    });
  });

  describe('getSortValue', () => {
    const col = (overrides: Partial<TableColumn> = {}): TableColumn => ({
      header: 'H',
      field: 'f',
      ...overrides,
    });

    it('returns string for number', async () => {
      await create('browser');
      expect(comp.getSortValue({ f: 42 }, col())).toBe('42');
    });

    it('returns string as-is', async () => {
      await create('browser');
      expect(comp.getSortValue({ f: 'hello' }, col())).toBe('hello');
    });

    it('returns ISO for Date', async () => {
      await create('browser');
      const d = new Date('2025-09-30T10:20:30.000Z');
      expect(comp.getSortValue({ f: d }, col())).toBe(d.toISOString());
    });

    it('returns "1"/"0" for booleans', async () => {
      await create('browser');
      expect(comp.getSortValue({ f: true }, col())).toBe('1');
      expect(comp.getSortValue({ f: false }, col())).toBe('0');
    });

    it('returns null for null/undefined', async () => {
      await create('browser');
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

    it('returns null for objects/arrays (avoid [object Object])', async () => {
      await create('browser');
      expect(comp.getSortValue({ f: { a: 1 } }, col())).toBeNull();
      expect(comp.getSortValue({ f: [1, 2] }, col())).toBeNull();
    });
  });

  describe('ngAfterViewInit', () => {
    it('does nothing on the server', async () => {
      await create('server');
      fixture.detectChanges();
      expect(SortableTableMock).not.toHaveBeenCalled();
    });

    it('instantiates MoJ SortableTable once in the browser with the table element', async () => {
      await create('browser');

      fixture.componentRef.setInput('clientOrServerSort', 'server');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(SortableTableMock).toHaveBeenCalledTimes(1);

      const tableEl = fixture.debugElement.query(By.css('table'))
        .nativeElement as HTMLTableElement;
      expect(SortableTableMock).toHaveBeenCalledWith(tableEl);
    });
  });
});
