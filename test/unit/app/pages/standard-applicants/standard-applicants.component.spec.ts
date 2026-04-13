import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { StandardApplicants } from '@components/standard-applicants/standard-applicants.component';
import { StandardApplicantsApi } from '@openapi';

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
  const apiStub: jest.Mocked<
    Pick<StandardApplicantsApi, 'getStandardApplicants'>
  > = {
    getStandardApplicants: jest.fn(),
  };

  beforeEach(async () => {
    apiStub.getStandardApplicants.mockReturnValue(
      of({
        content: [],
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

    expect(apiStub.getStandardApplicants).toHaveBeenCalledWith(
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

  it('loads selected page when pagination changes', async () => {
    component.onPageChange(3);
    await flushSignalEffects(fixture);

    expect(apiStub.getStandardApplicants).toHaveBeenCalledWith(
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

  it('maps useFrom sort key to backend from parameter', async () => {
    component.onSortChange({ key: 'useFrom', direction: 'desc' });
    await flushSignalEffects(fixture);

    expect(apiStub.getStandardApplicants).toHaveBeenCalledWith(
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

  it('updates rows and total pages on successful response', async () => {
    apiStub.getStandardApplicants.mockReturnValueOnce(
      of({
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
        useFrom: '01/01/2026',
        useTo: '31/12/2026',
      },
    ]);
    expect(component.vm().totalPages).toBe(7);
    expect(component.vm().searchErrors).toEqual([]);
  });

  it('captures API errors into searchErrors state', async () => {
    apiStub.getStandardApplicants.mockReturnValueOnce(
      throwError(() => new Error('Request failed')),
    );

    component.onSubmit(new SubmitEvent('submit'));
    await flushSignalEffects(fixture);

    expect(component.vm().rows).toEqual([]);
    expect(component.vm().totalPages).toBe(0);
    expect(component.vm().searchErrors).toEqual([
      { id: 'search', text: 'Request failed' },
    ]);
  });
});
