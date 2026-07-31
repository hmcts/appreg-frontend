import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateOfficialsTableBase } from '@components/applications-list-detail/update-officials/update-officials-table.base';
import { UpdateOfficialsApplication } from '@components/applications-list-detail/update-officials/update-officials.types';

@Component({
  standalone: true,
  template: '',
})
class UpdateOfficialsTableHostComponent extends UpdateOfficialsTableBase {
  protected override rows: UpdateOfficialsApplication[] = [];

  setRows(rows: UpdateOfficialsApplication[]): void {
    this.rows = rows;
  }
}

describe('UpdateOfficialsTableBase', () => {
  let fixture: ComponentFixture<UpdateOfficialsTableHostComponent>;
  let component: UpdateOfficialsTableHostComponent;

  const rows: UpdateOfficialsApplication[] = Array.from(
    { length: 11 },
    (_, index) => ({
      id: `entry-${index + 1}`,
      sequenceNumber: index + 1,
    }),
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateOfficialsTableHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateOfficialsTableHostComponent);
    component = fixture.componentInstance;
  });

  it('starts on the first page without sorting', () => {
    component.setRows(rows);

    expect(component.currentPage()).toBe(0);
    expect(component.officialSort()).toEqual({ key: '', direction: 'asc' });
    expect(component.totalPages()).toBe(2);
    expect(component.showPagination()).toBe(true);
    expect(component.paginatedRows()).toEqual(rows.slice(0, 10));
  });

  it('sorts rows and resets the current page', () => {
    component.setRows([...rows].reverse());
    component.onPageChange(1);

    component.onSortChange({ key: 'sequenceNumber', direction: 'asc' });

    expect(component.currentPage()).toBe(0);
    expect(component.paginatedRows()[0].sequenceNumber).toBe(1);
  });

  it('returns the requested page of sorted rows', () => {
    component.setRows([...rows].reverse());
    component.onSortChange({ key: 'sequenceNumber', direction: 'desc' });
    component.onPageChange(1);

    expect(component.paginatedRows()).toHaveLength(1);
    expect(component.paginatedRows()[0].sequenceNumber).toBe(1);
  });

  it('hides pagination when there are no more than ten rows', () => {
    component.setRows(rows.slice(0, 10));

    expect(component.totalPages()).toBe(1);
    expect(component.showPagination()).toBe(false);
  });
});
