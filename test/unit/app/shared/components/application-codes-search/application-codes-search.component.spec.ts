import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import { ApplicationCodesApi } from '@openapi';
import { ApplicationsListEntryForm } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import * as helpers from '@util/application-code-helpers';
import { CodeRow, CodeRowsResult } from '@util/application-code-helpers';

describe('ApplicationCodeSearchComponent', () => {
  let fixture: ComponentFixture<ApplicationCodeSearchComponent>;
  let component: ApplicationCodeSearchComponent;
  let componentRef: ComponentFixture<ApplicationCodeSearchComponent>['componentRef'];

  const apiMock: Partial<ApplicationCodesApi> = {};

  const routeMock: Partial<ActivatedRoute> = {
    snapshot: {
      paramMap: {
        get: jest.fn().mockReturnValue('123'),
      },
    } as unknown as ActivatedRoute['snapshot'],
  };

  const mockRows: CodeRowsResult = {
    rows: [
      {
        code: 'MS99004',
        title: 'Statutory Declaration - Lost documents',
        bulk: 'No',
        fee: '—',
      },
      {
        code: 'MS99003',
        title: 'Statutory Declaration - Local Authority Car Park',
        bulk: 'No',
        fee: '—',
      },
    ],
    totalPages: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCodeSearchComponent],
      providers: [
        { provide: ApplicationCodesApi, useValue: apiMock },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCodeSearchComponent);
    component = fixture.componentInstance;

    componentRef = fixture.componentRef;

    fixture.detectChanges(); // runs ngOnInit
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create and initialize listId', () => {
    expect(component).toBeTruthy();
    expect(component.listId).toBe('123');
    expect(component.loading()).toBe(false);
    expect(component.errored()).toBe(false);
    expect(component.codesRows).toEqual([]);
  });

  it('search() should call fetchCodeRows$ and populate codesRows', () => {
    const fetchSpy = jest
      .spyOn(helpers, 'fetchCodeRows$')
      .mockReturnValue(of(mockRows));

    component.form.patchValue({ code: ' MS99004 ', title: ' Statutory ' });

    component.search();

    expect(component.submitted()).toBe(true);
    // fetchCodeRows$ should be called with trimmed values
    expect(fetchSpy).toHaveBeenCalledWith(
      apiMock,
      {
        code: 'MS99004',
        title: 'Statutory',
        pageNumber: 0,
        pageSize: 10,
      },
      true,
    );
    expect(component.loading()).toBe(false);
    expect(component.codesRows).toEqual(mockRows.rows);
    expect(component.totalPages()).toBe(mockRows.totalPages);
  });

  it('search() should use current page and page size in request', () => {
    const fetchSpy = jest
      .spyOn(helpers, 'fetchCodeRows$')
      .mockReturnValue(of(mockRows));

    component.currentPage.set(3);
    component.pageSize.set(25);

    component.search();

    expect(fetchSpy).toHaveBeenCalledWith(
      apiMock,
      {
        code: undefined,
        title: undefined,
        pageNumber: 3,
        pageSize: 25,
      },
      true,
    );
  });

  it('search() should handle empty values correctly', () => {
    const fetchSpy = jest.spyOn(helpers, 'fetchCodeRows$').mockReturnValue(
      of({
        rows: [],
        totalPages: 0,
      }),
    );

    component.form.patchValue({ code: null, title: null });

    component.search();

    expect(fetchSpy).toHaveBeenCalledWith(
      apiMock,
      {
        code: undefined,
        title: undefined,
        pageNumber: 0,
        pageSize: 10,
      },
      true,
    );
    expect(component.codesRows).toEqual([]);
  });

  it('search() should handle API error', () => {
    jest
      .spyOn(helpers, 'fetchCodeRows$')
      .mockReturnValue(throwError(() => new Error('404')));

    component.search();

    expect(component.loading()).toBe(false);
    expect(component.errored()).toBe(true);
  });

  it('onAddCode() should emit selectCodeAndLodgementDate when valid', () => {
    const emitSpy = jest.spyOn(component.selectCodeAndLodgementDate, 'emit');

    component.form.patchValue({ lodgementDate: '2024-01-01' });

    const rowWithWhitespace: CodeRow = {
      code: ` ${mockRows.rows[0].code} `,
      title: ` ${mockRows.rows[0].title} `,
      bulk: mockRows.rows[0].bulk,
      fee: mockRows.rows[0].fee,
    };

    component.onAddCode(rowWithWhitespace);

    expect(emitSpy).toHaveBeenCalledWith({
      code: mockRows.rows[0].code,
      date: '2024-01-01',
    });

    expect(component.form.value.code).toBe(mockRows.rows[0].code);
    expect(component.form.value.title).toBe(mockRows.rows[0].title);

    expect(component.submitted()).toBe(false);
    expect(component.codesRows).toEqual([]);
  });

  it('onAddCode() should not emit if no listId', () => {
    component.listId = null;

    const emitSpy = jest.spyOn(component.selectCodeAndLodgementDate, 'emit');

    const row: CodeRow = { ...mockRows.rows[0] };
    component.onAddCode(row);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('clear() should reset form, rows, errored and emit empty selection', () => {
    const emitSpy = jest.spyOn(component.selectCodeAndLodgementDate, 'emit');
    const resetParentErrorsSpy = jest.spyOn(
      component.resetParentErrors,
      'emit',
    );

    component.form.patchValue({ code: 'X', title: 'Y' });
    component.codesRows = mockRows.rows.slice();
    component.errored.set(true);
    component.totalPages.set(8);
    component.currentPage.set(4);

    component.clear();

    expect(component.form.value.code).toBeNull();
    expect(component.form.value.title).toBeNull();
    expect(component.codesRows).toEqual([]);
    expect(component.errored()).toBe(false);
    expect(component.submitted()).toBe(false);
    expect(component.totalPages()).toBe(0);
    expect(component.currentPage()).toBe(0);
    expect(emitSpy).toHaveBeenCalledWith({ code: '', date: '' });
    expect(resetParentErrorsSpy).toHaveBeenCalled();
  });

  it('ngOnInit() should clear without re-emitting when code is emptied', () => {
    const clearSpy = jest.spyOn(component, 'clear');

    component.form.patchValue({ code: 'ABC', title: 'Some title' });
    component.form.controls.code.setValue('   ');

    expect(clearSpy).toHaveBeenCalledWith({ emitEvent: false });
    expect(component.form.value.code).toBeNull();
    expect(component.form.value.title).toBeNull();
  });

  it('onPageChange() should update page and trigger a search', () => {
    const searchSpy = jest
      .spyOn(component, 'search')
      .mockImplementation(() => undefined);

    component.onPageChange(5);

    expect(component.currentPage()).toBe(5);
    expect(searchSpy).toHaveBeenCalled();
  });

  it('initialPatchFormData() should use patchedFormData when provided', () => {
    componentRef.setInput('patchedFormData', {
      value: {
        lodgementDate: '2023-01-01',
        applicationCode: 'APP01',
        applicationTitle: 'Title',
      },
    } as ApplicationsListEntryForm);

    component.ngOnInit();

    expect(component.form.value).toEqual({
      lodgementDate: '2023-01-01',
      code: 'APP01',
      title: 'Title',
    });
  });

  it('initialPatchFormData() uses today and nulls when patchedFormData is undefined', () => {
    componentRef.setInput('patchedFormData', undefined);

    component.ngOnInit();

    const today = new Date().toISOString().split('T')[0];

    expect(component.form.value).toEqual({
      lodgementDate: today,
      code: null,
      title: null,
    });
  });

  it('initialPatchFormData() uses today and also uses patchedFormData', () => {
    componentRef.setInput('patchedFormData', {
      value: {
        applicationCode: 'APP01',
        applicationTitle: 'Title',
      },
    } as ApplicationsListEntryForm);

    component.ngOnInit();

    const today = new Date().toISOString().split('T')[0];

    expect(component.form.value).toEqual({
      lodgementDate: today,
      code: 'APP01',
      title: 'Title',
    });
  });

  it('syncs child lodgementDate changes to the parent patched form control', () => {
    const setValue = jest.fn();
    const get = jest.fn().mockReturnValue({ setValue });

    componentRef.setInput('patchedFormData', {
      value: {},
      get,
    } as unknown as ApplicationsListEntryForm);

    component.ngOnInit();
    component.form.controls.lodgementDate.setValue('2026-01-01');

    expect(get).toHaveBeenCalledWith('lodgementDate');
    expect(setValue).toHaveBeenCalledWith('2026-01-01');
  });

  it('syncs initial lodgementDate to parent patched form control on init', () => {
    const setValue = jest.fn();
    const get = jest.fn().mockReturnValue({ setValue });

    componentRef.setInput('patchedFormData', {
      value: {
        lodgementDate: '2023-01-01',
      },
      get,
    } as unknown as ApplicationsListEntryForm);

    component.ngOnInit();

    expect(get).toHaveBeenCalledWith('lodgementDate');
    expect(setValue).toHaveBeenCalledWith('2023-01-01');
  });

  it('disables the lodgement date control when requested by the parent', () => {
    componentRef.setInput('lodgementDateDisabled', true);
    fixture.detectChanges();

    expect(component.form.controls.lodgementDate.disabled).toBe(true);
  });

  it('emits the lodgement date when adding a code in disabled mode', () => {
    componentRef.setInput('lodgementDateDisabled', true);
    fixture.detectChanges();

    component.form.controls.lodgementDate.setValue('2026-04-13');

    const emitSpy = jest.spyOn(component.selectCodeAndLodgementDate, 'emit');

    component.onAddCode({
      code: 'ABC123',
      title: 'Example title',
    } as CodeRow);

    expect(emitSpy).toHaveBeenCalledWith({
      code: 'ABC123',
      date: '2026-04-13',
    });
  });
});
