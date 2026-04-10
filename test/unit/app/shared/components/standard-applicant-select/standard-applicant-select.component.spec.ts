import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { StandardApplicantSelectComponent } from '@components/standard-applicant-select/standard-applicant-select.component';
import {
  StandardApplicantGetSummaryDto,
  StandardApplicantsApi,
} from '@openapi';

// Simple mocked typed
type GetStandardApplicantsFn = jest.Mock<
  unknown,
  [
    params: unknown,
    ('body' | undefined)?,
    (boolean | undefined)?,
    { transferCache?: boolean; context?: unknown }?,
  ]
>;

function makeSummary(
  overrides: Partial<StandardApplicantGetSummaryDto> = {},
): StandardApplicantGetSummaryDto {
  return {
    // We only fill in the required fields
    code: overrides.code ?? 'SA-1',
    startDate: overrides.startDate ?? '2025-01-01',
    endDate: overrides.endDate ?? null,
    applicant: overrides.applicant ?? {
      organisation: {
        name: 'Org Name',
        contactDetails: {
          addressLine1: 'Line 1',
          addressLine2: undefined,
          addressLine3: undefined,
          addressLine4: undefined,
          addressLine5: undefined,
          postcode: 'AB1 2CD',
          phone: undefined,
          mobile: undefined,
          email: undefined,
        },
      },
    },
  };
}

