import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { StandardApplicants } from '@components/standard-applicants/standard-applicants.component';
import { StandardApplicantPage, StandardApplicantsApi } from '@openapi';

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
  const apiStub: Pick<StandardApplicantsApi, 'getStandardApplicants'> = {
    getStandardApplicants:
      getStandardApplicantsMock as unknown as StandardApplicantsApi['getStandardApplicants'],
  };

  beforeEach(async () => {
    getStandardApplicantsMock.mockReset();
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

    await TestBed.configureTestingModule({
      imports: [StandardApplicants],
      providers: [
        provideRouter([]),
        { provide: StandardApplicantsApi, useValue: apiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StandardApplicants);
    component = fixture.componentInstance;
    await flushSignalEffects(fixture);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not render table or pagination before first search', () => {
    expect(fixture.debugElement.query(By.css('app-sortable-table'))).toBeNull();
    expect(fixture.debugElement.query(By.css('app-pagination'))).toBeNull();
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

  it('keeps the current page number when sorting after paging', async () => {
    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    getStandardApplicantsMock.mockReturnValueOnce(
      of({
        pageNumber: 1,
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
        pageNumber: 1,
        pageSize: 10,
        sort: ['from,desc'],
      },
      'body',
      false,
      {
        transferCache: true,
      },
    );
    expect(component.vm().currentPage).toBe(1);
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
});
