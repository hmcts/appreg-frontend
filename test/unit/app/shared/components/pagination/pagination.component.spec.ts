import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationComponent } from '../../../../../../src/app/shared/components/pagination/pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;
  let component: PaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent], // standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates with sane defaults', () => {
    expect(component).toBeTruthy();
    expect(component.currentPage).toBe(1);
    expect(component.totalPages).toBe(1);
    expect(component.pageList).toEqual([1]);
    expect(component.prevEnabled()).toBe(false);
    expect(component.nextEnabled()).toBe(false);
  });

  it('uses provided `pages` when set', () => {
    component.pages = [2, 3, 4];
    expect(component.pageList).toEqual([2, 3, 4]);
  });

  it('generates pageList from totalPages when `pages` is null/empty', () => {
    component.pages = null;
    component.totalPages = 5;
    expect(component.pageList).toEqual([1, 2, 3, 4, 5]);
  });

  it('emits pageChange only when target page is in range and different', () => {
    const onChange = jest.fn<void, [number]>();
    component.currentPage = 2;
    component.totalPages = 5;
    component.pageChange.subscribe(onChange);

    component.goTo(3);
    expect(onChange).toHaveBeenCalledWith(3);

    onChange.mockClear();
    component.goTo(2); // same as current
    expect(onChange).not.toHaveBeenCalled();

    component.goTo(0); // below range
    component.goTo(6); // above range
    expect(onChange).not.toHaveBeenCalled();
  });

  it('prevEnabled/nextEnabled reflect boundaries', () => {
    component.currentPage = 1;
    component.totalPages = 3;
    expect(component.prevEnabled()).toBe(false);
    expect(component.nextEnabled()).toBe(true);

    component.currentPage = 2;
    expect(component.prevEnabled()).toBe(true);
    expect(component.nextEnabled()).toBe(true);

    component.currentPage = 3;
    expect(component.prevEnabled()).toBe(true);
    expect(component.nextEnabled()).toBe(false);
  });

  it('does not mutate currentPage when emitting; parent is responsible for updating it', () => {
    component.currentPage = 2;
    component.totalPages = 3;

    const onChange = jest.fn<void, [number]>();
    component.pageChange.subscribe(onChange);

    component.goTo(1);
    expect(onChange).toHaveBeenCalledWith(1);
    expect(component.currentPage).toBe(2); // unchanged
  });
});
