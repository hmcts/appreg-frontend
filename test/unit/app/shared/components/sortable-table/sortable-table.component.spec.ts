import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  SortableTableComponent
} from '../../../../../../src/app/shared/components/sortable-table/sortable-table.component';


type Row = {
  name?: string | null;
  text?: string | null;
  count?: number | null;
};

describe('SortableTableComponent', () => {
  let fixture: ComponentFixture<SortableTableComponent>;
  let component: SortableTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortableTableComponent], // standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(SortableTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates with sensible defaults', () => {
    expect(component).toBeTruthy();
    expect(component.caption).toBe('');
    expect(component.columns).toEqual([]);
    expect(component.data).toEqual([]);
    expect(component.sortedData).toEqual([]);
    expect(component.sortField).toBeUndefined();
    expect(component.sortDir).toBe('asc');
  });

  it('copies input data on changes and does not mutate original array', () => {
    const rows: Row[] = [{ count: 3 }, { count: 1 }, { count: 2 }];
    const original = rows.slice();
    component.data = rows as unknown as never[];

    component.ngOnChanges({
      data: new SimpleChange(null, component.data, true),
    });

    // uses a new array instance
    expect(component.sortedData).not.toBe(component.data);
    // original input untouched
    expect(rows).toEqual(original);
  });

  it('sorts numerically ascending then descending when clicking the same sortable header', () => {
    component.columns = [{ header: 'Count', field: 'count', sortable: true }];
    const rows: Row[] = [{ count: 3 }, { count: 1 }, { count: 2 }];
    component.data = rows as unknown as never[];
    component.ngOnChanges({ data: new SimpleChange(null, component.data, true) });

    // first click → set sortField=count, dir=asc
    component.onHeaderClick({ field: 'count', sortable: true });
    let out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.count)).toEqual([1, 2, 3]);
    expect(component.sortField).toBe('count');
    expect(component.sortDir).toBe('asc');

    // second click → toggle dir to desc
    component.onHeaderClick({ field: 'count', sortable: true });
    out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.count)).toEqual([3, 2, 1]);
    expect(component.sortDir).toBe('desc');
  });

  it('switching to a different column starts at asc', () => {
    component.columns = [
      { header: 'Name', field: 'name', sortable: true },
      { header: 'Count', field: 'count', sortable: true },
    ];
    const rows: Row[] = [
      { name: 'b', count: 2 },
      { name: 'a', count: 3 },
      { name: 'c', count: 1 },
    ];
    component.data = rows as unknown as never[];
    component.ngOnChanges({ data: new SimpleChange(null, component.data, true) });

    // click name (asc)
    component.onHeaderClick({ field: 'name', sortable: true });
    let out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.name)).toEqual(['a', 'b', 'c']);
    expect(component.sortDir).toBe('asc');

    // now click count → should reset to asc on new column
    component.onHeaderClick({ field: 'count', sortable: true });
    out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.count)).toEqual([1, 2, 3]);
    expect(component.sortField).toBe('count');
    expect(component.sortDir).toBe('asc');
  });

  it('ignores clicks on unsortable headers', () => {
    component.columns = [{ header: 'Name', field: 'name', sortable: false }];
    const rows: Row[] = [{ name: 'b' }, { name: 'a' }];
    component.data = rows as unknown as never[];
    component.ngOnChanges({ data: new SimpleChange(null, component.data, true) });

    component.onHeaderClick({ field: 'name', sortable: false });
    // no sort field set, data unchanged order
    expect(component.sortField).toBeUndefined();
    const out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.name)).toEqual(['b', 'a']);
  });

  it('string sorting falls back to localeCompare', () => {
    component.columns = [{ header: 'Text', field: 'text', sortable: true }];
    const rows: Row[] = [{ text: 'b' }, { text: 'a' }, { text: 'c' }];
    component.data = rows as unknown as never[];
    component.ngOnChanges({ data: new SimpleChange(null, component.data, true) });

    component.onHeaderClick({ field: 'text', sortable: true }); // asc
    let out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.text)).toEqual(['a', 'b', 'c']);

    component.onHeaderClick({ field: 'text', sortable: true }); // desc
    out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.text)).toEqual(['c', 'b', 'a']);
  });

  it('null values are ordered first in asc and last in desc', () => {
    component.columns = [{ header: 'Text', field: 'text', sortable: true }];
    const rows: Row[] = [{ text: null }, { text: 'b' }, { text: 'a' }];
    component.data = rows as unknown as never[];
    component.ngOnChanges({ data: new SimpleChange(null, component.data, true) });

    // asc: null first
    component.onHeaderClick({ field: 'text', sortable: true });
    let out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.text)).toEqual([null, 'a', 'b']);

    // desc: null last
    component.onHeaderClick({ field: 'text', sortable: true });
    out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.text)).toEqual(['b', 'a', null]);
  });

  it('ngOnChanges auto-applies sorting when sortField is already set', () => {
    component.columns = [{ header: 'Count', field: 'count', sortable: true }];
    component.sortField = 'count';
    component.sortDir = 'desc';

    const rows: Row[] = [{ count: 1 }, { count: 3 }, { count: 2 }];
    component.data = rows as unknown as never[];
    component.ngOnChanges({ data: new SimpleChange(null, component.data, true) });

    const out = component.sortedData as unknown as Row[];
    expect(out.map(r => r.count)).toEqual([3, 2, 1]);
  });
});