describe('StandardApplicantSelectComponent', () => {
  let component: StandardApplicantSelectComponent;
  let fixture: ComponentFixture<StandardApplicantSelectComponent>;
  let mockGetStandardApplicants: GetStandardApplicantsFn;

  beforeEach(async () => {
    jest.resetAllMocks();

    mockGetStandardApplicants = jest.fn();

    // Default page returned by the API
    const defaultPage = {
      content: [makeSummary({ code: 'SA-1' })],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
    };

    mockGetStandardApplicants.mockReturnValue(of(defaultPage));

    const saApiMock = {
      getStandardApplicants: mockGetStandardApplicants,
    } as unknown as StandardApplicantsApi;

    await TestBed.configureTestingModule({
      imports: [StandardApplicantSelectComponent],
      providers: [{ provide: StandardApplicantsApi, useValue: saApiMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(StandardApplicantSelectComponent);
    component = fixture.componentInstance;
    // NOTE: we do NOT call detectChanges() here to allow tests to set Inputs first.
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads first page on init and maps rows from API', fakeAsync(() => {
    const page = {
      content: [
        makeSummary({
          code: 'SA-1',
          applicant: {
            person: {
              name: {
                title: 'Mr',
                firstForename: 'John',
                secondForename: 'Q',
                thirdForename: undefined,
                surname: 'Doe',
              },
              contactDetails: {
                addressLine1: '1 Person St',
                addressLine2: undefined,
                addressLine3: undefined,
                addressLine4: undefined,
                addressLine5: undefined,
                postcode: 'P1 1AA',
                phone: undefined,
                mobile: undefined,
                email: undefined,
              },
            },
          },
        }),
        makeSummary({
          code: 'SA-2',
          applicant: {
            organisation: {
              name: 'Example Org',
              contactDetails: {
                addressLine1: '2 Org Rd',
                addressLine2: undefined,
                addressLine3: undefined,
                addressLine4: undefined,
                addressLine5: undefined,
                postcode: 'O2 2BB',
                phone: undefined,
                mobile: undefined,
                email: undefined,
              },
            },
          },
        }),
      ],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 2,
      totalPages: 1,
    };

    mockGetStandardApplicants.mockReturnValueOnce(of(page));

    fixture.detectChanges();
    TestBed.tick();

    expect(mockGetStandardApplicants).toHaveBeenCalledWith(
      {
        code: undefined,
        name: undefined,
        pageNumber: 0,
        pageSize: 10,
        sort: ['code,asc'],
      },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );

    expect(component.rows).toHaveLength(2);
    expect(component.rows[0].code).toBe('SA-1');
    expect(component.rows[0].name).toContain('John');
    expect(component.rows[0].address).toBe('1 Person St');

    expect(component.rows[1].code).toBe('SA-2');
    expect(component.rows[1].name).toBe('Example Org');
    expect(component.rows[1].address).toBe('2 Org Rd');

    expect(component.vm().pageIndex).toBe(0);
    expect(component.vm().totalPages).toBe(1);
    expect(fixture.debugElement.query(By.css('app-sortable-table'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-pagination'))).toBeTruthy();
  }));

  it('uses selectedCode input to initialise selectedIds and emits changes when selection changes', fakeAsync(() => {
    // Pre-set selectedCode before first change detection
    fixture.componentRef.setInput('selectedCode', 'SA-2');

    const page = {
      content: [makeSummary({ code: 'SA-1' }), makeSummary({ code: 'SA-2' })],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 2,
      totalPages: 1,
    };

    mockGetStandardApplicants.mockReturnValueOnce(of(page));

    const emitSpy = jest.spyOn(component.selectedCodeChange, 'emit');

    fixture.detectChanges();
    TestBed.tick();

    // After init, selectedIds should reflect selectedCode
    expect(component.selectedIds.has('SA-2')).toBe(true);

    // Simulate user selecting a different row
    component.onSelectedIdsChange(new Set<string>(['SA-1']));

    expect(emitSpy).toHaveBeenCalledWith('SA-1');
  }));

  it('clears selection when selectedCode becomes null', fakeAsync(() => {
    fixture.componentRef.setInput('selectedCode', 'SA-1');
    fixture.detectChanges();
    TestBed.tick();

    expect(component.selectedIds.size).toBe(1);

    // Simulate input change from parent
    fixture.componentRef.setInput('selectedCode', null);
    fixture.detectChanges();
    TestBed.tick();

    expect(component.selectedIds.size).toBe(0);
  }));

  it('onPageChange triggers API call for requested page and updates pageIndex', fakeAsync(() => {
    fixture.detectChanges();
    TestBed.tick();

    const secondPage = {
      content: [makeSummary({ code: 'SA-10' })],
      pageNumber: 1,
      pageSize: 10,
      totalElements: 11,
      totalPages: 2,
    };

    mockGetStandardApplicants.mockReturnValueOnce(of(secondPage));

    component.onPageChange(1);
    TestBed.tick();

    expect(mockGetStandardApplicants).toHaveBeenLastCalledWith(
      {
        code: undefined,
        name: undefined,
        pageNumber: 1,
        pageSize: 10,
        sort: ['code,asc'],
      },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );

    expect(component.vm().pageIndex).toBe(1);
    expect(component.vm().totalPages).toBe(2);
    expect(component.rows[0].code).toBe('SA-10');
  }));

  it('handles API error by clearing rows and totalPages', fakeAsync(() => {
    fixture.detectChanges();
    TestBed.tick();
    mockGetStandardApplicants.mockReturnValueOnce(
      throwError(() => new Error('network')),
    );

    component.onPageChange(1);
    TestBed.tick();
    expect(component.rows).toEqual([]);
    expect(component.vm().totalPages).toBe(0);
  }));

  it('maps useTo sort key to backend to and reloads first page', fakeAsync(() => {
    fixture.detectChanges();
    TestBed.tick();

    component.onSortChange({ key: 'useTo', direction: 'desc' });
    TestBed.tick();

    expect(mockGetStandardApplicants).toHaveBeenLastCalledWith(
      {
        code: undefined,
        name: undefined,
        pageNumber: 0,
        pageSize: 10,
        sort: ['to,desc'],
      },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );
    expect(component.vm().pageIndex).toBe(0);
  }));

  it('submits trimmed code and name filters', fakeAsync(() => {
    fixture.detectChanges();
    component.form.patchValue({ code: ' SA-1 ', name: ' Example ' });

    component.onSubmit(new SubmitEvent('submit'));
    TestBed.tick();

    expect(mockGetStandardApplicants).toHaveBeenCalledWith(
      {
        code: 'SA-1',
        name: 'Example',
        pageNumber: 0,
        pageSize: 10,
        sort: ['code,asc'],
      },
      'body',
      false,
      expect.objectContaining({ transferCache: true }),
    );
  }));
});
