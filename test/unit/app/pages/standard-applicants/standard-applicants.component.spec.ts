import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { StandardApplicants } from '@components/standard-applicants/standard-applicants.component';
import { StandardApplicantPage, StandardApplicantsApi } from '@openapi';
import { StandardApplicantsSearchFormService } from '@services/standard-applicants/standard-applicants-search-form.service';
import { StandardApplicantsSearchStateService } from '@services/standard-applicants/standard-applicants-search-state.service';

const flushSignalEffects = async (
  fixture: ComponentFixture<StandardApplicants>,
): Promise<void> => {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};

describe('StandardApplicantsComponent', () => {
  let component: StandardApplicants;
  let fixture: ComponentFixture<StandardApplicants>;
  let router: Router;
  let route: ActivatedRoute;
  let searchForm: StandardApplicantsSearchFormService;
  let searchState: StandardApplicantsSearchStateService;
  const getStandardApplicantsMock = jest.fn<
    Observable<StandardApplicantPage>,
    Parameters<
      (
        requestParameters?: Parameters<
          StandardApplicantsApi['getStandardApplicants']
        >[0],
        observe?: 'body',
        reportProgress?: boolean,
        options?: Parameters<StandardApplicantsApi['getStandardApplicants']>[3],
      ) => Observable<StandardApplicantPage>
    >
  >();
  const standardApplicantsExportMock = jest.fn<
    Observable<HttpResponse<string>>,
    Parameters<
      (
        requestParameters?: Parameters<
          StandardApplicantsApi['standardApplicantsExport']
        >[0],
        observe?: 'response',
        reportProgress?: boolean,
        options?: Parameters<
          StandardApplicantsApi['standardApplicantsExport']
        >[3],
      ) => Observable<HttpResponse<string>>
    >
  >();
  const apiStub: Pick<
    StandardApplicantsApi,
    'getStandardApplicants' | 'standardApplicantsExport'
  > = {
    getStandardApplicants:
      getStandardApplicantsMock as unknown as StandardApplicantsApi['getStandardApplicants'],
    standardApplicantsExport:
      standardApplicantsExportMock as unknown as StandardApplicantsApi['standardApplicantsExport'],
  };

  beforeEach(async () => {
    getStandardApplicantsMock.mockReset();
    standardApplicantsExportMock.mockReset();
    getStandardApplicantsMock.mockReturnValue(
      of({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 0,
        content: [],
        elementsOnPage: 0,
        totalPages: 0,
      }),
    );
    standardApplicantsExportMock.mockReturnValue(
      of(
        new HttpResponse({
          body: 'code,name\nSA01,Applicant Org\n',
          headers: new HttpHeaders({
            'content-type': 'text/csv;charset=utf-8',
          }),
          status: 200,
        }),
      ),
    );

    await TestBed.configureTestingModule({
      imports: [StandardApplicants],
      providers: [
        provideRouter([]),
        { provide: StandardApplicantsApi, useValue: apiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StandardApplicants);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);
    searchForm = TestBed.inject(StandardApplicantsSearchFormService);
    searchState = TestBed.inject(StandardApplicantsSearchStateService);
    await flushSignalEffects(fixture);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not render table or pagination before first search', () => {
    expect(fixture.debugElement.query(By.css('app-sortable-table'))).toBeNull();
    expect(fixture.debugElement.query(By.css('app-pagination'))).toBeNull();
  });

  it('restores saved form values and reruns the saved search on init', async () => {
    searchForm.setState({
      code: 'SA01',
      name: 'Applicant Org',
    });
    searchState.setState({
      hasSearched: true,
      currentPage: 1,
      pageSize: 10,
      sortField: { key: 'name', direction: 'desc' },
      appliedFilters: {
        code: 'SA01',
        name: 'Applicant Org',
      },
    });

    fixture = TestBed.createComponent(StandardApplicants);
    component = fixture.componentInstance;
    await flushSignalEffects(fixture);

    expect(component.form.getRawValue()).toEqual({
      code: 'SA01',
      name: 'Applicant Org',
    });
    expect(getStandardApplicantsMock).toHaveBeenCalledWith(
      {
        code: 'SA01',
        name: 'Applicant Org',
        pageNumber: 1,
        pageSize: 10,
        sort: ['name,desc'],
      },
      'body',
      false,
      {
        transferCache: true,
      },
    );
  });

  it('submits search and requests first page with trimmed filters', async () => {
    component.form.patchValue({
      code: '  ABC  ',
      name: '  Test Applicant  ',
    });

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(getStandardApplicantsMock).toHaveBeenCalledWith(
      {
        code: 'ABC',
        name: 'Test Applicant',
        pageNumber: 0,
        pageSize: 10,
        sort: ['code,asc'],
      },
      'body',
      false,
      {
        transferCache: true,
      },
    );
  });

  it('shows validation errors and prevents submit when filters exceed max lengths', async () => {
    component.form.patchValue({
      code: '12345678901',
      name: 'x'.repeat(101),
    });

    getStandardApplicantsMock.mockClear();

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(getStandardApplicantsMock).not.toHaveBeenCalled();
    expect(component.vm().searchErrors).toHaveLength(2);
    expect(component.vm().searchErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'code',
          text: 'Code must be 10 characters or fewer',
          href: '#code',
        }),
        expect.objectContaining({
          id: 'name',
          text: 'Standard applicant name must be 100 characters or fewer',
          href: '#name',
        }),
      ]),
    );
    expect(component.fieldError('code')?.text).toBe(
      'Code must be 10 characters or fewer',
    );
    expect(component.fieldError('name')?.text).toBe(
      'Standard applicant name must be 100 characters or fewer',
    );

    const errorMessages = fixture.debugElement
      .queryAll(By.css('.govuk-error-message'))
      .map((debugEl) => debugEl.nativeElement.textContent.trim());

    expect(errorMessages).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Code must be 10 characters or fewer'),
        expect.stringContaining(
          'Standard applicant name must be 100 characters or fewer',
        ),
      ]),
    );
  });

  it('renders table after first search and shows no-data message for empty results', async () => {
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(
      fixture.debugElement.query(By.css('app-sortable-table')),
    ).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-pagination'))).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('#no-data-message')?.textContent,
    ).toContain('No results found.');
  });

  it('keeps the table mounted while a sort request is in flight when rows already exist', async () => {
    const inFlightResponse = new Subject<StandardApplicantPage>();

    getStandardApplicantsMock.mockReturnValueOnce(
      of({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 1,
        content: [
          {
            code: 'SA01',
            applicant: {
              organisation: {
                name: 'Applicant Org',
                contactDetails: { addressLine1: '1 Test Street' },
              },
            },
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
        ],
        elementsOnPage: 1,
        totalPages: 1,
      }),
    );

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    getStandardApplicantsMock.mockReturnValueOnce(inFlightResponse);

    component.onSortChange({ key: 'name', direction: 'desc' });
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.css('app-sortable-table'));
    expect(table).toBeTruthy();
    expect(table.componentInstance.loading()).toBe(true);

    inFlightResponse.next({
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      content: [
        {
          code: 'SA01',
          applicant: {
            organisation: {
              name: 'Applicant Org',
              contactDetails: { addressLine1: '1 Test Street' },
            },
          },
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
      ],
      elementsOnPage: 1,
      totalPages: 1,
    });
    inFlightResponse.complete();
    await flushSignalEffects(fixture);

    expect(
      fixture.debugElement.query(By.css('app-sortable-table')),
    ).toBeTruthy();
  });

  it('keeps existing results visible when validation errors are shown', async () => {
    getStandardApplicantsMock.mockReturnValueOnce(
      of({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 1,
        content: [
          {
            code: 'SA01',
            applicant: {
              organisation: {
                name: 'Applicant Org',
                contactDetails: { addressLine1: '1 Test Street' },
              },
            },
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
        ],
        elementsOnPage: 1,
        totalPages: 1,
      }),
    );

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    component.form.patchValue({
      name: 'x'.repeat(101),
    });

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(component.vm().searchErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'name',
          text: 'Standard applicant name must be 100 characters or fewer',
          href: '#name',
        }),
      ]),
    );
    expect(
      fixture.debugElement.query(By.css('app-error-summary')),
    ).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css('app-sortable-table')),
    ).toBeTruthy();
  });

  it('clears filters, results, pagination and errors when Clear search is clicked', async () => {
    getStandardApplicantsMock.mockReturnValueOnce(
      of({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 1,
        content: [
          {
            code: 'SA01',
            applicant: {
              organisation: {
                name: 'Applicant Org',
                contactDetails: { addressLine1: '1 Test Street' },
              },
            },
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
        ],
        elementsOnPage: 1,
        totalPages: 4,
      }),
    );

    component.form.patchValue({
      code: 'SA01',
      name: 'Applicant Org',
    });
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    component.form.patchValue({
      name: 'x'.repeat(101),
    });
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(component.vm().hasSearched).toBe(true);
    expect(component.vm().rows).toHaveLength(1);
    expect(component.vm().totalPages).toBe(4);
    expect(component.vm().searchErrors).toHaveLength(1);

    const clearButton = fixture.debugElement.query(
      By.css('form .govuk-button--secondary'),
    );
    clearButton.nativeElement.click();
    await flushSignalEffects(fixture);

    expect(component.form.getRawValue()).toEqual({ code: '', name: '' });
    expect(component.vm()).toEqual(
      expect.objectContaining({
        hasSearched: false,
        currentPage: 0,
        totalPages: 0,
        rows: [],
        isLoading: false,
        searchErrors: [],
      }),
    );
    expect(fixture.debugElement.query(By.css('app-sortable-table'))).toBeNull();
    expect(fixture.debugElement.query(By.css('app-pagination'))).toBeNull();
    expect(fixture.debugElement.query(By.css('app-error-summary'))).toBeNull();
  });

  it('ignores an in-flight search response after Clear search is clicked', async () => {
    const inFlightResponse = new Subject<StandardApplicantPage>();
    getStandardApplicantsMock.mockReturnValueOnce(inFlightResponse);

    component.form.patchValue({ code: 'SA01' });
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(component.vm().isLoading).toBe(true);

    const clearButton = fixture.debugElement.query(
      By.css('form .govuk-button--secondary'),
    );
    clearButton.nativeElement.click();
    await flushSignalEffects(fixture);

    inFlightResponse.next({
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      content: [
        {
          code: 'SA01',
          applicant: {
            organisation: {
              name: 'Applicant Org',
              contactDetails: { addressLine1: '1 Test Street' },
            },
          },
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
      ],
      elementsOnPage: 1,
      totalPages: 1,
    });
    inFlightResponse.complete();
    await flushSignalEffects(fixture);

    expect(component.vm()).toEqual(
      expect.objectContaining({
        hasSearched: false,
        rows: [],
        totalPages: 0,
        isLoading: false,
        searchErrors: [],
      }),
    );
    expect(fixture.debugElement.query(By.css('app-sortable-table'))).toBeNull();
  });

  it('ignores an in-flight search error after Clear search is clicked', async () => {
    const inFlightResponse = new Subject<StandardApplicantPage>();
    getStandardApplicantsMock.mockReturnValueOnce(inFlightResponse);

    component.form.patchValue({ code: 'SA01' });
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    const clearButton = fixture.debugElement.query(
      By.css('form .govuk-button--secondary'),
    );
    clearButton.nativeElement.click();
    await flushSignalEffects(fixture);

    inFlightResponse.error(new Error('Late failure'));
    await flushSignalEffects(fixture);

    expect(component.vm()).toEqual(
      expect.objectContaining({
        hasSearched: false,
        rows: [],
        totalPages: 0,
        isLoading: false,
        searchErrors: [],
      }),
    );
    expect(fixture.debugElement.query(By.css('app-error-summary'))).toBeNull();
  });

  it('loads selected page when pagination changes', async () => {
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);
    getStandardApplicantsMock.mockClear();

    component.onPageChange(3);
    await flushSignalEffects(fixture);

    expect(getStandardApplicantsMock).toHaveBeenCalledWith(
      {
        code: undefined,
        name: undefined,
        pageNumber: 3,
        pageSize: 10,
        sort: ['code,asc'],
      },
      'body',
      false,
      {
        transferCache: true,
      },
    );
  });

  it('ignores page changes while a page load is already in flight', async () => {
    const inFlightResponse = new Subject<StandardApplicantPage>();

    getStandardApplicantsMock.mockReturnValueOnce(
      of({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 1,
        content: [
          {
            code: 'SA01',
            applicant: {
              organisation: {
                name: 'Applicant Org',
                contactDetails: { addressLine1: '1 Test Street' },
              },
            },
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
        ],
        elementsOnPage: 1,
        totalPages: 4,
      }),
    );

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    getStandardApplicantsMock.mockReturnValueOnce(inFlightResponse);

    component.onPageChange(1);
    await flushSignalEffects(fixture);

    expect(component.vm().currentPage).toBe(1);
    expect(searchState.state().currentPage).toBe(1);
    expect(component.vm().isLoading).toBe(true);

    getStandardApplicantsMock.mockClear();

    component.onPageChange(2);
    await flushSignalEffects(fixture);

    expect(getStandardApplicantsMock).not.toHaveBeenCalled();
    expect(component.vm().currentPage).toBe(1);
    expect(searchState.state().currentPage).toBe(1);

    inFlightResponse.next({
      pageNumber: 1,
      pageSize: 10,
      totalElements: 1,
      content: [
        {
          code: 'SA01',
          applicant: {
            organisation: {
              name: 'Applicant Org',
              contactDetails: { addressLine1: '1 Test Street' },
            },
          },
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
      ],
      elementsOnPage: 1,
      totalPages: 4,
    });
    inFlightResponse.complete();
    await flushSignalEffects(fixture);
  });

  it('maps useFrom sort key to backend from parameter on the current page', async () => {
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);
    getStandardApplicantsMock.mockClear();

    component.onSortChange({ key: 'useFrom', direction: 'desc' });
    await flushSignalEffects(fixture);

    expect(getStandardApplicantsMock).toHaveBeenCalledWith(
      {
        code: undefined,
        name: undefined,
        pageNumber: 0,
        pageSize: 10,
        sort: ['from,desc'],
      },
      'body',
      false,
      {
        transferCache: true,
      },
    );
  });

  it('resets to the first page when sorting after paging', async () => {
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    getStandardApplicantsMock.mockReturnValueOnce(
      of({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 11,
        content: [
          {
            code: 'SA10',
            applicant: {
              organisation: {
                name: 'Applicant Org',
                contactDetails: { addressLine1: '10 Test Street' },
              },
            },
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
        ],
        elementsOnPage: 1,
        totalPages: 2,
      }),
    );

    getStandardApplicantsMock.mockClear();
    component.onPageChange(1);
    await flushSignalEffects(fixture);

    getStandardApplicantsMock.mockReturnValueOnce(
      of({
        pageNumber: 1,
        pageSize: 10,
        totalElements: 11,
        content: [
          {
            code: 'SA01',
            applicant: {
              organisation: {
                name: 'Applicant Org',
                contactDetails: { addressLine1: '1 Test Street' },
              },
            },
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
        ],
        elementsOnPage: 1,
        totalPages: 2,
      }),
    );

    component.onSortChange({ key: 'useFrom', direction: 'desc' });
    await flushSignalEffects(fixture);

    expect(getStandardApplicantsMock).toHaveBeenLastCalledWith(
      {
        code: undefined,
        name: undefined,
        pageNumber: 0,
        pageSize: 10,
        sort: ['from,desc'],
      },
      'body',
      false,
      {
        transferCache: true,
      },
    );
    expect(component.vm().currentPage).toBe(0);
  });

  it('sorts using the last applied filters when the current form is invalid', async () => {
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    component.form.patchValue({
      name: 'x'.repeat(101),
    });
    getStandardApplicantsMock.mockClear();

    component.onSortChange({ key: 'useFrom', direction: 'desc' });
    await flushSignalEffects(fixture);

    expect(getStandardApplicantsMock).toHaveBeenCalledWith(
      {
        code: undefined,
        name: undefined,
        pageNumber: 0,
        pageSize: 10,
        sort: ['from,desc'],
      },
      'body',
      false,
      {
        transferCache: true,
      },
    );
    expect(component.vm().sortField).toEqual({
      key: 'useFrom',
      direction: 'desc',
    });
  });

  it('paginates using the last applied filters when the current form is invalid', async () => {
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    component.form.patchValue({
      code: '12345678901',
    });
    getStandardApplicantsMock.mockClear();

    component.onPageChange(3);
    await flushSignalEffects(fixture);

    expect(getStandardApplicantsMock).toHaveBeenCalledWith(
      {
        code: undefined,
        name: undefined,
        pageNumber: 3,
        pageSize: 10,
        sort: ['code,asc'],
      },
      'body',
      false,
      {
        transferCache: true,
      },
    );
    expect(component.vm().currentPage).toBe(3);
  });

  it('updates rows and total pages on successful response', async () => {
    getStandardApplicantsMock.mockReturnValueOnce(
      of({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 1,
        content: [
          {
            code: 'SA01',
            applicant: {
              organisation: {
                name: 'Applicant Org',
                contactDetails: { addressLine1: '1 Test Street' },
              },
            },
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
        ],
        elementsOnPage: 1,
        totalPages: 7,
      }),
    );

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(component.vm().rows).toEqual([
      {
        code: 'SA01',
        name: 'Applicant Org',
        address: '1 Test Street',
        useFrom: '1 Jan 2026',
        useTo: '31 Dec 2026',
      },
    ]);
    expect(component.vm().totalPages).toBe(7);
    expect(component.vm().searchErrors).toEqual([]);
  });

  it('captures API errors into searchErrors state', async () => {
    getStandardApplicantsMock.mockReturnValueOnce(
      throwError(() => new Error('Request failed')),
    );

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(component.vm().rows).toEqual([]);
    expect(component.vm().totalPages).toBe(0);
    expect(component.vm().searchErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'search',
          text: 'Request failed',
        }),
      ]),
    );
    expect(
      fixture.debugElement.query(By.css('app-error-summary')),
    ).toBeTruthy();
  });

  it('shows an error state instead of the table no-data state when the search fails', async () => {
    getStandardApplicantsMock.mockReturnValueOnce(
      throwError(() => new Error('Request failed')),
    );

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(
      fixture.debugElement.query(By.css('app-error-summary')),
    ).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-sortable-table'))).toBeNull();
    expect(fixture.nativeElement.querySelector('#no-data-message')).toBeNull();
    expect(
      fixture.debugElement.query(By.css('app-notification-banner')),
    ).toBeNull();
  });

  it('exports CSV using the last applied filters and downloads a dated file', async () => {
    component.form.patchValue({
      code: ' SA01 ',
    });
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    const createObjectUrlSpy = jest.fn(() => 'blob:standard-applicants');
    const revokeObjectUrlSpy = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrlSpy,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrlSpy,
    });

    const link = document.createElement('a');
    const clickSpy = jest.spyOn(link, 'click').mockImplementation(() => {});
    const removeSpy = jest.spyOn(link, 'remove').mockImplementation(() => {});
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string): HTMLElement => {
        if (tagName === 'a') {
          return link;
        }

        return originalCreateElement(tagName);
      });
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');

    component.onExportButtonClick();
    await flushSignalEffects(fixture);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(standardApplicantsExportMock).toHaveBeenCalledWith(
      { code: 'SA01' },
      'response',
      false,
      {
        httpHeaderAccept: 'text/csv',
        transferCache: false,
      },
    );
    expect(createObjectUrlSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(link.href).toBe('blob:standard-applicants');
    expect(link.download).toMatch(/^export-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(appendChildSpy).toHaveBeenCalledWith(link);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:standard-applicants');
    expect(component.vm().exportSuccess).toBe(true);
    expect(
      fixture.nativeElement.querySelector('app-success-banner')?.textContent,
    ).toContain('Successfully exported CSV');
  });

  it('shows an export validation error when no code or name has been searched', async () => {
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    standardApplicantsExportMock.mockClear();
    component.onExportButtonClick();
    await flushSignalEffects(fixture);

    expect(standardApplicantsExportMock).not.toHaveBeenCalled();
    expect(component.vm().searchErrors).toEqual([
      {
        text: 'Either code or name must be provided, but not both. Please perform a search with either code or name',
      },
    ]);
  });

  it('shows an error when the export response body is missing', async () => {
    component.form.patchValue({
      name: ' Applicant Org ',
    });
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    standardApplicantsExportMock.mockReturnValueOnce(
      of(
        new HttpResponse({
          body: '',
          headers: new HttpHeaders({
            'content-type': 'text/csv;charset=utf-8',
          }),
          status: 200,
        }),
      ),
    );
    const createObjectUrlSpy = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrlSpy,
    });

    component.onExportButtonClick();
    await flushSignalEffects(fixture);

    expect(createObjectUrlSpy).not.toHaveBeenCalled();
    expect(component.vm().exportSuccess).toBe(false);
    expect(component.vm().searchErrors).toEqual([
      { text: 'Failed to export CSV. Please try again later' },
    ]);
  });

  it('shows an error and does not navigate when onViewClick is called without a code', async () => {
    const navigateSpy = jest.spyOn(router, 'navigate');

    await component.onViewClick({
      code: '',
      name: 'Applicant Org',
      address: '1 Test Street',
      useFrom: '1 Jan 2026',
      useTo: '31 Dec 2026',
    });

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(component.vm().searchErrors).toEqual([
      { text: 'Failed to load standard applicant. No code found' },
    ]);
  });

  it('navigates to the standard applicant view with row state when onViewClick is called with a code', async () => {
    const row = {
      code: 'SA01',
      name: 'Applicant Org',
      address: '1 Test Street',
      useFrom: '1 Jan 2026',
      useTo: '31 Dec 2026',
    };
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.onViewClick(row);

    expect(component.vm().searchErrors).toEqual([]);
    expect(navigateSpy).toHaveBeenCalledWith(['SA01'], {
      relativeTo: route,
      state: row,
    });
  });

  it('persists the current search snapshot before navigating to the view', async () => {
    getStandardApplicantsMock.mockReturnValueOnce(
      of({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 1,
        content: [
          {
            code: 'SA01',
            applicant: {
              organisation: {
                name: 'Applicant Org',
                contactDetails: { addressLine1: '1 Test Street' },
              },
            },
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
        ],
        elementsOnPage: 1,
        totalPages: 1,
      }),
    );

    component.form.patchValue({
      code: ' SA01 ',
      name: ' Applicant Org ',
    });

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.onViewClick({
      code: 'SA01',
      name: 'Applicant Org',
      address: '1 Test Street',
      useFrom: '1 Jan 2026',
      useTo: '31 Dec 2026',
    });

    expect(navigateSpy).toHaveBeenCalled();
    expect(searchForm.state()).toEqual({
      code: ' SA01 ',
      name: ' Applicant Org ',
    });
    expect(searchState.state()).toEqual({
      hasSearched: true,
      currentPage: 0,
      pageSize: 10,
      sortField: { key: 'code', direction: 'asc' },
      appliedFilters: {
        code: 'SA01',
        name: 'Applicant Org',
      },
    });
  });
});
