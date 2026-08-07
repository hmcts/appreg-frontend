import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultSelectedTableBase } from '@util/result-selected-table.base';

type ResultRow = {
  id: string;
  sequenceNumber: string;
};

@Component({
  standalone: true,
  template: '',
})
class ResultSelectedTableHostComponent extends ResultSelectedTableBase<ResultRow> {}

describe('ResultSelectedTableBase', () => {
  let fixture: ComponentFixture<ResultSelectedTableHostComponent>;
  let component: ResultSelectedTableHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultSelectedTableHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultSelectedTableHostComponent);
    component = fixture.componentInstance;
  });

  it('sorts the full row set before pagination and resets to the first page', () => {
    component.rows = Array.from({ length: 11 }, (_, index) => ({
      id: `entry-${index}`,
      sequenceNumber: String(10 - index),
    }));
    component.onPageChange(1);

    component.onSortChange({ key: 'sequenceNumber', direction: 'asc' });

    expect(component.currentPage()).toBe(0);
    expect(component.totalPages()).toBe(2);
    expect(component.paginatedRows().map((row) => row.sequenceNumber)).toEqual(
      Array.from({ length: 10 }, (_, index) => String(index)),
    );
  });

  it('returns rows for the selected page', () => {
    component.rows = Array.from({ length: 21 }, (_, index) => ({
      id: `entry-${index}`,
      sequenceNumber: String(index),
    }));

    component.onPageChange(2);

    expect(component.paginatedRows()).toEqual([
      { id: 'entry-20', sequenceNumber: '20' },
    ]);
  });
});
