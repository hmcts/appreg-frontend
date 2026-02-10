import { ChangeDetectorRef } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import { ApplicationCodeGetSummaryDto, ApplicationCodesApi } from '@openapi';

function makeDto(
  overrides: Partial<ApplicationCodeGetSummaryDto> = {},
): ApplicationCodeGetSummaryDto {
  return {
    applicationCode: 'APP01',
    title: 'Test title',
    wording: 'Some wording',
    isFeeDue: false,
    requiresRespondent: false,
    bulkRespondentAllowed: false,
    ...overrides,
  };
}

describe('ApplicationCodeSearchComponent', () => {
  let fixture: ReturnType<
    typeof TestBed.createComponent<ApplicationCodeSearchComponent>
  >;
  let component: ApplicationCodeSearchComponent;
  let apiMock: { getApplicationCodes: jest.Mock };

  beforeEach(async () => {
    apiMock = {
      getApplicationCodes: jest
        .fn()
        .mockReturnValue(of({ content: [makeDto()] })),
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationCodeSearchComponent],
      providers: [{ provide: ApplicationCodesApi, useValue: apiMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCodeSearchComponent);
    component = fixture.componentInstance;
    component.debounceMs = 10; // Faster test execution
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.loading).toBe(false);
    expect(component.errored).toBe(false);
    expect(component.results).toEqual([]);
  });

  it('auto-search: queries after debounce when minChars satisfied', fakeAsync(() => {
    component.minChars = 2;

    component.form.controls.code.setValue('AP');
    tick(component.debounceMs + 1);

    expect(apiMock.getApplicationCodes).toHaveBeenCalledTimes(1);
    expect(apiMock.getApplicationCodes.mock.calls[0][0]).toEqual({
      code: 'AP',
    });
    expect(apiMock.getApplicationCodes.mock.calls[0][1]).toBe('body');
    expect(apiMock.getApplicationCodes.mock.calls[0][2]).toBe(false);
    expect(apiMock.getApplicationCodes.mock.calls[0][3]).toEqual({
      transferCache: false,
    });

    expect(component.loading).toBe(false);
    expect(component.errored).toBe(false);
    expect(component.results).toHaveLength(1);
  }));

  it('auto-search: does not query when below minChars', fakeAsync(() => {
    apiMock.getApplicationCodes.mockClear();
    component.minChars = 3;

    component.form.controls.title.setValue('Hi');
    tick(component.debounceMs + 1);

    expect(apiMock.getApplicationCodes).not.toHaveBeenCalled();
    expect(component.results).toEqual([]);
    expect(component.errored).toBe(false);
    expect(component.loading).toBe(false);
  }));

  it('manual search: with empty params calls GET with {} and emits resultsChange', fakeAsync(() => {
    component.auto = false;
    const resultsSpy = jest.spyOn(component.resultsChange, 'emit');

    component.search();
    tick();

    expect(apiMock.getApplicationCodes).toHaveBeenCalledTimes(1);
    expect(apiMock.getApplicationCodes.mock.calls[0][0]).toEqual({});
    expect(component.loading).toBe(false);
    expect(component.errored).toBe(false);
    expect(resultsSpy).toHaveBeenCalledWith(component.results);
  }));

  it('handles API error by setting errored=true and clearing results', fakeAsync(() => {
    apiMock.getApplicationCodes.mockReturnValueOnce(
      throwError(() => new Error('boom')),
    );

    component.auto = false;
    component.search();
    tick();

    expect(component.errored).toBe(true);
    expect(component.results).toEqual([]);
    expect(component.loading).toBe(false);
  }));

  it('choose(row) emits selectCode', () => {
    const row = makeDto({ applicationCode: 'APP99' });
    const spy = jest.spyOn(component.selectCode, 'emit');

    component.choose(row);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(row);
  });

  it('clear() resets fields, results and calls markForCheck()', () => {
    component.form.patchValue({ code: 'X', title: 'Y' }, { emitEvent: false });
    component.results = [makeDto()];
    component.errored = true;

    const injectedCdr = (component as unknown as { cdr: ChangeDetectorRef })
      .cdr;
    const markSpy = jest.spyOn(injectedCdr, 'markForCheck');

    component.clear();

    expect(component.form.value).toEqual({
      lodgementDate: null,
      code: null,
      title: null,
    });
    expect(component.results).toEqual([]);
    expect(component.errored).toBe(false);
    expect(markSpy).toHaveBeenCalled();
  });
});
