import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ApplicationCodeSearchComponent } from '@components/application-codes-search/application-codes-search.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  ApplicationCodeGetSummaryDto,
  ApplicationCodeSuggestionDto,
  ApplicationCodeSuggestionResponseDto,
  ApplicationCodesApi,
  CodeSuggestionNotice,
} from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import * as helpers from '@util/application-code-helpers';
import { CodeRow, CodeRowsResult } from '@util/application-code-helpers';

// Binds the submit inputs in a template, as the create-entry page does, so a
// submit only reaches the component through change detection.
@Component({
  standalone: true,
  imports: [ApplicationCodeSearchComponent],
  template: `
    <app-application-code-search
      [parentSubmitted]="submitted()"
      [parentSubmitAttempt]="submitAttempt()"
      [enableSuggestions]="true"
      (codeSearchErrors)="onCodeSearchErrors($event)"
    />
  `,
})
class EntrySubmitHostComponent {
  readonly submitted = signal(false);
  readonly submitAttempt = signal(0);
  readonly emittedErrors: ErrorItem[][] = [];

  onCodeSearchErrors(errors: ErrorItem[]): void {
    this.emittedErrors.push(errors);
  }

  // As the create-entry page's onSubmit: resetFlags() sets submitted to false
  // and it is set back to true in the same handler.
  submitEntry(): void {
    this.submitted.set(false);
    this.submitAttempt.update((attempt) => attempt + 1);
    this.submitted.set(true);
  }
}

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
        isFeeDue: '',
      },
      {
        code: 'MS99003',
        title: 'Statutory Declaration - Local Authority Car Park',
        bulk: 'No',
        fee: '—',
        isFeeDue: '',
      },
    ],
    totalPages: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCodeSearchComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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

  it('provides a named field group and searches without nesting a form in the entry form', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(
      element.querySelector('fieldset > legend')?.textContent?.trim(),
    ).toBe('Find an application code');
    expect(element.querySelector('form')).toBeNull();
    const search = jest.spyOn(component, 'search').mockImplementation();
    element.querySelector<HTMLButtonElement>('button.govuk-button')?.click();
    expect(search).toHaveBeenCalledTimes(1);
  });

  it.each([
    'applicationCode',
    'app-code-title',
    'lodgement-date-day',
    'lodgement-date-month',
    'lodgement-date-year',
  ])('Enter in %s searches and cancels implicit parent submission', (id) => {
    const search = jest.spyOn(component, 'search').mockImplementation();
    const input = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLInputElement>(`#${id}`)!;
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('does not search or cancel Enter while composing text', () => {
    const search = jest.spyOn(component, 'search').mockImplementation();
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      '#applicationCode',
    )!;
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
      isComposing: true,
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(search).not.toHaveBeenCalled();
  });

  it('prevents held Enter from submitting the parent or issuing repeated searches', () => {
    const search = jest.spyOn(component, 'search').mockImplementation();
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      '#applicationCode',
    )!;
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
      repeat: true,
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(search).not.toHaveBeenCalled();
  });

  it.each(['Tab', 'Escape', 'a'])(
    'leaves %s in a search field unchanged',
    (key) => {
      const search = jest.spyOn(component, 'search').mockImplementation();
      const input = (fixture.nativeElement as HTMLElement).querySelector(
        '#applicationCode',
      )!;
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(search).not.toHaveBeenCalled();
    },
  );

  it('leaves Enter on Search and Clear available for native button activation', () => {
    const search = jest.spyOn(component, 'search').mockImplementation();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'fieldset > .govuk-button-group button',
    );
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      button.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(search).not.toHaveBeenCalled();
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

    component.form.patchValue({
      lodgementDate: '2024-01-01',
      code: ' MS99004 ',
      title: ' Statutory ',
    });

    component.search();

    expect(component.submitted()).toBe(true);
    // fetchCodeRows$ should be called with trimmed values
    expect(fetchSpy).toHaveBeenCalledWith(
      apiMock,
      {
        code: 'MS99004',
        title: 'Statutory',
        date: '2024-01-01',
        pageNumber: 0,
        pageSize: 10,
        sort: ['code,asc'],
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
    component.form.patchValue({ lodgementDate: '2024-02-01' });

    component.search();

    expect(fetchSpy).toHaveBeenCalledWith(
      apiMock,
      {
        code: undefined,
        title: undefined,
        date: '2024-02-01',
        pageNumber: 3,
        pageSize: 25,
        sort: ['code,asc'],
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

    component.form.patchValue({
      lodgementDate: '2024-03-01',
      code: null,
      title: null,
    });

    component.search();

    expect(fetchSpy).toHaveBeenCalledWith(
      apiMock,
      {
        code: undefined,
        title: undefined,
        date: '2024-03-01',
        pageNumber: 0,
        pageSize: 10,
        sort: ['code,asc'],
      },
      true,
    );
    expect(component.codesRows).toEqual([]);
  });

  it('shows no-results message after a date-only search returns no rows', () => {
    jest.spyOn(helpers, 'fetchCodeRows$').mockReturnValue(
      of({
        rows: [],
        totalPages: 0,
      }),
    );

    component.form.patchValue({
      lodgementDate: '1901-01-01',
      code: null,
      title: null,
    });

    component.search();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No application codes found',
    );
  });

  it('search() should handle API error', () => {
    jest
      .spyOn(helpers, 'fetchCodeRows$')
      .mockReturnValue(throwError(() => new Error('404')));

    component.search();

    expect(component.loading()).toBe(false);
    expect(component.errored()).toBe(true);
  });

  it('search() keeps existing rows visible while a refetch is in progress', () => {
    const pending$ = new Subject<CodeRowsResult>();
    jest.spyOn(helpers, 'fetchCodeRows$').mockReturnValue(pending$);

    component.codesRows = mockRows.rows.slice();

    component.search();

    expect(component.codesRows).toEqual(mockRows.rows);
    expect(component.loading()).toBe(true);
  });

  it('search() should not call fetchCodeRows$ when code exceeds max length', () => {
    const fetchSpy = jest.spyOn(helpers, 'fetchCodeRows$');
    const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

    component.form.patchValue({ code: '12345678901' });
    component.search();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
    expect(component.codeError()).toBe(
      'Application code must be 10 characters or fewer',
    );
    expect(errorsSpy).toHaveBeenCalledWith([
      {
        id: 'code',
        text: 'Application code must be 10 characters or fewer',
        href: '#applicationCode',
      },
    ]);
    expect(component.hasSearched()).toBe(false);
  });

  it('does not show the max length error before search or parent submit', () => {
    const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

    component.form.patchValue({ code: '12345678901' });

    expect(component.codeError()).toBeNull();
    expect(errorsSpy).not.toHaveBeenCalled();
  });

  it('shows the parent required error when application code is missing on submit', () => {
    const parentForm = TestBed.inject(
      ApplicationListEntryFormService,
    ).createForms().form;
    parentForm.controls.applicationCode.updateValueAndValidity();
    componentRef.setInput('patchedFormData', parentForm);
    componentRef.setInput('parentSubmitted', true);
    fixture.detectChanges();

    expect(component.codeError()).toBe('Enter an application code');
    expect(
      fixture.nativeElement.querySelector('.govuk-input--error'),
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Enter an application code',
    );
  });

  it('treats lodgement date as a search filter for no-results display', () => {
    component.form.patchValue({
      lodgementDate: '1000-01-01',
      code: null,
      title: null,
    });

    expect(component.hasSearchFilter()).toBe(true);
  });

  it('onAddCode() should emit selectCodeAndLodgementDate when valid', () => {
    const emitSpy = jest.spyOn(component.selectCodeAndLodgementDate, 'emit');

    component.form.patchValue({ lodgementDate: '2024-01-01' });
    component.hasSearched.set(true);

    const rowWithWhitespace: CodeRow = {
      applicationCodeId: 42,
      code: ` ${mockRows.rows[0].code} `,
      title: ` ${mockRows.rows[0].title} `,
      bulk: mockRows.rows[0].bulk,
      fee: mockRows.rows[0].fee,
      isFeeDue: '',
    };

    component.onAddCode(rowWithWhitespace);

    expect(emitSpy).toHaveBeenCalledWith({
      code: mockRows.rows[0].code,
      applicationCodeId: 42,
      date: '2024-01-01',
    });

    expect(component.form.value.code).toBe(mockRows.rows[0].code);
    expect(component.form.value.title).toBe(mockRows.rows[0].title);

    expect(component.submitted()).toBe(false);
    expect(component.hasSearched()).toBe(false);
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
    const codeSearchErrorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

    component.form.patchValue({ code: 'X', title: 'Y' });
    component.codesRows = mockRows.rows.slice();
    component.errored.set(true);
    component.totalPages.set(8);
    component.currentPage.set(4);
    component.hasSearched.set(true);

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
    expect(codeSearchErrorsSpy).toHaveBeenCalledWith([]);
    expect(component.hasSearched()).toBe(false);
  });

  it('does not mark no-results state after an invalid search becomes valid again', () => {
    const fetchSpy = jest.spyOn(helpers, 'fetchCodeRows$');

    component.form.patchValue({ code: '12345678901' });
    component.search();
    expect(component.hasSearched()).toBe(false);

    component.form.patchValue({ code: '1234567890' });

    expect(component.hasSearched()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
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

  it('onPageChange() should not change page when code exceeds max length', () => {
    const searchSpy = jest
      .spyOn(component, 'search')
      .mockImplementation(() => undefined);
    const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

    component.form.patchValue({ code: '12345678901' });
    component.onPageChange(5);

    expect(component.currentPage()).toBe(0);
    expect(searchSpy).not.toHaveBeenCalled();
    expect(errorsSpy).toHaveBeenCalledWith([
      {
        id: 'code',
        text: 'Application code must be 10 characters or fewer',
        href: '#applicationCode',
      },
    ]);
  });

  it('onSortChange() should reset to page 0 and search with mapped API sort', () => {
    const fetchSpy = jest
      .spyOn(helpers, 'fetchCodeRows$')
      .mockReturnValue(of(mockRows));

    component.currentPage.set(4);
    component.form.patchValue({
      lodgementDate: '2024-04-01',
      code: 'MS99004',
    });

    component.onSortChange({ key: 'title', direction: 'desc' });

    expect(component.currentPage()).toBe(0);
    expect(component.sortField()).toEqual({ key: 'title', direction: 'desc' });
    expect(fetchSpy).toHaveBeenCalledWith(
      apiMock,
      {
        code: 'MS99004',
        title: undefined,
        date: '2024-04-01',
        pageNumber: 0,
        pageSize: 10,
        sort: ['title,desc'],
      },
      true,
    );
  });

  it('maps fee required sorting to the backend feeDue key', () => {
    const fetchSpy = jest
      .spyOn(helpers, 'fetchCodeRows$')
      .mockReturnValue(of(mockRows));

    component.onSortChange({ key: 'isFeeDue', direction: 'asc' });

    expect(fetchSpy).toHaveBeenCalledWith(
      apiMock,
      expect.objectContaining({
        sort: ['feeDue,asc'],
      }),
      true,
    );
  });

  it('uses the lodgement date when searching in disabled mode', () => {
    const fetchSpy = jest
      .spyOn(helpers, 'fetchCodeRows$')
      .mockReturnValue(of(mockRows));

    componentRef.setInput('lodgementDateDisabled', true);
    fixture.detectChanges();
    component.form.controls.lodgementDate.setValue('2026-04-13');

    component.search();

    expect(fetchSpy).toHaveBeenCalledWith(
      apiMock,
      expect.objectContaining({
        date: '2026-04-13',
      }),
      true,
    );
  });

  it('emits validation errors when the parent submit state turns on', () => {
    const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

    component.form.patchValue({ code: '12345678901' });
    componentRef.setInput('parentSubmitted', true);
    fixture.detectChanges();

    expect(errorsSpy).toHaveBeenCalledWith([
      {
        id: 'code',
        text: 'Application code must be 10 characters or fewer',
        href: '#applicationCode',
      },
    ]);
  });

  it('initialPatchFormData() should use patchedFormData when provided', () => {
    componentRef.setInput('patchedFormData', {
      value: {
        lodgementDate: '2023-01-01',
        applicationCode: 'APP01',
        applicationTitle: 'Title',
      },
    });

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
    });

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
    });

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
    });

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

  describe('code suggestions', () => {
    const suggestionsPath = '/application-codes/suggestions';
    const description =
      'Synthetic Council asks for a warrant to enter a synthetic address';
    const lodgementDate = '2026-11-02';
    const unavailable =
      'Code suggestions are not available. Search for a code instead.';
    const suggestionsShown =
      'Suggested codes are shown in the table, best match first. Check a code is right before you add it.';
    const needsMoreDetail =
      'Add more detail to the description to get better code suggestions.';
    const descriptionError = {
      id: 'codeSuggestionDescription',
      text: 'Enter a description of the application',
      href: '#code-suggestion-description',
    };

    let httpMock: HttpTestingController;

    function codeSummary(
      overrides: Partial<ApplicationCodeGetSummaryDto> = {},
    ): ApplicationCodeGetSummaryDto {
      return {
        applicationCodeId: 99001,
        applicationCode: 'AP99001',
        title: 'Synthetic code title 1',
        wording: { template: 'Synthetic wording' },
        isFeeDue: true,
        requiresRespondent: false,
        bulkRespondentAllowed: false,
        feeReference: 'SYN1',
        feeAmount: { value: 1000 },
        ...overrides,
      };
    }

    function suggestion(
      rank: number,
      overrides: Partial<ApplicationCodeSuggestionDto> = {},
    ): ApplicationCodeSuggestionDto {
      return {
        rank,
        reason: `Matches 'synthetic ${rank}' in the title`,
        activeOnLodgementDate: true,
        applicationCode: codeSummary({
          applicationCodeId: 99000 + rank,
          applicationCode: `AP9900${rank}`,
          title: `Synthetic code title ${rank}`,
        }),
        ...overrides,
      };
    }

    function suggestionResponse(
      overrides: Partial<ApplicationCodeSuggestionResponseDto> = {},
    ): ApplicationCodeSuggestionResponseDto {
      return {
        suggestionId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        suggestions: [suggestion(1), suggestion(2)],
        needsMoreDetail: false,
        notices: [],
        ...overrides,
      };
    }

    function host(): HTMLElement {
      return fixture.nativeElement as HTMLElement;
    }

    function text(element: Element | null | undefined): string {
      return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    }

    function enableSuggestions(): void {
      componentRef.setInput('enableSuggestions', true);
      fixture.detectChanges();
    }

    function textarea(): HTMLTextAreaElement {
      return host().querySelector<HTMLTextAreaElement>(
        '#code-suggestion-description',
      )!;
    }

    function describeApplication(value: string): void {
      textarea().value = value;
      textarea().dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    function button(label: string): HTMLButtonElement | undefined {
      return Array.from(
        host().querySelectorAll<HTMLButtonElement>('button'),
      ).find((element) => text(element) === label);
    }

    function clickSuggestCodes(): void {
      button('Suggest codes')!.click();
      fixture.detectChanges();
    }

    function expectSuggestionRequest(): TestRequest {
      return httpMock.expectOne((req) => req.url.endsWith(suggestionsPath));
    }

    function requestSuggestions(
      response: ApplicationCodeSuggestionResponseDto = suggestionResponse(),
    ): TestRequest {
      describeApplication(description);
      clickSuggestCodes();
      const req = expectSuggestionRequest();
      req.flush(response);
      fixture.detectChanges();
      return req;
    }

    function failSuggestions(status: number): void {
      describeApplication(description);
      clickSuggestCodes();
      const req = expectSuggestionRequest();
      if (status === 0) {
        req.error(new ProgressEvent('error'));
      } else {
        req.flush(
          { title: 'Synthetic problem', detail: 'Synthetic problem detail' },
          { status, statusText: 'Synthetic status' },
        );
      }
      fixture.detectChanges();
    }

    function statusRegion(): HTMLElement | null {
      return host().querySelector<HTMLElement>('#code-suggestions-status');
    }

    function statusError(): string {
      return text(
        statusRegion()?.querySelector('.moj-alert--error .moj-alert__content'),
      );
    }

    function statusMessages(): string[] {
      return Array.from(
        statusRegion()?.querySelectorAll('.govuk-inset-text p') ?? [],
      ).map(text);
    }

    function caption(): string {
      return text(host().querySelector('#codes-table caption'));
    }

    function tableHeaders(): string[] {
      return Array.from(host().querySelectorAll('#codes-table thead th')).map(
        text,
      );
    }

    function tableRows(): string[][] {
      return Array.from(host().querySelectorAll('#codes-table tbody tr')).map(
        (row) => Array.from(row.children).map(text),
      );
    }

    function searchManually(code: string): jest.SpyInstance {
      const fetchSpy = jest
        .spyOn(helpers, 'fetchCodeRows$')
        .mockReturnValue(of(mockRows));
      component.form.controls.code.setValue(code);
      component.search();
      fixture.detectChanges();
      return fetchSpy;
    }

    beforeEach(() => {
      httpMock = TestBed.inject(HttpTestingController);
      component.form.controls.lodgementDate.setValue(lodgementDate);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('hides the description field and Suggest codes button unless suggestions are enabled', () => {
      expect(component.enableSuggestions()).toBe(false);
      expect(textarea()).toBeNull();
      expect(button('Suggest codes')).toBeUndefined();
      expect(statusRegion()).toBeNull();

      enableSuggestions();

      expect(textarea()).not.toBeNull();
      expect(button('Suggest codes')?.type).toBe('button');
      expect(statusRegion()).not.toBeNull();

      componentRef.setInput('enableSuggestions', false);
      fixture.detectChanges();

      expect(textarea()).toBeNull();
      expect(button('Suggest codes')).toBeUndefined();
    });

    it('labels the description, tells users not to include personal details and counts up to 1000 characters', () => {
      enableSuggestions();

      expect(
        text(host().querySelector('label[for="code-suggestion-description"]')),
      ).toBe('Describe the application');
      expect(
        text(host().querySelector('#code-suggestion-description-guidance')),
      ).toBe(
        'Codes are suggested using AI. Do not include names or other personal details.',
      );
      expect(textarea().maxLength).toBe(1000);
      expect(textarea().getAttribute('aria-describedby')).toBe(
        'code-suggestion-description-guidance code-suggestion-description-hint',
      );
      expect(
        text(host().querySelector('#code-suggestion-description-hint')),
      ).toBe('You have 1000 characters remaining');

      describeApplication('Synthetic');

      expect(
        text(host().querySelector('#code-suggestion-description-hint')),
      ).toBe('You have 991 characters remaining');
    });

    it('sends the trimmed description only in the POST body, with the lodgement date and no transfer cache', () => {
      enableSuggestions();
      describeApplication(`  ${description}\n `);
      clickSuggestCodes();

      const req = expectSuggestionRequest();
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toStrictEqual({ description, lodgementDate });
      expect(req.request.params.keys()).toEqual([]);
      expect(req.request.urlWithParams).not.toContain('?');
      expect(decodeURIComponent(req.request.urlWithParams)).not.toContain(
        'Synthetic',
      );
      expect(req.request.transferCache).toBe(false);
      req.flush(suggestionResponse());
    });

    it('leaves out the lodgement date when there is none', () => {
      enableSuggestions();
      component.form.controls.lodgementDate.setValue(null);
      describeApplication(description);
      clickSuggestCodes();

      const req = expectSuggestionRequest();
      expect(req.request.body).toStrictEqual({ description });
      req.flush(suggestionResponse());
    });

    it.each(['2026-11', '02/11/2026', '2026-11-02T00:00:00'])(
      'leaves out a lodgement date %j that is not yyyy-MM-dd',
      (value) => {
        component.form.controls.lodgementDate.setValue(value);
        enableSuggestions();
        describeApplication(description);
        clickSuggestCodes();

        const req = expectSuggestionRequest();
        expect(req.request.body).toStrictEqual({ description });
        req.flush(suggestionResponse());
      },
    );

    it.each(['', '  \n\t  '])(
      'blocks the description %j with an error and sends no request',
      (value) => {
        enableSuggestions();
        const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

        describeApplication(value);
        clickSuggestCodes();

        httpMock.expectNone((req) => req.url.endsWith(suggestionsPath));
        expect(
          text(host().querySelector('#code-suggestion-description-error')),
        ).toBe('Error: Enter a description of the application');
        expect(
          host().querySelector('#code-suggestions > .govuk-form-group--error'),
        ).not.toBeNull();
        expect(textarea().getAttribute('aria-invalid')).toBe('true');
        expect(textarea().getAttribute('aria-describedby')).toBe(
          'code-suggestion-description-guidance code-suggestion-description-error code-suggestion-description-hint',
        );
        expect(errorsSpy).toHaveBeenCalledWith([descriptionError]);
        expect(text(statusRegion())).toBe('');
      },
    );

    it('blocks a description longer than 1000 characters and sends one of 1000', () => {
      enableSuggestions();

      component.descriptionControl.setValue('a'.repeat(1001));
      clickSuggestCodes();

      httpMock.expectNone((req) => req.url.endsWith(suggestionsPath));
      expect(component.descriptionError()).toBe(
        'Description must be 1000 characters or fewer',
      );

      component.descriptionControl.setValue('a'.repeat(1000));
      clickSuggestCodes();

      expect(component.descriptionError()).toBeNull();
      expectSuggestionRequest().flush(suggestionResponse());
    });

    it('clears the description error from the page errors once a description is sent', () => {
      enableSuggestions();
      const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

      clickSuggestCodes();
      expect(errorsSpy).toHaveBeenLastCalledWith([descriptionError]);

      describeApplication(description);
      clickSuggestCodes();

      expect(errorsSpy).toHaveBeenLastCalledWith([]);
      expect(
        host().querySelector('#code-suggestion-description-error'),
      ).toBeNull();
      expectSuggestionRequest().flush(suggestionResponse());
    });

    it('does not emit page errors when a description is sent with no earlier error', () => {
      enableSuggestions();
      const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

      requestSuggestions();

      expect(errorsSpy).not.toHaveBeenCalled();
    });

    it('reports search errors with the description error only once the user has searched', () => {
      enableSuggestions();
      const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');
      const codeError = {
        id: 'code',
        text: 'Application code must be 10 characters or fewer',
        href: '#applicationCode',
      };
      component.form.controls.code.setValue('12345678901');

      clickSuggestCodes();
      expect(errorsSpy).toHaveBeenLastCalledWith([descriptionError]);

      component.search();
      fixture.detectChanges();
      expect(component.descriptionError()).toBeNull();
      expect(errorsSpy).toHaveBeenLastCalledWith([codeError]);

      clickSuggestCodes();
      expect(errorsSpy).toHaveBeenLastCalledWith([codeError, descriptionError]);
    });

    it('clears the description error from the page errors when the user searches', () => {
      enableSuggestions();
      const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

      clickSuggestCodes();
      expect(errorsSpy).toHaveBeenLastCalledWith([descriptionError]);

      searchManually('AP99001');

      expect(component.descriptionError()).toBeNull();
      expect(errorsSpy).toHaveBeenLastCalledWith([]);
      expect(
        host().querySelector('#code-suggestion-description-error'),
      ).toBeNull();
      expect(textarea().getAttribute('aria-invalid')).not.toBe('true');
    });

    it('announces Finding codes… and then the result in a polite live region', () => {
      enableSuggestions();
      const region = statusRegion()!;
      expect(region.getAttribute('aria-live')).toBe('polite');

      describeApplication(description);
      clickSuggestCodes();

      expect(text(statusRegion())).toBe('Finding codes…');
      expect(component.suggestionsLoading()).toBe(true);

      expectSuggestionRequest().flush(suggestionResponse());
      fixture.detectChanges();

      expect(statusRegion()).toBe(region);
      expect(statusMessages()).toEqual([suggestionsShown]);
      expect(component.suggestionsLoading()).toBe(false);
    });

    it('fills the codes table with suggestions, best match first, with reason, fee required and the lodgement date flag', () => {
      enableSuggestions();

      requestSuggestions(
        suggestionResponse({
          suggestions: [
            suggestion(2, {
              reason: "Matches 'warrant to enter' in the title",
              activeOnLodgementDate: false,
              applicationCode: codeSummary({
                applicationCodeId: 99002,
                applicationCode: 'AP99002',
                title: 'Synthetic code title 2',
                isFeeDue: false,
                bulkRespondentAllowed: true,
              }),
            }),
            suggestion(1, {
              reason: "Matches 'stolen goods' in the title",
              activeOnLodgementDate: null,
            }),
            suggestion(3, { activeOnLodgementDate: true }),
          ],
        }),
      );

      expect(caption()).toBe('Suggested codes');
      expect(tableHeaders()).toEqual([
        'Code',
        'Title',
        'Reason',
        'Bulk',
        'Fee required',
        'Lodgement date',
        'Actions',
      ]);
      expect(tableRows()).toEqual([
        [
          'AP99001',
          'Synthetic code title 1',
          "Matches 'stolen goods' in the title",
          'No',
          'Yes',
          '',
          'Add code',
        ],
        [
          'AP99002',
          'Synthetic code title 2',
          "Matches 'warrant to enter' in the title",
          'Yes',
          'No',
          'Not active on the lodgement date',
          'Add code',
        ],
        [
          'AP99003',
          'Synthetic code title 3',
          "Matches 'synthetic 3' in the title",
          'No',
          'Yes',
          '',
          'Add code',
        ],
      ]);
      // Suggestions keep the API's ranking: no sorting and no paging.
      expect(host().querySelector('#codes-table thead button')).toBeNull();
      expect(host().querySelector('#codes-table [aria-sort]')).toBeNull();
      expect(host().querySelector('.govuk-pagination')).toBeNull();
      expect(host().textContent).not.toContain('No application codes found');
    });

    it('selects nothing when suggestions arrive', () => {
      enableSuggestions();
      const selectSpy = jest.spyOn(
        component.selectCodeAndLodgementDate,
        'emit',
      );

      requestSuggestions();

      expect(tableRows()).toHaveLength(2);
      expect(selectSpy).not.toHaveBeenCalled();
      expect(component.form.getRawValue()).toEqual({
        lodgementDate,
        code: null,
        title: null,
      });
      expect(
        host().querySelector('#codes-table input, .govuk-table__row--selected'),
      ).toBeNull();
    });

    it('adds a suggested code through the unchanged Add code flow', () => {
      enableSuggestions();
      const selectSpy = jest.spyOn(
        component.selectCodeAndLodgementDate,
        'emit',
      );
      requestSuggestions();

      host()
        .querySelectorAll<HTMLButtonElement>('#codes-table tbody button')[1]
        .click();
      fixture.detectChanges();

      expect(selectSpy).toHaveBeenCalledTimes(1);
      expect(selectSpy).toHaveBeenCalledWith({
        code: 'AP99002',
        applicationCodeId: 99002,
        date: lodgementDate,
      });
      expect(component.form.value.code).toBe('AP99002');
      expect(component.form.value.title).toBe('Synthetic code title 2');
      expect(host().querySelector('#codes-table')).toBeNull();
      expect(component.showingSuggestions()).toBe(false);
      expect(text(statusRegion())).toBe('');
    });

    it.each([
      ['needsMoreDetail alone', []],
      ['needsMoreDetail with DESCRIPTION_TOO_VAGUE', ['DESCRIPTION_TOO_VAGUE']],
    ])('shows the needs more detail copy once for %s', (_label, notices) => {
      enableSuggestions();

      requestSuggestions(
        suggestionResponse({
          needsMoreDetail: true,
          notices: notices as CodeSuggestionNotice[],
        }),
      );

      expect(statusMessages()).toEqual([suggestionsShown, needsMoreDetail]);
    });

    it.each([
      [
        CodeSuggestionNotice.CODES_NOT_ACTIVE_ON_LODGEMENT_DATE,
        'At least one suggested code was not active on the lodgement date. Check the lodgement date before you add a code.',
      ],
      [
        CodeSuggestionNotice.UNKNOWN_CODES_DROPPED,
        'Some codes were left out because they do not exist or are not active today.',
      ],
      [CodeSuggestionNotice.DESCRIPTION_TOO_VAGUE, needsMoreDetail],
    ])('shows fixed copy for the %s notice', (notice, copy) => {
      enableSuggestions();

      requestSuggestions(suggestionResponse({ notices: [notice] }));

      expect(statusMessages()).toEqual([suggestionsShown, copy]);
    });

    it('ignores notices it does not know', () => {
      enableSuggestions();

      requestSuggestions(
        suggestionResponse({
          notices: ['SYNTHETIC_NEW_NOTICE' as CodeSuggestionNotice],
        }),
      );

      expect(statusMessages()).toEqual([suggestionsShown]);
    });

    it('shows the no suggestions copy and no table when no codes are suggested', () => {
      enableSuggestions();

      requestSuggestions(suggestionResponse({ suggestions: [] }));

      expect(statusMessages()).toEqual([
        'No codes were suggested for that description. Add more detail, or search for a code instead.',
      ]);
      expect(host().querySelector('#codes-table')).toBeNull();
      expect(host().textContent).not.toContain('No application codes found');
    });

    it('renders suggestion reasons as text, not HTML', () => {
      enableSuggestions();
      const reason =
        '<img src="x" id="synthetic-injected"> Matches \'synthetic\' in the title';

      requestSuggestions(
        suggestionResponse({ suggestions: [suggestion(1, { reason })] }),
      );

      expect(host().querySelector('#synthetic-injected')).toBeNull();
      expect(tableRows()[0][2]).toBe(reason);
    });

    it.each([
      [0, unavailable],
      [400, unavailable],
      [403, unavailable],
      [404, unavailable],
      [
        422,
        'We could not suggest any codes from that description. Add more detail, or search for a code instead.',
      ],
      [429, 'You have made too many requests. Try again in a minute.'],
      [500, unavailable],
      [502, unavailable],
      [503, unavailable],
      [504, unavailable],
    ])(
      'shows fixed copy for a %i error and keeps manual search usable',
      (status, copy) => {
        enableSuggestions();

        failSuggestions(status);

        expect(statusError()).toBe(copy);
        expect(text(statusRegion())).not.toContain('Synthetic');
        expect(component.suggestionsLoading()).toBe(false);
        expect(host().querySelector('#codes-table')).toBeNull();

        const search = button('Search')!;
        expect(search.disabled).toBe(false);
        const fetchSpy = jest
          .spyOn(helpers, 'fetchCodeRows$')
          .mockReturnValue(of(mockRows));
        component.form.controls.code.setValue('MS99004');
        search.click();
        fixture.detectChanges();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(caption()).toBe('Codes');
        expect(tableRows().map((row) => row[0])).toEqual([
          'MS99004',
          'MS99003',
        ]);
        expect(text(statusRegion())).toBe('');
      },
    );

    it('uses the unavailable copy for any other error', () => {
      enableSuggestions();

      failSuggestions(418);

      expect(statusError()).toBe(unavailable);
    });

    it('never writes the description to the console', () => {
      const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
        (method) =>
          jest.spyOn(console, method).mockImplementation(() => undefined),
      );

      try {
        enableSuggestions();
        requestSuggestions();
        failSuggestions(503);

        for (const spy of spies) {
          const logged = spy.mock.calls
            .flat()
            .map((arg) => String(arg))
            .join(' ');
          expect(logged).not.toContain(description);
        }
      } finally {
        spies.forEach((spy) => spy.mockRestore());
      }
    });

    it('cancels a pending suggestion request when another is sent', () => {
      enableSuggestions();
      describeApplication(description);
      clickSuggestCodes();
      const first = expectSuggestionRequest();

      clickSuggestCodes();
      const second = expectSuggestionRequest();

      expect(first.cancelled).toBe(true);
      second.flush(suggestionResponse());
      fixture.detectChanges();
      expect(tableRows()).toHaveLength(2);
    });

    it('replaces suggestions with search results and cancels a pending request when the user searches', () => {
      enableSuggestions();
      requestSuggestions();
      clickSuggestCodes();
      const pending = expectSuggestionRequest();

      searchManually('MS99004');

      expect(pending.cancelled).toBe(true);
      expect(caption()).toBe('Codes');
      expect(tableHeaders()).toEqual([
        'Code',
        'Title',
        'Bulk',
        'Fee required',
        'Actions',
      ]);
      expect(tableRows().map((row) => row[0])).toEqual(['MS99004', 'MS99003']);
      expect(host().querySelector('.govuk-pagination')).not.toBeNull();
      expect(text(statusRegion())).toBe('');
    });

    it('cancels a pending search when suggestions are requested', () => {
      enableSuggestions();
      const pending$ = new Subject<CodeRowsResult>();
      jest.spyOn(helpers, 'fetchCodeRows$').mockReturnValue(pending$);
      component.form.controls.code.setValue('MS99004');
      component.search();
      expect(pending$.observed).toBe(true);

      requestSuggestions();

      expect(pending$.observed).toBe(false);
      expect(component.loading()).toBe(false);
      expect(tableRows().map((row) => row[0])).toEqual(['AP99001', 'AP99002']);
    });

    it('cancels a pending search when the user searches again', () => {
      const first$ = new Subject<CodeRowsResult>();
      jest.spyOn(helpers, 'fetchCodeRows$').mockReturnValue(first$);
      component.search();
      expect(first$.observed).toBe(true);

      searchManually('MS99004');

      expect(first$.observed).toBe(false);
      expect(component.codesRows).toEqual(mockRows.rows);
    });

    it('clear() removes suggestions and the description error but keeps the description', () => {
      enableSuggestions();
      requestSuggestions();

      component.clear();
      fixture.detectChanges();

      expect(host().querySelector('#codes-table')).toBeNull();
      expect(component.showingSuggestions()).toBe(false);
      expect(text(statusRegion())).toBe('');
      expect(component.descriptionControl.value).toBe(description);

      describeApplication(' ');
      clickSuggestCodes();
      expect(component.descriptionError()).not.toBeNull();

      component.clear();
      fixture.detectChanges();

      expect(component.descriptionError()).toBeNull();
      expect(
        host().querySelector('#code-suggestion-description-error'),
      ).toBeNull();
    });

    it('does not report the description error when the entry is submitted', () => {
      enableSuggestions();
      clickSuggestCodes();
      expect(component.descriptionError()).not.toBeNull();
      const errorsSpy = jest.spyOn(component.codeSearchErrors, 'emit');

      componentRef.setInput('parentSubmitted', true);
      fixture.detectChanges();

      expect(errorsSpy).toHaveBeenLastCalledWith([]);
      expect(
        host().querySelector('#code-suggestion-description-error'),
      ).toBeNull();
    });

    describe('when the entry is submitted again', () => {
      let hostFixture: ComponentFixture<EntrySubmitHostComponent>;
      let entryHost: EntrySubmitHostComponent;
      let search: ApplicationCodeSearchComponent;

      function hostElement(): HTMLElement {
        return hostFixture.nativeElement as HTMLElement;
      }

      function submitEntry(): void {
        entryHost.submitEntry();
        hostFixture.detectChanges();
      }

      beforeEach(() => {
        hostFixture = TestBed.createComponent(EntrySubmitHostComponent);
        entryHost = hostFixture.componentInstance;
        hostFixture.detectChanges();
        search = hostFixture.debugElement.query(
          By.directive(ApplicationCodeSearchComponent),
        ).componentInstance as ApplicationCodeSearchComponent;
      });

      it('clears the description error and leaves it out of the page errors', () => {
        submitEntry();
        expect(entryHost.emittedErrors.at(-1)).toEqual([]);

        Array.from(hostElement().querySelectorAll('button'))
          .find((element) => text(element) === 'Suggest codes')!
          .click();
        hostFixture.detectChanges();
        expect(search.descriptionError()).not.toBeNull();
        expect(entryHost.emittedErrors.at(-1)).toEqual([descriptionError]);
        const field = hostElement().querySelector<HTMLTextAreaElement>(
          '#code-suggestion-description',
        )!;
        expect(field.getAttribute('aria-invalid')).toBe('true');

        // parentSubmitted stays true, so only the attempt count changes.
        submitEntry();

        expect(search.parentSubmitted()).toBe(true);
        expect(search.descriptionError()).toBeNull();
        expect(
          hostElement().querySelector('#code-suggestion-description-error'),
        ).toBeNull();
        expect(field.getAttribute('aria-invalid')).not.toBe('true');
        expect(entryHost.emittedErrors.at(-1)).toEqual([]);
      });

      it('reports the search errors again on every entry submit', () => {
        const codeError = {
          id: 'code',
          text: 'Application code must be 10 characters or fewer',
          href: '#applicationCode',
        };
        search.form.controls.code.setValue('12345678901');

        submitEntry();
        expect(entryHost.emittedErrors).toEqual([[codeError]]);

        submitEntry();
        expect(entryHost.emittedErrors).toEqual([[codeError], [codeError]]);
      });
    });

    describe('searchedApplicationCode', () => {
      function sentBody(): Record<string, unknown> {
        describeApplication(description);
        clickSuggestCodes();
        const req = expectSuggestionRequest();
        const body = req.request.body as Record<string, unknown>;
        req.flush(suggestionResponse());
        fixture.detectChanges();
        return body;
      }

      it('sends the first code the user searched for before asking for suggestions', () => {
        enableSuggestions();
        searchManually(' AP99001 ');
        searchManually('AP99002');

        expect(sentBody()).toStrictEqual({
          description,
          lodgementDate,
          searchedApplicationCode: 'AP99001',
        });
      });

      it('leaves it out when the user searched for no code', () => {
        enableSuggestions();
        jest.spyOn(helpers, 'fetchCodeRows$').mockReturnValue(of(mockRows));
        component.form.patchValue({ title: 'Synthetic title' });
        component.search();

        expect(sentBody()).toStrictEqual({ description, lodgementDate });
      });

      it('skips searched codes that are not 1 to 10 letters and digits', () => {
        enableSuggestions();
        const fetchSpy = searchManually('AP-99001');
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        // Blocked by validation, so no search runs.
        searchManually('12345678901');
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        searchManually('AP99003');
        expect(fetchSpy).toHaveBeenCalledTimes(2);

        expect(sentBody()['searchedApplicationCode']).toBe('AP99003');
      });

      it('does not count codes searched for after asking for suggestions', () => {
        enableSuggestions();
        sentBody();
        searchManually('AP99001');

        expect(sentBody()).toStrictEqual({ description, lodgementDate });
      });

      it('keeps sending the code searched for before the first request', () => {
        enableSuggestions();
        searchManually('AP99001');
        sentBody();
        component.clear();
        searchManually('AP99002');

        expect(sentBody()['searchedApplicationCode']).toBe('AP99001');
      });
    });
  });
});
