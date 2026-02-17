import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import { ApplicationCodesApi } from '@openapi';
import { ApplicationsListEntryForm } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import * as helpers from '@util/application-code-helpers';
import { CodeRow } from '@util/application-code-helpers';

describe('ApplicationCodeSearchComponent', () => {
  let fixture: ComponentFixture<ApplicationCodeSearchComponent>;
  let component: ApplicationCodeSearchComponent;

  const apiMock: Partial<ApplicationCodesApi> = {};

  const routeMock: Partial<ActivatedRoute> = {
    snapshot: {
      paramMap: {
        get: jest.fn().mockReturnValue('123'),
      },
    } as unknown as ActivatedRoute['snapshot'],
  };

  const mockRows: CodeRow[] = [
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
  ];

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
    fixture.detectChanges(); // runs ngOnInit
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create and initialize listId', () => {
    expect(component).toBeTruthy();
    expect(component.listId).toBe('123');
    expect(component.loading).toBe(false);
    expect(component.errored).toBe(false);
    expect(component.codesRows).toEqual([]);
  });

  it('search() should call fetchCodeRows$ and populate codesRows', () => {
    const fetchSpy = jest
      .spyOn(helpers, 'fetchCodeRows$')
      .mockReturnValue(of(mockRows));

    component.form.patchValue({ code: ' MS99004 ', title: ' Statutory ' });

    component.search();

    expect(component.submitted).toBe(true);
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
    expect(component.loading).toBe(false);
    expect(component.codesRows).toEqual(mockRows);
  });

  it('search() should handle empty values correctly', () => {
    const fetchSpy = jest
      .spyOn(helpers, 'fetchCodeRows$')
      .mockReturnValue(of([]));

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

    const markSpy = jest.spyOn(component['cdr'], 'markForCheck');

    component.search();

    expect(component.loading).toBe(false);
    expect(component.errored).toBe(true);
    expect(markSpy).toHaveBeenCalled();
  });

  it('onAddCode() should emit selectCodeAndLodgementDate when valid', () => {
    const emitSpy = jest.spyOn(component.selectCodeAndLodgementDate, 'emit');

    component.form.patchValue({ lodgementDate: '2024-01-01' });

    const rowWithWhitespace: CodeRow = {
      code: ` ${mockRows[0].code} `,
      title: ` ${mockRows[0].title} `,
      bulk: mockRows[0].bulk,
      fee: mockRows[0].fee,
    };

    component.onAddCode(rowWithWhitespace);

    expect(emitSpy).toHaveBeenCalledWith({
      code: mockRows[0].code,
      date: '2024-01-01',
    });

    expect(component.form.value.code).toBe(mockRows[0].code);
    expect(component.form.value.title).toBe(mockRows[0].title);

    expect(component.submitted).toBe(false);
    expect(component.codesRows).toEqual([]);
  });

  it('onAddCode() should not emit if no listId', () => {
    component.listId = null;

    const emitSpy = jest.spyOn(component.selectCodeAndLodgementDate, 'emit');

    const row: CodeRow = { ...mockRows[0] };
    component.onAddCode(row);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('clear() should reset form, rows, errored and emit empty selection', () => {
    const emitSpy = jest.spyOn(component.selectCodeAndLodgementDate, 'emit');
    const markSpy = jest.spyOn(component['cdr'], 'markForCheck');

    component.form.patchValue({ code: 'X', title: 'Y' });
    component.codesRows = mockRows.slice();
    component.errored = true;

    component.clear();

    expect(component.form.value.code).toBeNull();
    expect(component.form.value.title).toBeNull();
    expect(component.codesRows).toEqual([]);
    expect(component.errored).toBe(false);
    expect(component.submitted).toBe(false);
    expect(markSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith({ code: '', date: '' });
  });

  it('initialPatchFormData() should use patchedFormData when provided', () => {
    component.patchedFormData = {
      value: {
        lodgementDate: '2023-01-01',
        applicationCode: 'APP01',
        applicationTitle: 'Title',
      },
    } as ApplicationsListEntryForm;

    component.ngOnInit();

    expect(component.form.value).toEqual({
      lodgementDate: '2023-01-01',
      code: 'APP01',
      title: 'Title',
    });
  });

  it('initialPatchFormData() uses today and nulls when patchedFormData is undefined', () => {
    component.patchedFormData = undefined;

    component.ngOnInit();

    const today = new Date().toISOString().split('T')[0];

    expect(component.form.value).toEqual({
      lodgementDate: today,
      code: null,
      title: null,
    });
  });

  it('initialPatchFormData() uses today and also uses patchedFormData', () => {
    component.patchedFormData = {
      value: {
        applicationCode: 'APP01',
        applicationTitle: 'Title',
      },
    } as ApplicationsListEntryForm;

    component.ngOnInit();

    const today = new Date().toISOString().split('T')[0];

    expect(component.form.value).toEqual({
      lodgementDate: today,
      code: 'APP01',
      title: 'Title',
    });
  });
});
